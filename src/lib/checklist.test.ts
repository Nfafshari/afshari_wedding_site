import { describe, expect, it } from "vitest";

import { getChecklistStats, isDueSoon, isOverdue, isTaskFilter, matchesTaskFilter } from "./checklist";

// Noon Central on Nov 2, 2026. Central is UTC-6 in November.
const now = new Date("2026-11-02T12:00:00-06:00");
const task = (goalDate: string, status = false) => ({ goalDate: new Date(goalDate), status });

describe("isOverdue", () => {
  it("is overdue when not done and due before today", () => {
    expect(isOverdue(task("2026-11-01T12:00:00-06:00"), now)).toBe(true);
  });

  it("is not overdue on the day it is due", () => {
    expect(isOverdue(task("2026-11-02T00:00:00-06:00"), now)).toBe(false);
  });

  it("is never overdue once done", () => {
    expect(isOverdue(task("2026-10-01T12:00:00-05:00", true), now)).toBe(false);
  });

  it("counts days in Central time, not UTC", () => {
    // 11pm Central on Nov 1 is already Nov 2 in UTC, but it is yesterday here.
    expect(isOverdue(task("2026-11-01T23:00:00-06:00"), now)).toBe(true);
    // Just after midnight Central on Nov 2 is still Nov 2 here: due today.
    expect(isOverdue(task("2026-11-02T00:30:00-06:00"), new Date("2026-11-02T23:30:00-06:00"))).toBe(false);
  });
});

describe("isDueSoon", () => {
  it("covers today through the next 30 days, if not done", () => {
    expect(isDueSoon(task("2026-11-02T09:00:00-06:00"), now)).toBe(true);
    expect(isDueSoon(task("2026-12-02T09:00:00-06:00"), now)).toBe(true);
    expect(isDueSoon(task("2026-12-03T09:00:00-06:00"), now)).toBe(false);
    expect(isDueSoon(task("2026-11-10T09:00:00-06:00", true), now)).toBe(false);
  });

  it("leaves overdue tasks to the overdue count", () => {
    expect(isDueSoon(task("2026-11-01T09:00:00-06:00"), now)).toBe(false);
  });
});

describe("getChecklistStats", () => {
  it("totals done, overdue and due soon across categories", () => {
    const categories = [
      { tasks: [task("2026-10-01T12:00:00-05:00", true), task("2026-10-30T12:00:00-05:00")] },
      { tasks: [task("2026-11-20T12:00:00-06:00"), task("2027-06-01T12:00:00-05:00")] },
    ];
    expect(getChecklistStats(categories, now)).toEqual({ total: 4, done: 1, overdue: 1, dueSoon: 1 });
  });
});

describe("task filter", () => {
  it("shows to-do or done tasks, or all of them", () => {
    expect(matchesTaskFilter(task("2026-11-01", false), "todo")).toBe(true);
    expect(matchesTaskFilter(task("2026-11-01", true), "todo")).toBe(false);
    expect(matchesTaskFilter(task("2026-11-01", true), "done")).toBe(true);
    expect(matchesTaskFilter(task("2026-11-01", false), "all")).toBe(true);
  });

  it("accepts only known filters from the URL", () => {
    expect(isTaskFilter("done")).toBe(true);
    expect(isTaskFilter("later")).toBe(false);
    expect(isTaskFilter(null)).toBe(false);
  });
});
