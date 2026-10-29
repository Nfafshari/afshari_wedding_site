"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import RsvpTable from "@/components/rsvp/rsvp-table";
import RsvpStats from "@/components/rsvp/rsvp-stats";
import PendingPlusOnes from "@/components/rsvp/pending-plus-ones";
import { getPartyGroup, getRsvpStats } from "@/lib/rsvp";
import { useDemoPlanner } from "../demo-store";

/**
 * Read-only mirror of the real RSVP tracker. The shared components render without
 * edit controls when no handlers are passed, and the demo store has no RSVP actions
 * to pass yet.
 */
export default function Rsvp() {
  const { invitations } = useDemoPlanner();

  const stats = getRsvpStats(invitations);
  const attending = invitations.filter((invitation) => getPartyGroup(invitation) === 'attending');
  const declined = invitations.filter((invitation) => getPartyGroup(invitation) === 'declined');
  const awaiting = invitations.filter((invitation) => getPartyGroup(invitation) === 'awaiting');

  return (
    <div>
      <Link href={'/single-instance-planner'} className="flex items-center text-burg underline mx-2 mt-2 text-sm"><ChevronLeft className="w-5 h-5"/> Back to Planner</Link>
      <div className="flex flex-col w-full min-h-full bg-background font-sans text-burg px-6 pb-6 md:py-2 md:px-12 lg:px-16">
        {/** title */}
        <div className="flex flex-col w-full md:flex-row">
          <h1 className="page-title w-full text-center translate-y-3 md:text-start">RSVP Tracker</h1>
          <div className="flex flex-col mt-4 md:w-1/2 md:ml-auto md:mt-0">
            <h2 className="page-title text-xl text-center md:text-2xl md:text-end">{stats.respondedParties} of {invitations.length} Parties Responded</h2>
            <h3 className="section-title text-sm text-center md:text-end">{stats.invited} Guests Invited</h3>
          </div>
        </div>
        <hr className="mb-5 mt-2 bg-accent md:my-5"/>

        <RsvpStats stats={stats} />
        <hr className="mb-5 mt-2 bg-accent md:my-5"/>

        <PendingPlusOnes parties={invitations} />

        <h3 className="text-xl font-bold text-left text-olivine">ATTENDING</h3>
        <RsvpTable parties={attending} emptyMessage="No one has said yes yet." />

        <h3 className="text-xl font-bold text-left text-destructive mt-10">DECLINED</h3>
        <RsvpTable parties={declined} emptyMessage="No one has declined." />

        <h3 className="text-xl font-bold text-left text-burg/70 mt-10">AWAITING RESPONSE</h3>
        <RsvpTable parties={awaiting} emptyMessage="Everyone has responded!" />
      </div>
    </div>
  );
}
