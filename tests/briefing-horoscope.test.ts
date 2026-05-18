import { describe, expect, it } from "vitest";
import { buildSourceDrivenChineseSummary, isCurrentSourceDate } from "@/lib/briefing/horoscope";

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

  it("accepts the same Asia/Shanghai source day", () => {
    const sourceDate = new Date("2026-05-18T04:00:00Z");
    const now = new Date("2026-05-18T10:00:00Z");

    expect(isCurrentSourceDate(sourceDate, now)).toBe(true);
  });

  it("accepts yesterday's source day before 08:00 in Asia/Shanghai", () => {
    const sourceDate = new Date("2026-05-17T04:00:00Z");
    const now = new Date("2026-05-17T23:30:00Z");

    expect(isCurrentSourceDate(sourceDate, now)).toBe(true);
  });

  it("rejects yesterday's source day at or after 08:00 in Asia/Shanghai", () => {
    const sourceDate = new Date("2026-05-17T04:00:00Z");
    const now = new Date("2026-05-18T00:00:00Z");

    expect(isCurrentSourceDate(sourceDate, now)).toBe(false);
  });

  it("rejects source days older than yesterday even before 08:00 in Asia/Shanghai", () => {
    const sourceDate = new Date("2026-05-16T04:00:00Z");
    const now = new Date("2026-05-17T23:30:00Z");

    expect(isCurrentSourceDate(sourceDate, now)).toBe(false);
  });
});
