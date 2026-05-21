import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionValue } from "@/lib/auth";
import { rejectCrossOrigin } from "@/lib/request-guard";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const cookieStore = await cookies();
  // Increment tokenVersion to invalidate all sessions server-side before
  // clearing the cookie, so stolen cookies cannot be reused.
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (session?.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return NextResponse.json({ ok: true });
}
