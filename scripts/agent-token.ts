import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { createAgentTokenSecret, hashAgentToken } from "@/lib/agent-auth";

/**
 * Mint / list / revoke Agent API tokens (for Hermes, openclaw, etc.).
 *
 * Usage:
 *   npx tsx scripts/agent-token.ts create <name> [scopes] [--user <userId>]
 *   npx tsx scripts/agent-token.ts list
 *   npx tsx scripts/agent-token.ts revoke <tokenId|name>
 *
 *   scopes default: note:write,schedule:write  (comma separated)
 *
 * For Telegram reminder delivery, create a token whose NAME carries the chat id,
 * e.g.  npx tsx scripts/agent-token.ts create "telegram:123456789" note:write
 * (the send-due cron resolves the chat id from a token named telegram:<id>).
 *
 * The raw token is printed ONCE on creation — only its sha256 hash is stored.
 */

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function resolveUserId(): Promise<string> {
  const explicit = arg("--user");
  if (explicit) return explicit;
  const first = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true, email: true } });
  if (!first) throw new Error("no user found — register the first leonote user before minting tokens");
  console.log(`(using owner: ${first.email ?? first.id})`);
  return first.id;
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "create") {
    const name = process.argv[3];
    if (!name) throw new Error("usage: create <name> [scopes]");
    const scopesArg = process.argv[4] && !process.argv[4].startsWith("--") ? process.argv[4] : "note:write,schedule:write";
    const userId = await resolveUserId();
    const raw = createAgentTokenSecret();
    const token = await prisma.agentToken.create({
      data: { userId, name, tokenHash: hashAgentToken(raw), scopes: scopesArg },
      select: { id: true, name: true, scopes: true },
    });
    console.log("\n✅ Agent token created");
    console.log(`   id     : ${token.id}`);
    console.log(`   name   : ${token.name}`);
    console.log(`   scopes : ${token.scopes}`);
    console.log(`\n🔑 RAW TOKEN (shown once — give this to the agent):\n   ${raw}\n`);
    console.log(`   Use as:  Authorization: Bearer ${raw}\n`);
    return;
  }

  if (cmd === "list") {
    const tokens = await prisma.agentToken.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, scopes: true, revoked: true, lastUsedAt: true, createdAt: true },
    });
    if (!tokens.length) {
      console.log("(no agent tokens)");
      return;
    }
    for (const t of tokens) {
      console.log(
        `${t.revoked ? "⛔" : "✅"} ${t.id}  ${t.name}  [${t.scopes}]  lastUsed=${t.lastUsedAt?.toISOString() ?? "never"}`,
      );
    }
    return;
  }

  if (cmd === "revoke") {
    const key = process.argv[3];
    if (!key) throw new Error("usage: revoke <tokenId|name>");
    const result = await prisma.agentToken.updateMany({
      where: { OR: [{ id: key }, { name: key }] },
      data: { revoked: true },
    });
    console.log(`revoked ${result.count} token(s) matching "${key}"`);
    return;
  }

  console.log("usage: agent-token.ts <create|list|revoke> ...");
  process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("error:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
