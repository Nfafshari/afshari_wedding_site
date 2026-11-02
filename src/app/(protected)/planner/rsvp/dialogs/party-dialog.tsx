"use client";

import { useState } from "react";
import { CirclePlus, X } from "lucide-react";

import FormDialog from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { MAX_PLUS_ONES, MAX_SHORT_TEXT, checkPartyMembers, checkPlusOnesFloor, countActivePlusOnes, getMembers } from "@/lib/rsvp";
import { checkRequired, checkUniqueName, checkWholeNumber, parseWholeNumber } from "@/lib/validate";

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
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const activePlusOnes = isEdit ? countActivePlusOnes(partyToUpdate) : 0;

  const takenNames = invitations
    .filter((invitation) => invitation.id !== partyToUpdate?.id)
    .map((invitation) => invitation.partyName);

  // The messages come from lib/validate.ts and lib/rsvp.ts, so they match what the server would say.
  const checks = {
    partyName: (value = partyName) => checkRequired(value, 'Party name', MAX_SHORT_TEXT) ?? checkUniqueName(value, takenNames, 'party'),
    plusOnesAllowed: (value = plusOnesAllowed) => {
      const parsed = parseWholeNumber(value);
      return checkWholeNumber(parsed, 'Plus-ones', MAX_PLUS_ONES, 0) ?? checkPlusOnesFloor(parsed, activePlusOnes);
    },
    members: () => checkPartyMembers(members.map((member) => member.name)),
  };

  function updateMember (key: number, name: string) {
    setMembers((prev) => prev.map((member) => (member.key === key ? { ...member, name } : member)));
    clear('members');
    clearServerError();
  }

  function removeMember (key: number) {
    setMembers((prev) => prev.filter((member) => member.key !== key));
    clear('members');
    clearServerError();
  }

  function addMember () {
    setMembers((prev) => [...prev, { key: nextKey, name: '' }]);
    setNextKey((prev) => prev + 1);
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function saveParty () {
    if (!checkAll({ partyName: checks.partyName(), plusOnesAllowed: checks.plusOnesAllowed(), members: checks.members() })) return;

    const input = {
      partyName,
      plusOnesAllowed: parseWholeNumber(plusOnesAllowed),
      members: members.map((member) => ({ id: member.id, name: member.name })),
    };

    if (isEdit) {
      await runAction("Party saved", () => updateInvitation(partyToUpdate.id, input));
    } else {
      await runAction("Party added", () => createInvitation(input));
    }
  }

  return (
    <FormDialog
      id="party-dialog"
      title={isEdit ? `Edit ${partyToUpdate.partyName}` : 'Add Party'}
      isLoading={isLoading}
      onSubmit={saveParty}
      submitLabel={isEdit ? 'Save changes' : 'Add'}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="party-name">Party Name</FieldLabel>
        <Input
          id="party-name"
          type="text"
          placeholder="The Okafors"
          value={partyName}
          aria-invalid={Boolean(fieldErrors.partyName || serverErrorField === 'partyName')}
          onChange={(e) => {
            setPartyName(e.target.value);
            clear('partyName');
            clearServerError();
          }}
          onBlur={(e) => check('partyName', checks.partyName(e.target.value))}
        />
        {fieldErrors.partyName && <p className="text-destructive text-xs">{fieldErrors.partyName}</p>}
        {(serverError && serverErrorField === 'partyName') && <p className="text-destructive text-xs">{serverError}</p>}
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
                aria-invalid={Boolean(fieldErrors.members || serverErrorField === 'members')}
                onChange={(e) => updateMember(member.key, e.target.value)}
              />
              <Button
                type="button"
                variant={'ghost-destructive'}
                size={'icon-sm'}
                aria-label={`Remove guest ${idx + 1}`}
                disabled={members.length === 1}
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
          className="w-fit "
          onClick={addMember}
        >
          Add guest <CirclePlus />
        </Button>
        {fieldErrors.members && <p className="text-destructive text-xs">{fieldErrors.members}</p>}
        {(serverError && serverErrorField === 'members') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="party-plus-ones">Plus-Ones Allowed</FieldLabel>
        <Input
          id="party-plus-ones"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={plusOnesAllowed}
          aria-invalid={Boolean(fieldErrors.plusOnesAllowed || serverErrorField === 'plusOnesAllowed')}
          onChange={(e) => {
            setPlusOnesAllowed(e.target.value);
            clear('plusOnesAllowed');
            clearServerError();
          }}
          onBlur={(e) => check('plusOnesAllowed', checks.plusOnesAllowed(e.target.value))}
        />
        {fieldErrors.plusOnesAllowed && <p className="text-destructive text-xs">{fieldErrors.plusOnesAllowed}</p>}
        {(serverError && serverErrorField === 'plusOnesAllowed') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'invitation' || serverErrorField === 'guest')) && (
        <p className="text-destructive text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
