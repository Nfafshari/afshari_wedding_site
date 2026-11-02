import type { Attendance, BudgetStatus, PlusOneStatus } from "@/generated/prisma/enums";

/*
 * Every status the planner shows as a chip: the word and its tone, in one place. The chip
 * always carries the word, so the tone never has to speak alone. Tones match Badge's variants.
 */

export type StatusTone = "neutral" | "success" | "warning" | "danger";

export type Status = { label: string; tone: StatusTone };

// Nothing paid yet is neutral, not red: most lines are due until close to the wedding.
export const BUDGET_STATUS: Record<BudgetStatus, Status> = {
  DUE: { label: "Due", tone: "neutral" },
  DEPOSIT: { label: "Deposit paid", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
};

export const ATTENDANCE_STATUS: Record<Attendance, Status> = {
  PENDING: { label: "No reply", tone: "neutral" },
  ATTENDING: { label: "Attending", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
};

export const PLUS_ONE_STATUS: Record<PlusOneStatus, Status> = {
  PENDING: { label: "Needs approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Not approved", tone: "danger" },
};

/** A registry item by how much of it is claimed: open, some left, or fully claimed. */
export function registryItemStatus(claimed: number, wanted: number): Status {
  if (claimed >= wanted) return { label: "Fully claimed", tone: "success" };
  if (claimed === 0) return { label: "Open", tone: "neutral" };
  return { label: `${wanted - claimed} left`, tone: "warning" };
}
