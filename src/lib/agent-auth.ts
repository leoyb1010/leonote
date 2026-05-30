import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashAgentToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function createAgentTokenSecret() {
  return crypto.randomBytes(32).toString("base64url");
}

export function parseAgentScopes(scopes: string) {
  return scopes
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export async function resolveAgentToken(request: Request, requiredScopes: string | string[]) {
  const authorization = request.headers.get("authorization") ?? "";
  const raw = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!raw) return { ok: false as const, status: 401, message: "缺少 Agent Token" };

  const token = await prisma.agentToken.findUnique({
    where: { tokenHash: hashAgentToken(raw) },
    select: {
      id: true,
      userId: true,
      scopes: true,
      revoked: true,
    },
  });

  if (!token || token.revoked) {
    return { ok: false as const, status: 401, message: "Token 无效或已吊销" };
  }

  const scopes = parseAgentScopes(token.scopes);
  const required = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
  if (required.some((scope) => !scopes.includes(scope))) {
    return { ok: false as const, status: 403, message: "权限不足" };
  }

  prisma.agentToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => undefined);

  return { ok: true as const, userId: token.userId, tokenId: token.id, scopes };
}
