import { describe, expect, it } from "vitest";
import { buildSourceDrivenChineseSummary } from "@/lib/briefing/horoscope";

describe("briefing horoscope summaries", () => {
  it("uses the source date and source-specific signals in Chinese summaries", () => {
    const summary = buildSourceDrivenChineseSummary(
      "Pisces, take a step back and reevaluate your priorities. Make a plan before saying yes to a new offer.",
      { id: "ellen", signKey: "pisces" },
      new Date("2026-05-17T12:00:00Z"),
    );

    expect(summary).toContain("5月17日");
    expect(summary).toContain("优先级");
    expect(summary).toContain("计划");
  });

  it("does not reuse a generic fallback sentence when live text has relationship signals", () => {
    const summary = buildSourceDrivenChineseSummary(
      "Libra, relationship communication improves when you listen first. A conversation with your partner can restore harmony.",
      { id: "leo", signKey: "libra" },
      new Date("2026-05-17T12:00:00Z"),
    );

    expect(summary).toContain("关系与沟通");
    expect(summary).toContain("共识");
    expect(summary).not.toContain("今天适合保持平衡感");
  });
});
