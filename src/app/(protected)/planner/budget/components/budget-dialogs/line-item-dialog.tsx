"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { BudgetStatus } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { BUDGET_STATUS } from "@/lib/status";
import { cn, parseMoneyString, toAmount, toCurrency } from "@/lib/utils";
import { checkMoney, checkRequired, checkUniqueName } from "@/lib/validate";

import { createBudgetSubcategory, deleteBudgetSubcategory, updateBudgetSubcategory, type BudgetSubcategoryInput, type ErrorField } from "../../action";
import type { BudgetCategory, BudgetSubcategory } from "../../page";

interface LineItemDialogProps {
  budgetCategories: BudgetCategory[];
  /** The line item to edit. Leave out to add a new one. */
  lineItem?: BudgetSubcategory;
  /** The category a new line item starts in. */
  defaultCategoryId?: number | null;
  /** Called after a save or delete so the parent can close the dialog. */
  onSuccess: () => void;
}

const STATUSES = Object.values(BudgetStatus);

/** Money is compared in cents, so "100" and "100.00" don't count as a change. */
function sameMoney (a: number, b: number) {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Adds a line item (empty form, Add) or edits one (filled form, Save changes, Delete). */
export default function LineItemDialog({ budgetCategories, lineItem, defaultCategoryId, onSuccess }: LineItemDialogProps) {
  const [name, setName] = useState(lineItem?.name ?? '');
  const [categoryId, setCategoryId] = useState(lineItem?.budgetCategoryId ?? defaultCategoryId ?? budgetCategories[0]?.id);
  const [estimatedCost, setEstimatedCost] = useState(lineItem ? toAmount(lineItem.estimatedCost) : '');
  const [paidAmount, setPaidAmount] = useState(lineItem ? toAmount(lineItem.paidAmount) : '0.00');
  const [status, setStatus] = useState<BudgetStatus>(lineItem?.status ?? BudgetStatus.DUE);
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteActive, setIsDeleteActive] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // A name only has to be unique within its category, so check against the one it's going to.
  const takenNames = (budgetCategories.find((category) => category.id === categoryId)?.budgetSubcategories ?? [])
    .filter((item) => item.id !== lineItem?.id)
    .map((item) => item.name);

  // The messages come from lib/validate.ts, so they match what the server would say.
  const checks = {
    name: (value = name) => checkRequired(value, 'Line item name') ?? checkUniqueName(value, takenNames, 'line item', 'in this category'),
    estimatedCost: (value = estimatedCost) => checkMoney(parseMoneyString(value) ?? Number.NaN, 'Estimated cost'),
    paidAmount: (value = paidAmount) => checkMoney(parseMoneyString(value) ?? Number.NaN, 'Amount paid'),
  };

  const parsedEstimatedCost = parseMoneyString(estimatedCost);
  const parsedPaidAmount = parseMoneyString(paidAmount);
  const balance = parsedEstimatedCost !== null && parsedPaidAmount !== null ? parsedEstimatedCost - parsedPaidAmount : null;

  /** On blur: show any error, otherwise snap the amount to "1,000.00". */
  function checkAmount (field: 'estimatedCost' | 'paidAmount', value: string, set: (value: string) => void) {
    if (check(field, checks[field](value))) {
      const parsed = parseMoneyString(value);
      if (parsed !== null) set(toAmount(parsed));
    }
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    if (!checkAll({ name: checks.name(), estimatedCost: checks.estimatedCost(), paidAmount: checks.paidAmount() })) return;
    if (parsedEstimatedCost === null || parsedPaidAmount === null || categoryId === undefined) return;

    if (lineItem === undefined) {
      await runAction("Line item added", () => createBudgetSubcategory(name, parsedEstimatedCost, parsedPaidAmount, categoryId, status));
      return;
    }

    // Send only what changed, so the server leaves the other columns alone.
    const trimmedName = name.trim();
    const payload: BudgetSubcategoryInput = {
      name: trimmedName !== lineItem.name ? trimmedName : undefined,
      budgetCategoryId: categoryId !== lineItem.budgetCategoryId ? categoryId : undefined,
      estimatedCost: sameMoney(parsedEstimatedCost, lineItem.estimatedCost) ? undefined : parsedEstimatedCost,
      paidAmount: sameMoney(parsedPaidAmount, lineItem.paidAmount) ? undefined : parsedPaidAmount,
      status: status !== lineItem.status ? status : undefined,
    };

    // Nothing changed, so close without a pointless write.
    if (Object.values(payload).every((value) => value === undefined)) {
      onSuccess();
      return;
    }

    await runAction("Line item saved", () => updateBudgetSubcategory(lineItem.id, payload));
  }

  return (
    <>
      <FormDialog
        id="line-item-dialog"
        title={lineItem ? `Edit ${lineItem.name}` : "Add Line Item"}
        submitLabel={lineItem ? "Save changes" : "Add"}
        isLoading={isLoading && !isDeleteActive}
        error={!isDeleteActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={save}
      >
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="line-item-name">Name</FieldLabel>
          <Input
            id="line-item-name"
            type="text"
            placeholder="Florist deposit"
            value={name}
            aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
            onChange={(e) => {
              setName(e.target.value);
              clear('name');
              clearServerError();
            }}
            onBlur={() => check('name', checks.name())}
          />
          {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
          {(serverError && serverErrorField === 'name') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <Field className="flex w-full text-burg mt-2">
          <FieldLabel htmlFor="line-item-category">Category</FieldLabel>
          <Select
            value={categoryId === undefined ? undefined : String(categoryId)}
            onValueChange={(value) => {
              setCategoryId(Number(value));
              // The name may clash in the new category; the next blur or submit re-checks it.
              clear('name');
              clearServerError();
            }}
          >
            <SelectTrigger id="line-item-category" className="w-full" aria-invalid={serverErrorField === 'budgetCategory'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {budgetCategories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {(serverError && serverErrorField === 'budgetCategory') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="line-item-estimate">Estimated</FieldLabel>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
                id="line-item-estimate"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={estimatedCost}
                aria-invalid={Boolean(fieldErrors.estimatedCost || serverErrorField === 'estimatedCost')}
                onChange={(e) => {
                  setEstimatedCost(e.target.value);
                  clear('estimatedCost');
                  clearServerError();
                }}
                onBlur={(e) => checkAmount('estimatedCost', e.target.value, setEstimatedCost)}
              />
            </InputGroup>
            {fieldErrors.estimatedCost && <p className="text-destructive text-xs">{fieldErrors.estimatedCost}</p>}
            {(serverError && serverErrorField === 'estimatedCost') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="line-item-paid">Paid so far</FieldLabel>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
                id="line-item-paid"
                type="text"
                inputMode="decimal"
                value={paidAmount}
                aria-invalid={Boolean(fieldErrors.paidAmount || serverErrorField === 'paidAmount')}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  clear('paidAmount');
                  clearServerError();
                }}
                onBlur={(e) => checkAmount('paidAmount', e.target.value, setPaidAmount)}
              />
            </InputGroup>
            {fieldErrors.paidAmount && <p className="text-destructive text-xs">{fieldErrors.paidAmount}</p>}
            {(serverError && serverErrorField === 'paidAmount') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>
        </div>

        <Field className="flex w-full text-burg mt-2">
          <span id="line-item-status" className="text-sm font-medium">Status</span>
          <div role="group" aria-labelledby="line-item-status" className="inline-flex w-fit gap-0.5 rounded-md border bg-card p-0.5">
            {STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={status === option}
                onClick={() => {
                  setStatus(option);
                  clearServerError();
                }}
                className={cn(
                  "inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                  status === option ? "bg-primary text-primary-foreground" : "text-burgundy-600 hover:bg-accent hover:text-foreground"
                )}
              >
                {BUDGET_STATUS[option].label}
              </button>
            ))}
          </div>
          {balance !== null && <p className="text-xs text-burgundy-600">Balance due: {toCurrency(balance)}</p>}
          {(serverError && serverErrorField === 'status') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        {lineItem && (
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteActive(true);
            }}
          >
            Delete {lineItem.name}
          </Button>
        )}
      </FormDialog>
      {lineItem && (
        <ConfirmDialog
          open={isDeleteActive}
          onOpenChange={setIsDeleteActive}
          title={`Delete ${lineItem.name}?`}
          description="You can't undo this."
          isLoading={isLoading}
          error={serverError || undefined}
          onConfirm={() => runAction("Line item deleted", () => deleteBudgetSubcategory(lineItem.id))}
        />
      )}
    </>
  );
}
