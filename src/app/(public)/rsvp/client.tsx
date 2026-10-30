"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/rsvp";
import { cn } from "@/lib/utils";

import { findInvitation, submitRsvp, type ErrorField, type PublicParty } from "./action";

interface RsvpFormProps {
  /** Whether the deadline has passed, decided on the server per request. */
  isOpen: boolean;
  /** Human-readable deadline, e.g. "August 1, 2027". */
  deadline: string;
}

type Step =
  | { kind: 'lookup' }
  | { kind: 'choose'; options: { invitationId: number; partyName: string }[] }
  | { kind: 'form'; party: PublicParty }
  | { kind: 'done'; party: PublicParty; summary: Summary };

type Summary = { attending: string[]; declined: string[]; plusOnes: string[] };

const CARD = "w-full rounded-md border border-gold/50 bg-popover p-5 shadow-sm md:p-8";

export default function RsvpForm({ isOpen, deadline }: RsvpFormProps) {
  const [step, setStep] = useState<Step>({ kind: 'lookup' });
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookUp (invitationId?: number) {
    setIsLoading(true);
    setError('');
    try {
      const result = await findInvitation(name, invitationId);
      if (!result.ok) {
        setError(result.error);
      } else if (result.kind === 'choose') {
        setStep({ kind: 'choose', options: result.options });
      } else {
        setStep({ kind: 'form', party: result.party });
      }
    } catch (err) {
      // A rejection means the call never completed (dropped connection, deploy).
      console.error(`*ERROR - rsvp lookup failed to complete, see below:\n${err}`);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function startOver () {
    setStep({ kind: 'lookup' });
    setError('');
  }

  return (
    <main className="flex flex-col w-full min-h-[70vh] items-center bg-cream px-4 py-10 text-burg md:py-16">
      <div className="flex flex-col w-full max-w-2xl items-center">
        <h1 className="script-title text-6xl text-burg md:text-7xl">RSVP</h1>
        <p className="section-title mt-2 text-center">September 11, 2027</p>
        <p className="mt-1 mb-8 text-sm text-center text-burg/70">
          {isOpen ? `Kindly respond by ${deadline}.` : `RSVPs closed on ${deadline}.`}
        </p>

        {step.kind === 'lookup' && (
          <form
            className={CARD}
            onSubmit={(event) => {
              event.preventDefault();
              lookUp();
            }}
          >
            <Field>
              <FieldLabel htmlFor="rsvp-name" className="text-lg">Find your invitation</FieldLabel>
              <FieldDescription>Enter your first and last name as it appears on your invitation.</FieldDescription>
              <div className="flex gap-2">
                <Input
                  id="rsvp-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Grace Okafor"
                  value={name}
                  aria-invalid={error !== ''}
                  className="bg-popover rounded-sm"
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                />
                <Button type="submit" disabled={isLoading || name.trim() === ''} className="shrink-0">
                  {isLoading ? <Spinner /> : <><Search /> Find</>}
                </Button>
              </div>
              {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            </Field>
          </form>
        )}

        {step.kind === 'choose' && (
          <div className={CARD}>
            <h2 className="text-lg font-bold">Which party are you with?</h2>
            <p className="text-sm text-burg/70 mt-1">More than one guest goes by that name.</p>
            <div className="flex flex-col gap-2 mt-4">
              {step.options.map((option) => (
                <Button
                  key={option.invitationId}
                  variant={'outline'}
                  disabled={isLoading}
                  className="justify-start h-auto py-3 text-base"
                  onClick={() => lookUp(option.invitationId)}
                >
                  {option.partyName}
                </Button>
              ))}
            </div>
            {error && <p role="alert" className="text-destructive text-sm mt-2">{error}</p>}
            <Button variant={'link'} className="mt-2 px-0" onClick={startOver}>Not you? Search again</Button>
          </div>
        )}

        {step.kind === 'form' && (
          <PartyForm
            key={step.party.invitationId}
            party={step.party}
            lookupName={name}
            isOpen={isOpen}
            deadline={deadline}
            onStartOver={startOver}
            onDone={(summary) => setStep({ kind: 'done', party: step.party, summary })}
          />
        )}

        {step.kind === 'done' && (
          <div className={cn(CARD, "flex flex-col items-center text-center")}>
            <CircleCheck className="w-12 h-12 text-olivine" strokeWidth={1.5} />
            <h2 className="page-subtitle text-2xl mt-2">Thank you!</h2>
            <p className="mt-2">
              {step.summary.attending.length > 0
                ? "We can't wait to celebrate with you."
                : "We'll miss you, and thank you for letting us know."}
            </p>
            <dl className="mt-4 text-sm text-left w-full max-w-sm">
              {step.summary.attending.length > 0 && (
                <div className="mt-2">
                  <dt className="font-bold">Attending</dt>
                  <dd>{step.summary.attending.join(', ')}</dd>
                </div>
              )}
              {step.summary.declined.length > 0 && (
                <div className="mt-2">
                  <dt className="font-bold">Not attending</dt>
                  <dd>{step.summary.declined.join(', ')}</dd>
                </div>
              )}
              {step.summary.plusOnes.length > 0 && (
                <div className="mt-2">
                  <dt className="font-bold">Additional guests</dt>
                  <dd>{step.summary.plusOnes.join(', ')}</dd>
                  <dd className="text-burg/60 text-xs mt-1">We&apos;ll confirm any new additional guests with you.</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-sm text-burg/70">Need to change something? Look yourself up again any time before {deadline}.</p>
            <Button variant={'link'} className="mt-2" onClick={startOver}>Back to RSVP</Button>
          </div>
        )}
      </div>
    </main>
  );
}

interface PartyFormProps {
  party: PublicParty;
  lookupName: string;
  isOpen: boolean;
  deadline: string;
  onStartOver: () => void;
  onDone: (summary: Summary) => void;
}

/** A plus-one slot in the form. `id` is set when it's a plus-one already saved. */
type Slot = { id?: number; name: string; dietary: string; status?: PublicParty['plusOnes'][number]['plusOneStatus'] };

const PLUS_ONE_STATUS_TEXT = {
  PENDING: 'Awaiting confirmation',
  APPROVED: 'Confirmed',
  REJECTED: 'Not able to confirm — please reach out to us',
} as const;

function PartyForm ({ party, lookupName, isOpen, deadline, onStartOver, onDone }: PartyFormProps) {
  const isReturning = party.respondedAt !== null;

  // null = not answered yet. Prefilled for returning guests, blank for new ones so
  // nobody is accidentally RSVP'd "yes" by a default they didn't notice.
  const [answers, setAnswers] = useState<Record<number, boolean | null>>(() =>
    Object.fromEntries(party.members.map((member) => [
      member.id,
      member.attendance === 'PENDING' ? null : member.attendance === 'ATTENDING',
    ]))
  );
  const [dietary, setDietary] = useState<Record<number, string>>(() =>
    Object.fromEntries(party.members.map((member) => [member.id, member.dietary ?? '']))
  );
  // Exactly plusOnesAllowed slots, filled from what's saved first.
  const [slots, setSlots] = useState<Slot[]>(() =>
    Array.from({ length: party.plusOnesAllowed }, (_, idx) => {
      const saved = party.plusOnes[idx];
      return saved
        ? { id: saved.id, name: saved.name, dietary: saved.dietary ?? '', status: saved.plusOneStatus }
        : { name: '', dietary: '' };
    })
  );
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [noteToCouple, setNoteToCouple] = useState(party.noteToCouple ?? '');
  const [songRequest, setSongRequest] = useState(party.songRequest ?? '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<ErrorField | null>(null);

  const anyAttending = Object.values(answers).some((answer) => answer === true);
  const disabled = !isOpen || isLoading;

  function fail (message: string, field: ErrorField | null) {
    setError(message);
    setErrorField(field);
  }

  async function submit () {
    if (party.members.some((member) => answers[member.id] === null)) {
      fail('Please let us know whether each guest will attend.', 'members');
      return;
    }
    if (!party.hasContact && email.trim() === '' && phoneNumber.trim() === '') {
      fail('Please leave an email or phone number so we can reach you.', 'contact');
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorField(null);
    try {
      const result = await submitRsvp(lookupName, party.invitationId, {
        members: party.members.map((member) => ({
          id: member.id,
          attending: answers[member.id] === true,
          dietary: answers[member.id] ? dietary[member.id] : '',
        })),
        plusOnes: anyAttending ? slots.map(({ id, name, dietary }) => ({ id, name, dietary })) : [],
        email,
        phoneNumber,
        noteToCouple,
        songRequest,
      });

      if (!result.ok) {
        fail(result.error, result.field ?? null);
        return;
      }

      onDone({
        attending: party.members.filter((member) => answers[member.id]).map((member) => member.name),
        declined: party.members.filter((member) => !answers[member.id]).map((member) => member.name),
        plusOnes: anyAttending ? slots.map((slot) => slot.name.trim()).filter(Boolean) : [],
      });
    } catch (err) {
      console.error(`*ERROR - rsvp submit failed to complete, see below:\n${err}`);
      fail('Something went wrong. Please try again.', null);
    } finally {
      setIsLoading(false);
    }
  }

  const fieldError = (field: ErrorField) =>
    error && errorField === field ? <p role="alert" className="text-destructive text-sm">{error}</p> : null;

  return (
    <form
      className={cn(CARD, "flex flex-col gap-6")}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <h2 className="page-subtitle text-2xl">{party.partyName}</h2>
        <Button type="button" variant={'link'} className="px-0 h-auto text-sm text-burg/60" onClick={onStartOver}>
          Not you? Search again
        </Button>
      </div>

      {isReturning && party.respondedAt && (
        <div role="status" className="flex gap-3 rounded-sm border border-gold bg-gold/15 p-3 text-sm">
          <CircleAlert className="w-5 h-5 shrink-0 text-gold" />
          <p>
            {party.respondedByName ? `${party.respondedByName} already responded` : 'You already responded'} on{' '}
            {party.respondedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.{' '}
            {isOpen
              ? `Your answers are below — you can update them until ${deadline}.`
              : 'Your answers are below.'}
          </p>
        </div>
      )}

      {!isOpen && (
        <div role="status" className="flex gap-3 rounded-sm border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <CircleAlert className="w-5 h-5 shrink-0 text-destructive" />
          <p>RSVPs closed on {deadline}. Please reach out to us directly to make changes.</p>
        </div>
      )}

      {/* Members */}
      <fieldset disabled={disabled} className="flex flex-col gap-4">
        <legend className="section-title mb-2">Will you be joining us?</legend>
        {party.members.map((member) => (
          <div key={member.id} className="flex flex-col gap-2 border-b border-accent/40 pb-4 last:border-b-0">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="font-bold text-lg">{member.name}</p>
              <div role="radiogroup" aria-label={`Will ${member.name} attend?`} className="flex gap-2">
                <ChoiceButton
                  selected={answers[member.id] === true}
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [member.id]: true }));
                    setError('');
                  }}
                >
                  Joyfully accepts
                </ChoiceButton>
                <ChoiceButton
                  selected={answers[member.id] === false}
                  tone="decline"
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [member.id]: false }));
                    setError('');
                  }}
                >
                  Regretfully declines
                </ChoiceButton>
              </div>
            </div>
            {answers[member.id] === true && (
              <Input
                type="text"
                aria-label={`Dietary restrictions for ${member.name}`}
                placeholder="Dietary restrictions or allergies (optional)"
                maxLength={MAX_SHORT_TEXT}
                value={dietary[member.id]}
                className="bg-popover rounded-sm"
                onChange={(e) => setDietary((prev) => ({ ...prev, [member.id]: e.target.value }))}
              />
            )}
          </div>
        ))}
        {fieldError('members')}
      </fieldset>

      {/* Plus-ones */}
      {party.plusOnesAllowed > 0 && anyAttending && (
        <fieldset disabled={disabled} className="flex flex-col gap-3">
          <legend className="section-title mb-1">
            Additional guest{party.plusOnesAllowed === 1 ? '' : 's'}
          </legend>
          <p className="text-sm text-burg/70">
            Your invitation includes up to {party.plusOnesAllowed} additional guest{party.plusOnesAllowed === 1 ? '' : 's'}.
            Leave blank if you&apos;re coming solo. New names are confirmed by the couple.
          </p>
          {slots.map((slot, idx) => (
            <div key={idx} className="flex flex-col gap-2 md:flex-row">
              <div className="flex flex-col gap-1 md:w-1/2">
                <Input
                  type="text"
                  aria-label={`Additional guest ${idx + 1} full name`}
                  placeholder="Full name"
                  maxLength={MAX_SHORT_TEXT}
                  value={slot.name}
                  className="bg-popover rounded-sm"
                  onChange={(e) => setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)))}
                />
                {slot.status && (
                  <span className="text-xs text-burg/60">{PLUS_ONE_STATUS_TEXT[slot.status]}</span>
                )}
              </div>
              <Input
                type="text"
                aria-label={`Additional guest ${idx + 1} dietary restrictions`}
                placeholder="Dietary restrictions (optional)"
                maxLength={MAX_SHORT_TEXT}
                value={slot.dietary}
                className="bg-popover rounded-sm md:w-1/2"
                onChange={(e) => setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, dietary: e.target.value } : s)))}
              />
            </div>
          ))}
          {fieldError('plusOnes')}
        </fieldset>
      )}

      {/* Contact */}
      <fieldset disabled={disabled} className="flex flex-col gap-3">
        <legend className="section-title mb-1">How can we reach you?</legend>
        <p className="text-sm text-burg/70">
          {party.hasContact
            ? "We already have your contact info. Fill these in only if you'd like to update it."
            : 'An email or phone number, in case plans change.'}
        </p>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            type="email"
            autoComplete="email"
            aria-label="Email"
            placeholder="Email"
            maxLength={MAX_SHORT_TEXT}
            value={email}
            aria-invalid={errorField === 'contact'}
            className="bg-popover rounded-sm"
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorField === 'contact') setError('');
            }}
          />
          <Input
            type="tel"
            autoComplete="tel"
            aria-label="Phone number"
            placeholder="Phone number"
            maxLength={MAX_SHORT_TEXT}
            value={phoneNumber}
            aria-invalid={errorField === 'contact'}
            className="bg-popover rounded-sm"
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (errorField === 'contact') setError('');
            }}
          />
        </div>
        {fieldError('contact')}
      </fieldset>

      {/* Extras */}
      <fieldset disabled={disabled} className="flex flex-col gap-3">
        {anyAttending && (
          <Field>
            <FieldLabel htmlFor="rsvp-song">Song request</FieldLabel>
            <Input
              id="rsvp-song"
              type="text"
              placeholder="What will get you on the dance floor?"
              maxLength={MAX_SHORT_TEXT}
              value={songRequest}
              className="bg-popover rounded-sm"
              onChange={(e) => setSongRequest(e.target.value)}
            />
            {fieldError('songRequest')}
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="rsvp-note">Note to the couple</FieldLabel>
          <Textarea
            id="rsvp-note"
            placeholder="Optional"
            maxLength={MAX_LONG_TEXT}
            value={noteToCouple}
            className="bg-popover rounded-sm"
            onChange={(e) => setNoteToCouple(e.target.value)}
          />
          {fieldError('noteToCouple')}
        </Field>
      </fieldset>

      {error && errorField === null && <p role="alert" className="text-destructive text-sm">{error}</p>}

      {isOpen && (
        <Button type="submit" disabled={isLoading} size={'lg'} className="w-full md:w-auto md:self-end">
          {isLoading ? <Spinner /> : isReturning ? 'Update RSVP' : 'Send RSVP'}
        </Button>
      )}
    </form>
  );
}

function ChoiceButton ({
  selected,
  tone = 'accept',
  onClick,
  children,
}: {
  selected: boolean;
  tone?: 'accept' | 'decline';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-50",
        selected
          ? tone === 'accept'
            ? "border-olivine bg-olivine text-burg font-semibold"
            : "border-burg bg-burg text-cream font-semibold"
          : "border-burg/30 bg-transparent hover:bg-muted/30"
      )}
    >
      {children}
    </button>
  );
}
