import { useState } from "react";

/**
 * A dialog's client-side field errors. Pair with the checks in lib/validate.ts so the
 * dialog never writes its own error text.
 *
 * @example
 * const { errors, check, clear, checkAll } = useFieldErrors<ErrorField>();
 * <Input onBlur={() => check('name', checkRequired(name, 'Item name'))} onChange={() => clear('name')} />
 * if (!checkAll({ name: checkRequired(name, 'Item name'), link: checkHttpUrl(link, 'Product link') })) return;
 */
export function useFieldErrors<F extends string>() {
  const [errors, setErrors] = useState<Partial<Record<F, string>>>({});

  /** Shows or clears one field's message. @returns true when the field is fine */
  function check (field: F, message: string | null): boolean {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message; else delete next[field];
      return next;
    });
    return message === null;
  }

  /** Clears one field's message, e.g. as the user types a fresh value. */
  function clear (field: F) {
    check(field, null);
  }

  /** Replaces every message at once, for submit. @returns true when every field is fine */
  function checkAll (messages: Partial<Record<F, string | null>>): boolean {
    const next: Partial<Record<F, string>> = {};
    for (const field in messages) {
      const message = messages[field];
      if (message) next[field] = message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return { errors, check, clear, checkAll };
}
