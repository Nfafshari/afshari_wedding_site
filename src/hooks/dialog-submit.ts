import { useState } from "react";

/** Mirrors the ActionResult contract every server action returns. */
type ActionResult<Field extends string> =
  | { ok: true }
  | { ok: false; error: string; field?: Field };

/**
 * Shared submit lifecycle for the form dialogs. Tracks the in-flight state and
 * the last server error, runs an action, and calls onSuccess when it succeeds.
 *
 * Each dialog still owns its own inputs and client-side validation — this only
 * absorbs the loading/error/run-action boilerplate every dialog repeated.
 *
 * @param onSuccess - called after the action succeeds (usually closes the dialog)
 */
export function useDialogSubmit<Field extends string>(onSuccess: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverErrorField, setServerErrorField] = useState<Field | null>(null);

  /** Clears the last server error — call this as the user edits an input. */
  function clearServerError() {
    setServerError('');
    setServerErrorField(null);
  }

  /** Runs a server action, tracking loading + error and closing on success. */
  async function runAction(action: () => Promise<ActionResult<Field>>) {
    setIsLoading(true);
    const result = await action();
    setIsLoading(false);

    if (!result.ok) {
      setServerError(result.error);
      setServerErrorField(result.field ?? null);
      return;
    }

    onSuccess();
  }

  return { isLoading, serverError, serverErrorField, clearServerError, runAction };
}
