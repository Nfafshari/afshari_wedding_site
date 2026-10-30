import type { Attendance, PlusOneStatus } from "@/generated/prisma/enums";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  PENDING: 'No reply',
  ATTENDING: 'Attending',
  DECLINED: 'Declined',
};

const ATTENDANCE_TONE: Record<Attendance, BadgeTone> = {
  PENDING: 'neutral',
  ATTENDING: 'success',
  DECLINED: 'danger',
};

const PLUS_ONE_LABEL: Record<PlusOneStatus, string> = {
  PENDING: 'Needs approval',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
};

const PLUS_ONE_TONE: Record<PlusOneStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export function AttendanceChip ({ attendance, className }: { attendance: Attendance; className?: string }) {
  return <Badge variant={ATTENDANCE_TONE[attendance]} className={className}>{ATTENDANCE_LABEL[attendance]}</Badge>;
}

export function PlusOneChip ({ status, className }: { status: PlusOneStatus; className?: string }) {
  return <Badge variant={PLUS_ONE_TONE[status]} className={className}>{PLUS_ONE_LABEL[status]}</Badge>;
}

export { ATTENDANCE_LABEL, PLUS_ONE_LABEL };
