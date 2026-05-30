import { describe, expect, it } from "vitest";
import { buildNoteMarkdown } from "@/lib/agent-ingest";
import { createAgentTokenSecret, hashAgentToken, parseAgentScopes } from "@/lib/agent-auth";

describe("agent auth helpers", () => {
  it("hashes tokens and parses comma separated scopes", () => {
    expect(hashAgentToken("secret-token")).toHaveLength(64);
    expect(parseAgentScopes(" note:write, schedule:write ,, ")).toEqual(["note:write", "schedule:write"]);
  });

  it("generates random-looking token secrets", () => {
    const a = createAgentTokenSecret();
    const b = createAgentTokenSecret();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe("buildNoteMarkdown", () => {
  it("renders a stable agent note template", () => {
    const markdown = buildNoteMarkdown({
      source: "telegram",
      summary: "供应商会议摘要",
      bodyMarkdown: "## 待办\n- [ ] 准备合同",
      links: [{ url: "https://example.com/contract", label: "合同" }],
      now: new Date("2026-05-30T08:00:00.000Z"),
    });

    expect(markdown).toContain("> 📥 来自 telegram");
    expect(markdown).toContain("## 摘要\n供应商会议摘要");
    expect(markdown).toContain("## 待办\n- [ ] 准备合同");
    expect(markdown).toContain("- [合同](https://example.com/contract)");
  });
});
