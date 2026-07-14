"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { createBudgetSubcategory, type ErrorField } from "../../action";
import type { BudgetCategory } from "../../page";
import { parseMoneyString, toAmount } from "@/lib/utils";

interface AddSubcategoryDialogProps {
  /** All categories, used to find the target category for the duplicate-name check. */
  budgetCategories: BudgetCategory[];
  /** The category the new subcategory will belong to. */
  budgetCategoryId: number | null;
  /** Called after a subcategory is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddSubcategoryDialog({ budgetCategories, budgetCategoryId, onSuccess }: AddSubcategoryDialogProps) {
  const [name, setName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  /**
   * Validates the subcategory name by checking if it is empty or already taken within its category
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Subcategory name cannot be empty.';
    }

    // A subcategory name only has to be unique *within its own category*.
    const targetCategory = budgetCategories.find((cat) => cat.id === budgetCategoryId);
    const isDuplicate = targetCategory?.budgetSubcategories.some(
      (sub) => sub.name.toLowerCase().trim() === name.toLowerCase().trim()
    ) ?? false;
    if (isDuplicate) {
      return 'This category already has that subcategory!';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validated estimated cost by checking if it is empty or does not match currency format
   * @param value - string value of estimated cost
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function estimatedCostValidator (value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      // return a message if validation fails
      return "Estimated cost cannot be empty.";
    }

    const parsedEstimatedCost = parseMoneyString(trimmedValue);
    if (parsedEstimatedCost === null) {
      return 'Estimated cost must include only numbers and at most 2 decimal places. (i.e. "1,000", "1.0", or "1.25")';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validated paid amount by checking it does not match currency format (blank is allowed and treated as 0)
   * @param value - string value of paid amount
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function paidAmountValidator (value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      // blank paid amount defaults to 0, so it's valid
      return null;
    }

    const parsedPaidAmount = parseMoneyString(trimmedValue);
    if (parsedPaidAmount === null) {
      return 'Amount paid must include only numbers and at most 2 decimal places. (i.e. "1,000", "1.0", or "5.25")';
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addSubcategory() {
    // Validate every field into one local object, then gate on it
    const errors: Partial<Record<ErrorField, string>> = {};

    const nameError = nameValidator(name);
    if (nameError) {
      errors.name = nameError;
    }

    const estimatedCostError = estimatedCostValidator(estimatedCost);
    if (estimatedCostError) {
      errors.estimatedCost = estimatedCostError;
    }

    const paidAmountError = paidAmountValidator(paidAmount);
    if (paidAmountError) {
      errors.paidAmount = paidAmountError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Validation passed, so estimated cost parses and paid amount parses (or is blank).
    const parsedEstimated = parseMoneyString(estimatedCost);
    const parsedPaid = paidAmount.trim() === '' ? 0 : parseMoneyString(paidAmount);
    if (parsedEstimated === null || parsedPaid === null) return;

    await runAction(() => createBudgetSubcategory(name, parsedEstimated, parsedPaid, budgetCategoryId));
  }

  return (
    <FormDialog
      id="add-subcategory-dialog"
      title="Add New Subcategory?"
      isLoading={isLoading}
      onSubmit={addSubcategory}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="subcategory-name">Subcategory Name</FieldLabel>
        <Input
          id="subcategory-name"
          type="text"
          placeholder="Subcategory"
          className={`bg-popover text-burg rounded-sm ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setName(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ name, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = nameValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, name: msg }));
            } else {
              setFieldErrors(({ name, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
        {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="subcategory-estimate">Estimated Cost</FieldLabel>
        <InputGroup className={`bg-popover text-burg ${(fieldErrors.estimatedCost || serverErrorField === 'estimatedCost') ? 'border-destructive' : 'border-input'}`}>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            id="subcategory-estimate"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={estimatedCost}
            onChange={(e) => {
              setEstimatedCost(e.target.value);
              // Typing clears any previous error so the user gets a fresh start.
              if (e.target.value.trim() !== '') {
                setFieldErrors(({ estimatedCost, ...rest }) => rest);
              }
              clearServerError();
            }}
            onBlur={(e) => {
              const msg = estimatedCostValidator(e.target.value);
              if (msg) {
                setFieldErrors(prev => ({ ...prev, estimatedCost: msg }));
              } else {
                setFieldErrors(({ estimatedCost, ...rest }) => rest);

                // Known-good, so snap the field to canonical formatting ("1000" -> "1,000.00").
                const parsedEstimatedCost = parseMoneyString(e.target.value);
                if (parsedEstimatedCost !== null) {
                  setEstimatedCost(toAmount(parsedEstimatedCost));
                }
              }
            }}
          />
        </InputGroup>
        {fieldErrors.estimatedCost && <p className="text-destructive/80 text-xs">{fieldErrors.estimatedCost}</p>}
        {(serverError && serverErrorField === 'estimatedCost') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="subcategory-paid">Amount Paid</FieldLabel>
        <InputGroup className={`bg-popover text-burg ${(fieldErrors.paidAmount || serverErrorField === 'paidAmount') ? 'border-destructive' : 'border-input'}`}>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            id="subcategory-paid"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={paidAmount}
            onChange={(e) => {
              setPaidAmount(e.target.value);
              // Typing clears any previous error so the user gets a fresh start.
              if (e.target.value.trim() !== '') {
                setFieldErrors(({ paidAmount, ...rest }) => rest);
              }
              clearServerError();
            }}
            onBlur={(e) => {
              const msg = paidAmountValidator(e.target.value);
              if (msg) {
                setFieldErrors(prev => ({ ...prev, paidAmount: msg }));
              } else {
                setFieldErrors(({ paidAmount, ...rest }) => rest);

                // Known-good, so snap the field to canonical formatting. A blank paid
                // amount defaults to 0, which formats to "0.00" on its own.
                const parsedPaidAmount = e.target.value.trim() === '' ? 0 : parseMoneyString(e.target.value);
                if (parsedPaidAmount !== null) {
                  setPaidAmount(toAmount(parsedPaidAmount));
                }
              }
            }}
          />
        </InputGroup>
        {fieldErrors.paidAmount && <p className="text-destructive/80 text-xs">{fieldErrors.paidAmount}</p>}
        {(serverError && serverErrorField === 'paidAmount') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors (e.g. category vanished) show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'budgetCategory')) && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
