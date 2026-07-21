"use client";

import { useState } from "react";
import { Trash2, SquarePen } from "lucide-react";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { BudgetStatus } from "@/generated/prisma/enums";
import { parseMoneyString, toAmount, toCurrency } from "@/lib/utils";
import { BudgetSubcategory } from "../page";
import { ErrorField, updateBudgetSubcategory } from "../action";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface SubcategoryRowProps {
  subcategory: BudgetSubcategory;
  onDeleteSubcategory(subcategoryId: number): void;
  onEditSubcategory(subcategoryId: number): void;
}

// badge variants for select input
const BADGE_VARIANT = Object.values(BudgetStatus);

export default function SubcategoryRow ({ subcategory, onDeleteSubcategory, onEditSubcategory }: SubcategoryRowProps) {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});

  const { serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(() => {});

  /**
   * Validates the subcategory name by checking if it is empty
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Subcategory name cannot be empty.';
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
   * Validated paid amount by checking if it is empty or does not match currency format
   * @param value - string value of paid amount
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function paidAmountValidator (value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      // return a message if validation fails
      return "Amount paid cannot be empty.";
    } 
    
    const parsedPaidAmount = parseMoneyString(trimmedValue);
    if (parsedPaidAmount === null) {
      return 'Amount paid must include only numbers and at most 2 decimal places. (i.e. "1,000", "1.0", or "5.25")';
    }

    // return null if validation succeeded
    return null;
  }

  async function saveName (updatedName: string) {
    clearServerError();

    // validate name and exit if name is incorrect format, otherwise remove error
    const nameError = nameValidator(updatedName);
    if (nameError) {
      setFieldErrors(prev => ({ ...prev, name: nameError }));
      return;
    } else {
      setFieldErrors(({ name, ...rest }) => rest);
    }

    // check if name is the same as the current name, and just return to not update unecessarily
    const trimmedName = updatedName.trim();
    if (trimmedName === subcategory.name) {
      return;
    }

    // Send it. Server-side field errors surface via serverError / serverErrorField.
    await runAction("Subcategory updated", () => updateBudgetSubcategory(subcategory.id, { name: trimmedName }));
  }

  async function saveEstimatedCost (updatedEstimatedCost: string) {
    clearServerError();

    // validate estimated cost and exit if estimated cost is incorrect format, otherwise remove error
    const estimatedCostError = estimatedCostValidator(updatedEstimatedCost);
    if (estimatedCostError) {
      setFieldErrors(prev => ({ ...prev, estimatedCost: estimatedCostError }));
      return;
    } else {
      setFieldErrors(({ estimatedCost, ...rest }) => rest);
    }

    // check if estimated cost is the same as the current estimated cost, and just return to not update unecessarily
    const parsedEstimatedCost = parseMoneyString(updatedEstimatedCost);
    if (parsedEstimatedCost === subcategory.estimatedCost || parsedEstimatedCost === null) {
      return
    }

    // Send it. Server-side field errors surface via serverError / serverErrorField.
    await runAction("Estimated cost updated", () => updateBudgetSubcategory(subcategory.id, { estimatedCost: parsedEstimatedCost }));
  }

  async function savePaidAmount (updatedPaidAmount: string) {
    clearServerError();

    // validate paid amount and exit if paid amount is incorrect format, otherwise remove error
    const paidAmountError = paidAmountValidator(updatedPaidAmount);
    if (paidAmountError) {
      setFieldErrors(prev => ({ ...prev, paidAmount: paidAmountError }));
      return;
    } else {
      setFieldErrors(({ paidAmount, ...rest }) => rest);
    }

    // check if paid amount is the same as the current paid amount, and just return to not update unecessarily
    const parsedPaidAmount = parseMoneyString(updatedPaidAmount);
    if (parsedPaidAmount === subcategory.paidAmount || parsedPaidAmount === null) {
      return;
    }

    // Send it. Server-side field errors surface via serverError / serverErrorField.
    await runAction("Paid amount updated", () => updateBudgetSubcategory(subcategory.id, { paidAmount: parsedPaidAmount }));
  }

  async function saveStatus (updatedStatus: BudgetStatus) {
    clearServerError();

    // if new status is the same as the current status, do not update
    if (updatedStatus === subcategory.status) {
      return;
    }

    // Send it. Server-side field errors surface via serverError / serverErrorField.
    await runAction("Status updated", () => updateBudgetSubcategory(subcategory.id, { status: updatedStatus }));
  }

  return (
    <TableRow key={subcategory.id}>
      <TableCell>
        <div className="flex justify-center">
          {/** Show trash can on desktop and edit on mobile */}
          <Button
            variant={'ghost'}
            aria-label={`Delete ${subcategory.name}`}
            className="hidden text-gold/40 p-1 ml-1 hover:bg-destructive hover:text-background md:flex"
            onClick={() => {
              onDeleteSubcategory(subcategory.id)
            }}
          >
            <Trash2 />
          </Button>
          <Button
            variant={'ghost'}
            aria-label={`Edit ${subcategory.name}`}
            className="text-gold/40 p-1 ml-1 hover:bg-olivine hover:text-background md:hidden"
            onClick={() => {
              onEditSubcategory(subcategory.id)
            }}
          >
            <SquarePen />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex flex-col overflow-x-scroll pb-2 text-lg md:hidden">
          {subcategory.name}
          <p className="text-xs text-accent">{toCurrency(subcategory.estimatedCost)} est. <span className="text-sm leading-tight">•</span> {toCurrency(subcategory.paidAmount)} paid</p>
        </div>
        <div className="hidden md:flex md:flex-col">
          <InputGroup className={`border-transparent rounded-sm hover:border-border w-fit min-w-20 ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : ''}`}>
            <InputGroupInput
              className="field-sizing-content text-lg! flex-none!"
              defaultValue={subcategory.name}
              onBlur={(e) => {
                saveName(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  e.currentTarget.value = subcategory.name;
                  e.currentTarget.blur();
                }
              }}
            />
          </InputGroup>
          {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
          {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          {/* Unexpected server failures come back with no field (see action.ts), so they'd otherwise be invisible. Fall back to showing them on the row's widest cell. */}
          {(serverError && serverErrorField === null) && <p className="text-destructive/80 text-xs">{serverError}</p>}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <InputGroup className={`border-transparent rounded-sm hover:border-border w-fit min-w-20 ${(fieldErrors.estimatedCost || serverErrorField === 'estimatedCost') ? 'border-destructive' : ''}`}>
          <InputGroupAddon className="text-lg text-foreground">$</InputGroupAddon>
          <InputGroupInput
            className="field-sizing-content flex-none! text-lg! pl-px!"
            defaultValue={toAmount(subcategory.estimatedCost)}
            onBlur={(e) => {
              // Snap to canonical formatting first; garbage is left alone so the
              // user can see it next to the validation error.
              const parsedEstimatedCost = parseMoneyString(e.target.value);
              if (parsedEstimatedCost !== null) {
                e.target.value = toAmount(parsedEstimatedCost);
              }

              saveEstimatedCost(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                e.currentTarget.value = toAmount(subcategory.estimatedCost);
                e.currentTarget.blur();
              }
            }}
          />
        </InputGroup>
        {fieldErrors.estimatedCost && <p className="overflow-x-scroll text-destructive/80 text-xs">{fieldErrors.estimatedCost}</p>}
        {(serverError && serverErrorField === 'estimatedCost') && <p className="overflow-x-scroll text-destructive/80 text-xs">{serverError}</p>}
      </TableCell>
      <TableCell className="hidden md:table-cell pl-0!">
        <InputGroup className={`border-transparent rounded-sm hover:border-border w-fit min-w-20 ${(fieldErrors.paidAmount || serverErrorField === 'paidAmount') ? 'border-destructive' : ''}`}>
          <InputGroupAddon className="text-lg text-foreground">$</InputGroupAddon>
          <InputGroupInput
            className="field-sizing-content flex-none! text-lg! pl-px!"
            defaultValue={toAmount(subcategory.paidAmount)}
            onBlur={(e) => {
              // Snap to canonical formatting first; garbage is left alone so the
              // user can see it next to the validation error.
              const parsedPaidAmount = parseMoneyString(e.target.value);
              if (parsedPaidAmount !== null) {
                e.target.value = toAmount(parsedPaidAmount);
              }

              savePaidAmount(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                e.currentTarget.value = toAmount(subcategory.paidAmount);
                e.currentTarget.blur();
              }
            }}
          />
        </InputGroup>
        {fieldErrors.paidAmount && <p className="overflow-x-scroll text-destructive/80 text-xs">{fieldErrors.paidAmount}</p>}
        {(serverError && serverErrorField === 'paidAmount') && <p className="overflow-x-scroll text-destructive/80 text-xs">{serverError}</p>}
      </TableCell>
      <TableCell className="text-right text-lg">{toCurrency(subcategory.estimatedCost - subcategory.paidAmount)}</TableCell>
      <TableCell className="flex flex-col items-end text-right">
        <div className="hidden md:flex">
          <Select
            value={subcategory.status}
            onValueChange={(val: BudgetStatus) => {
              saveStatus(val)
            }}
          >
            <SelectTrigger
              align="left"
              className="border-transparent [&_svg]:text-transparent hover:[&_svg]:text-muted-foreground focus:ring-0! hover:border-border"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {BADGE_VARIANT.map((badge) => (
                  <SelectItem
                    key={badge} value={badge}
                    className="focus:bg-muted/20"
                  >
                    <Badge variant={badge}>{badge}</Badge>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* The Select can't hold a client-side error (its values are enum-constrained),
              so only a server rejection can surface here. */}
          {(serverError && serverErrorField === 'status') && <p className="overflow-x-scroll text-destructive/80 text-xs">{serverError}</p>}
        </div>
        <div className="mt-3.5 md:hidden">
          <Badge variant={subcategory.status}>{subcategory.status}</Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}