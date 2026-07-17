"use client";

import Link from "next/link";

import RsvpTable from "./components/rsvp-table";
import { useDemoPlanner } from "../demo-store";
import { ChevronLeft } from "lucide-react";

export default function Rsvp() {
  const { rsvps: rsvpData } = useDemoPlanner();
  const NUMBER_OF_INVITED = 12;

  // get number of accepted rsvps
  const acceptedRsvps = rsvpData.filter((rsvp) => rsvp.attendance === true);

  // get number of rejected rsvps
  const rejectedRsvps = rsvpData.filter((rsvp) => rsvp.attendance === false);

  // get number of responses of rejected, accepted, and total
  const totalAccepted  = acceptedRsvps.reduce((sum, rsvp) => sum += rsvp.guests.length, 0)
  const totalRejected  = rejectedRsvps.reduce((sum, rsvp) => sum += rsvp.guests.length, 0)
  const totalResponded = acceptedRsvps.length + rejectedRsvps.length;

  return (
    <div className="relative w-full min-h-full bg-background font-sans text-burg px-6 pb-6 md:py-2 md:px-12 lg:px-16">
      <Link href={'/single-instance-planner'} className="absolute left-2 flex items-center text-burg underline mx-2 mt-2 text-sm"><ChevronLeft className="w-5 h-5"/> Back to Planner</Link>
      {/** title */}
      <div className="flex flex-col w-full mt-10 md:flex-row">
        <h1 className="page-title w-full text-center translate-y-3 md:text-start">RSVP Tracker</h1>
        <div className="flex flex-col mt-4 md:w-1/2 md:ml-auto md:mt-0">
          <h2 className="page-title text-xl  text-center md:text-2xl md:text-end">{totalResponded} Responses</h2>
          <h3 className="section-title text-sm text-center md:text-end">{NUMBER_OF_INVITED} Sent</h3>
        </div>
      </div>
      <hr className="mb-5 mt-2 bg-accent md:my-5"/>

      <div className="flex w-full justify-center">
        <div className="grid grid-cols-2 w-full h-full md:grid-cols-4">
          <div className="hidden flex-col w-full h-auto border-e-2 border-e-accent items-center pl-5 md:flex">
            <p className="stat-number">{NUMBER_OF_INVITED}</p>
            <p className="muted-caption pt-2">Invited</p>
          </div>
          <div className="hidden flex-col w-full h-auto items-center pl-5 md:border-e-2 md:border-e-accent md:flex">
            <p className="stat-number">{totalResponded}</p>
            <p className="muted-caption pt-2">Responded</p>
          </div>
          <div className="flex flex-col w-full h-auto items-center pl-5">
            <p className="stat-number text-olivine">{totalAccepted}</p>
            <p className="muted-caption pt-2">Attending</p>
          </div>
          <div className="flex flex-col w-full h-auto border-s-2 border-s-accent items-center pl-5">
            <p className="stat-number text-destructive">{totalRejected}</p>
            <p className="muted-caption pt-2">Declined</p>
          </div>
        </div>
      </div>
      <hr className="mb-5 mt-2 bg-accent md:my-5"/>

      {/* Accepted Table */}
      <h3 className="text-xl font-bold text-left text-olivine">ATTENDING RESPONSES</h3>
      <RsvpTable 
        rsvpData={acceptedRsvps}
      />

      {/* Rejected Table */}
      <h3 className="text-xl font-bold text-left text-destructive mt-10">DECLINED RESPONSES</h3>
      <RsvpTable 
        rsvpData={rejectedRsvps}
      />
    </div>
  );
}
