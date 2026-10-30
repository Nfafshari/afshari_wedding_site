import type { Attendance, PlusOneStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const CHIP = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  PENDING: 'No reply',
  ATTENDING: 'Attending',
  DECLINED: 'Declined',
};

const ATTENDANCE_STYLE: Record<Attendance, string> = {
  PENDING: 'bg-muted/40 text-burg/70',
  ATTENDING: 'bg-olivine/30 text-burg',
  DECLINED: 'bg-destructive/15 text-destructive',
};

const PLUS_ONE_LABEL: Record<PlusOneStatus, string> = {
  PENDING: 'Needs approval',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
};

const PLUS_ONE_STYLE: Record<PlusOneStatus, string> = {
  PENDING: 'bg-gold/30 text-burg',
  APPROVED: 'bg-olivine/30 text-burg',
  REJECTED: 'bg-destructive/15 text-destructive',
};

export function AttendanceChip ({ attendance, className }: { attendance: Attendance; className?: string }) {
  return <span className={cn(CHIP, ATTENDANCE_STYLE[attendance], className)}>{ATTENDANCE_LABEL[attendance]}</span>;
}

export function PlusOneChip ({ status, className }: { status: PlusOneStatus; className?: string }) {
  return <span className={cn(CHIP, PLUS_ONE_STYLE[status], className)}>{PLUS_ONE_LABEL[status]}</span>;
}

export { ATTENDANCE_LABEL, PLUS_ONE_LABEL };
