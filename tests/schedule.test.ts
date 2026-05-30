import { describe, expect, it } from "vitest";
import { endOfDay, endOfWeek, scheduleSourceLabel, scheduleStatusLabel, startOfDay, startOfWeek } from "@/lib/schedule";

describe("schedule helpers", () => {
  it("builds stable day boundaries", () => {
    const now = new Date("2026-05-18T10:20:30.000Z");

    expect(startOfDay(now).getHours()).toBe(0);
    expect(startOfDay(now).getMinutes()).toBe(0);
    expect(endOfDay(now).getHours()).toBe(23);
    expect(endOfDay(now).getMinutes()).toBe(59);
  });

  it("uses Sunday as the weekly workbench boundary", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");

    expect(startOfWeek(now).getDay()).toBe(0);
    expect(endOfWeek(now).getDay()).toBe(6);
  });

  it("normalizes unknown labels to safe defaults", () => {
    expect(scheduleStatusLabel("done")).toBe("已完成");
    expect(scheduleStatusLabel("unknown")).toBe("计划中");
    expect(scheduleSourceLabel("project")).toBe("项目");
    expect(scheduleSourceLabel("agent")).toBe("外部 Agent");
    expect(scheduleSourceLabel("unknown")).toBe("手动");
  });
});
