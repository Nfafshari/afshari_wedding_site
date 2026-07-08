"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useDialogSubmit } from "@/hooks/dialog-submit";

import { createBudgetSubcategory, type ErrorField } from "../../action";
import type { BudgetCategory } from "../../page";

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
  const [paidAmount, setPaidAmount] = useState('');
  const [isEmptyName, setIsEmptyName] = useState(false);
  const [isUniqueName, setIsUniqueName] = useState(true);
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // Clears any prior error the moment the user starts fixing their input.
  function clearErrors() {
    setIsEmptyName(false);
    setIsUniqueName(true);
    clearServerError();
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addSubcategory() {
    // Client-side checks for instant feedback (the server re-checks these too).
    if (name.trim() === '') {
      setIsEmptyName(true);
      return;
    }

    // A subcategory name only has to be unique *within its own category*.
    const targetCategory = budgetCategories.find((cat) => cat.id === budgetCategoryId);
    const isDuplicate = targetCategory?.budgetSubCategories.some(
      (sub) => sub.name.toLowerCase().trim() === name.toLowerCase().trim()
    ) ?? false;

    if (isDuplicate) {
      setIsUniqueName(false);
      return;
    }

    // Money inputs are free text; convert to numbers (blank paid = 0). The server
    // rejects NaN / negatives and flags the offending field.
    const parsedEstimated = Number(estimatedCost);
    const parsedPaid = paidAmount.trim() === '' ? 0 : Number(paidAmount);

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
          className={`bg-popover text-burg rounded-sm ${(isEmptyName || !isUniqueName || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setName(e.target.value);
            clearErrors();
          }}
        />
        {isEmptyName && <p className="text-destructive/80 text-xs">Subcategory name cannot be empty</p>}
        {!isUniqueName && <p className="text-destructive/80 text-xs">This category already has that subcategory!</p>}
        {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="subcategory-estimate">Estimated Cost</FieldLabel>
        <InputGroup className={`bg-popover text-burg ${serverErrorField === 'estimatedCost' ? 'border-destructive' : 'border-input'}`}>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            id="subcategory-estimate"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={estimatedCost}
            onChange={(e) => {
              setEstimatedCost(e.target.value);
              clearErrors();
            }}
          />
        </InputGroup>
        {(serverError && serverErrorField === 'estimatedCost') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="subcategory-paid">Amount Paid</FieldLabel>
        <InputGroup className={`bg-popover text-burg ${serverErrorField === 'paidAmount' ? 'border-destructive' : 'border-input'}`}>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            id="subcategory-paid"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={paidAmount}
            onChange={(e) => {
              setPaidAmount(e.target.value);
              clearErrors();
            }}
          />
        </InputGroup>
        {(serverError && serverErrorField === 'paidAmount') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors (e.g. category vanished) show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'budgetCategory')) && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
