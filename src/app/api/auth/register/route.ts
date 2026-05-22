import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionValue,
  getSessionCookieOptions,
  hashPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientRateLimitKey } from "@/lib/request-guard";
import { parseJsonBody } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1).max(40),
  email: z.string().email(),
  password: z.string().min(8),
});

let registrationQueue = Promise.resolve();

async function runRegistrationSerially<T>(task: () => Promise<T>) {
  const previous = registrationQueue;
  let release!: () => void;
  registrationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "参数不合法" },
      { status: 400 },
    );
  }

  const allowRegistration =
    process.env.LEONOTE_ALLOW_REGISTRATION === "true";

  const headersList = await headers();
  const ip = getClientRateLimitKey(headersList);

  const ipLimit = checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "请求过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name.trim();
  const passwordHash = await hashPassword(parsed.data.password);
  let user;

  try {
    user = await runRegistrationSerially(() =>
      prisma.$transaction(async (tx) => {
        const existingCount = await tx.user.count();
        if (existingCount > 0 && !allowRegistration) {
          throw new Error("registration-closed");
        }

        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error("email-taken");
        }

        return tx.user.create({
          data: { name, email, passwordHash },
        });
      }),
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "registration-closed") {
      return NextResponse.json(
        { ok: false, message: "当前版本暂未开放公开注册" },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === "email-taken") {
      return NextResponse.json(
        { ok: false, message: "该邮箱已被使用" },
        { status: 409 },
      );
    }
    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: string }).code
        : "";
    if (code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "该邮箱已被使用" },
        { status: 409 },
      );
    }
    throw error;
  }

  const token = createSessionValue(user.id, user.tokenVersion);
  const [, expRaw] = token.split(".");
  const exp = Number(expRaw);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions(exp));

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
