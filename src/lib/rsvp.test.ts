import { describe, expect, it } from "vitest";

import { MAX_SHORT_TEXT, NAME_NOT_FOUND, countPartiesByFilter, filterParties, formatRsvpDeadline, isRsvpFilter, isRsvpOpen, partyHeadcountLabel, toLookupKey } from "./rsvp";

describe("toLookupKey", () => {
  it("normalizes a full name into the key guests are stored under", () => {
    expect(toLookupKey("  José  O'Neil ")).toEqual({ ok: true, key: "jose oneil" });
  });

  it("asks for a last name when only one name is given", () => {
    expect(toLookupKey("Grace")).toEqual({ ok: false, error: "Please enter your first and last name.", field: "name" });
  });

  it("treats an over-long name as not found, revealing nothing", () => {
    expect(toLookupKey("a ".repeat(MAX_SHORT_TEXT))).toEqual({ ok: false, error: NAME_NOT_FOUND, field: "name" });
  });
});

describe("RSVP deadline", () => {
  it("stays open until the last minute of August 1 in Central time", () => {
    expect(isRsvpOpen(new Date("2027-08-01T23:59:00-05:00"))).toBe(true);
    expect(isRsvpOpen(new Date("2027-08-02T00:00:30-05:00"))).toBe(false);
  });

  it("reads as the day guests see on the site", () => {
    expect(formatRsvpDeadline()).toBe("August 1, 2027");
  });
});

describe("partyHeadcountLabel", () => {
  const member = (attendance: "PENDING" | "ATTENDING" | "DECLINED") => ({ attendance, isPlusOne: false, plusOneStatus: null });
  const plusOne = (plusOneStatus: "PENDING" | "APPROVED" | "REJECTED") => ({ attendance: "PENDING" as const, isPlusOne: true, plusOneStatus });

  it("counts invited members until the party answers", () => {
    expect(partyHeadcountLabel({ respondedAt: null, guests: [member("PENDING"), member("PENDING")] })).toBe("2 invited");
  });

  it("counts approved plus-ones as coming, and leaves rejected ones out of the total", () => {
    const guests = [member("ATTENDING"), member("DECLINED"), plusOne("APPROVED"), plusOne("PENDING"), plusOne("REJECTED")];
    expect(partyHeadcountLabel({ respondedAt: new Date(), guests })).toBe("2 of 4 coming");
  });
});

describe("filterParties", () => {
  const guest = (name: string, attendance: "PENDING" | "ATTENDING" | "DECLINED" = "PENDING") =>
    ({ name, attendance, isPlusOne: false, plusOneStatus: null });
  const plusOne = (name: string, plusOneStatus: "PENDING" | "APPROVED") =>
    ({ name, attendance: "PENDING" as const, isPlusOne: true, plusOneStatus });

  const waiting = { partyName: "The Okafors", respondedAt: null, guests: [guest("Ada Okafor")] };
  const attending = { partyName: "The Lees", respondedAt: new Date(), guests: [guest("Min Lee", "ATTENDING"), plusOne("Sam Park", "PENDING")] };
  const declined = { partyName: "Zoë Ruiz", respondedAt: new Date(), guests: [guest("Zoë Ruiz", "DECLINED"), plusOne("Kai Ruiz", "APPROVED")] };
  const parties = [waiting, attending, declined];

  it("shows every party for all, and one group for each status filter", () => {
    expect(filterParties(parties, "all", "")).toEqual(parties);
    expect(filterParties(parties, "waiting", "")).toEqual([waiting]);
    expect(filterParties(parties, "attending", "")).toEqual([attending]);
    expect(filterParties(parties, "declined", "")).toEqual([declined]);
  });

  it("shows parties with a plus-one to review", () => {
    expect(filterParties(parties, "plus-ones", "")).toEqual([attending]);
  });

  it("finds a whole party by one guest's name, ignoring case and accents", () => {
    expect(filterParties(parties, "all", "sam")).toEqual([attending]);
    expect(filterParties(parties, "all", "zoe")).toEqual([declined]);
  });

  it("applies the filter and the search together", () => {
    expect(filterParties(parties, "waiting", "lee")).toEqual([]);
    expect(filterParties(parties, "attending", "lee")).toEqual([attending]);
  });

  it("counts each filter over the whole list", () => {
    expect(countPartiesByFilter(parties)).toEqual({ all: 3, waiting: 1, attending: 1, declined: 1, "plus-ones": 1 });
  });

  it("accepts only known filters from the URL", () => {
    expect(isRsvpFilter("declined")).toBe(true);
    expect(isRsvpFilter("nope")).toBe(false);
    expect(isRsvpFilter(null)).toBe(false);
  });
});
