import { useIsMobile } from "@/hooks/use-mobile";
import { toast, type ExternalToast } from "sonner";

// Shared toast styling so success/error notifications look and behave identically
// everywhere they're fired — the dialog-submit hook, the checklist dialogs, and
// the task row. Change the look here once and every toast follows.
const SUCCESS_TOAST: ExternalToast = {
  position: 'top-center',
  cancel: { label: "X", onClick: () => {} },
  cancelButtonStyle: { background: 'var(--olivine)' },
  style: {
    background: "var(--olivine)",
  },
};

const ERROR_TOAST: ExternalToast = {
  position: "top-center",
  cancel: { label: "X", onClick: () => {} },
  cancelButtonStyle: { background: 'var(--destructive)', color: 'white'},
  style: {
    background: "var(--destructive)",
    color: "white"
  },
};

/** Success notification used across the planner. */
export function notifySuccess(message: string) {
  toast.success(message, SUCCESS_TOAST);
}

/** Error notification used across the planner. */
export function notifyError(message: string) {
  toast.error(message, ERROR_TOAST);
}
