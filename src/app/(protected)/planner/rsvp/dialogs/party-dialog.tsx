"use client";

import { useState } from "react";
import { CirclePlus, X } from "lucide-react";

import FormDialog from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { countActivePlusOnes, getMembers, normalizeName } from "@/lib/rsvp";

import { createInvitation, updateInvitation, type ErrorField } from "../action";
import type { Invitations } from "../page";

interface PartyDialogProps {
  /** Existing parties, used for the client-side duplicate-name check. */
  invitations: Invitations[];
  /** The party to edit. Absent when adding a new one. */
  partyToUpdate?: Invitations | undefined;
  /** Called after a successful save so the parent can close the dialog. */
  onSuccess: () => void;
}

/**
 * A member row in the form. `key` is a client-only React key, since new rows have
 * no database id yet and array indexes shift when a row is removed.
 */
type MemberDraft = { key: number; id?: number; name: string };

/** Whole number from 0 to 10 — mirrors the server's bounds. */
function parsePlusOnes (value: string): number | null {
  if (!/^\d{1,2}$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value.trim());
  return parsed <= 10 ? parsed : null;
}

/**
 * Add and edit share one dialog: they collect the same fields, and the member-list
 * editor is the bulk of either. Splitting them like the registry dialogs would
 * duplicate that editor for no gain.
 */
export default function PartyDialog({ invitations, partyToUpdate, onSuccess }: PartyDialogProps) {
  const isEdit = partyToUpdate !== undefined;
  const initialMembers: MemberDraft[] = isEdit
    ? getMembers(partyToUpdate).map((guest) => ({ key: guest.id, id: guest.id, name: guest.name }))
    : [{ key: 0, name: '' }];

  const [partyName, setPartyName] = useState(partyToUpdate?.partyName ?? '');
  const [plusOnesAllowed, setPlusOnesAllowed] = useState(String(partyToUpdate?.plusOnesAllowed ?? 0));
  const [members, setMembers] = useState<MemberDraft[]>(initialMembers);
  // Next client key. Starts past every db id in use so the two never collide.
  const [nextKey, setNextKey] = useState(() => Math.max(0, ...initialMembers.map((member) => member.key)) + 1);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const activePlusOnes = isEdit ? countActivePlusOnes(partyToUpdate) : 0;

  /**
   * Validates the party name by checking if it is empty or already taken.
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function partyNameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Party name cannot be empty.';
    }

    const isDuplicate = invitations.some(
      (invitation) => invitation.id !== partyToUpdate?.id
        && invitation.partyName.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'A party with that name already exists.';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the plus-one allowance, which can't drop below plus-ones already named.
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function plusOnesValidator (value: string): string | null {
    const parsed = parsePlusOnes(value);
    if (parsed === null) {
      return 'Plus-ones must be a whole number from 0 to 10.';
    }

    if (parsed < activePlusOnes) {
      return `${activePlusOnes} already named — reject one first to go lower.`;
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the member list: at least one, none blank, no repeats.
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function membersValidator (value: MemberDraft[]): string | null {
    if (value.length === 0) {
      return 'A party needs at least one guest.';
    }

    if (value.some((member) => member.name.trim() === '')) {
      return 'Guest names cannot be empty.';
    }

    const keys = value.map((member) => normalizeName(member.name));
    if (new Set(keys).size !== keys.length) {
      return 'The same guest is listed twice.';
    }

    // return null if validation succeeded
    return null;
  }

  function updateMember (key: number, name: string) {
    setMembers((prev) => prev.map((member) => (member.key === key ? { ...member, name } : member)));
    setFieldErrors(({ members, ...rest }) => rest);
    clearServerError();
  }

  function removeMember (key: number) {
    setMembers((prev) => prev.filter((member) => member.key !== key));
    setFieldErrors(({ members, ...rest }) => rest);
    clearServerError();
  }

  function addMember () {
    setMembers((prev) => [...prev, { key: nextKey, name: '' }]);
    setNextKey((prev) => prev + 1);
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function saveParty () {
    // Validate every field into one local object, then gate on it
    const errors: Partial<Record<ErrorField, string>> = {};

    const partyNameError = partyNameValidator(partyName);
    if (partyNameError) {
      errors.partyName = partyNameError;
    }

    const plusOnesError = plusOnesValidator(plusOnesAllowed);
    if (plusOnesError) {
      errors.plusOnesAllowed = plusOnesError;
    }

    const membersError = membersValidator(members);
    if (membersError) {
      errors.members = membersError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Validation passed, so the allowance parses.
    const parsedPlusOnes = parsePlusOnes(plusOnesAllowed);
    if (parsedPlusOnes === null) return;

    const input = {
      partyName,
      plusOnesAllowed: parsedPlusOnes,
      members: members.map((member) => ({ id: member.id, name: member.name })),
    };

    if (isEdit) {
      await runAction("Party updated", () => updateInvitation(partyToUpdate.id, input));
    } else {
      await runAction("Party added", () => createInvitation(input));
    }
  }

  return (
    <FormDialog
      id="party-dialog"
      title={isEdit ? `Edit ${partyToUpdate.partyName}?` : 'Add New Party?'}
      isLoading={isLoading}
      onSubmit={saveParty}
      submitLabel={isEdit ? 'Save' : 'Add'}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="party-name">Party Name</FieldLabel>
        <Input
          id="party-name"
          type="text"
          placeholder="The Okafors"
          value={partyName}
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.partyName || serverErrorField === 'partyName') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setPartyName(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ partyName, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = partyNameValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, partyName: msg }));
            } else {
              setFieldErrors(({ partyName, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.partyName && <p className="text-destructive/80 text-xs">{fieldErrors.partyName}</p>}
        {(serverError && serverErrorField === 'partyName') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel>Guests</FieldLabel>
        <FieldDescription className="text-xs">
          Full names, as guests will type them on the RSVP page.
        </FieldDescription>
        <div className="flex flex-col gap-2">
          {members.map((member, idx) => (
            <div key={member.key} className="flex items-center gap-2">
              <Input
                type="text"
                aria-label={`Guest ${idx + 1} name`}
                placeholder="Grace Okafor"
                value={member.name}
                className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.members || serverErrorField === 'members') ? 'border-destructive' : 'border-input'}`}
                onChange={(e) => updateMember(member.key, e.target.value)}
              />
              <Button
                type="button"
                variant={'ghost'}
                size={'icon-sm'}
                aria-label={`Remove guest ${idx + 1}`}
                disabled={members.length === 1}
                className="hover:text-destructive"
                onClick={() => removeMember(member.key)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant={'ghost'}
          size={'sm'}
          className="w-fit text-burg/70 hover:bg-burg hover:text-background"
          onClick={addMember}
        >
          Add guest <CirclePlus />
        </Button>
        {fieldErrors.members && <p className="text-destructive/80 text-xs">{fieldErrors.members}</p>}
        {(serverError && serverErrorField === 'members') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="party-plus-ones">Plus-Ones Allowed</FieldLabel>
        <Input
          id="party-plus-ones"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={plusOnesAllowed}
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.plusOnesAllowed || serverErrorField === 'plusOnesAllowed') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setPlusOnesAllowed(e.target.value);
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ plusOnesAllowed, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = plusOnesValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, plusOnesAllowed: msg }));
            } else {
              setFieldErrors(({ plusOnesAllowed, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.plusOnesAllowed && <p className="text-destructive/80 text-xs">{fieldErrors.plusOnesAllowed}</p>}
        {(serverError && serverErrorField === 'plusOnesAllowed') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'invitation' || serverErrorField === 'guest')) && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
