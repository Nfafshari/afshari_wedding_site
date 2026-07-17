"use client";

import { ChevronDown, GitCommitVertical, LineDotRightHorizontal, MessageSquareWarning } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Rsvps } from "../page";
import RsvpColumns from "./rsvp-columns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RsvpTableProps {
  rsvpData: Rsvps[]
}

export default function RsvpTable ({ rsvpData }: RsvpTableProps) {


  return (
    <>
      {/** custom heading */}
      <Table className="w-full table-fixed mb-1">
        {/** custom column sizing */}
        <RsvpColumns heading/>
        <TableHeader>
          <TableRow className="hover:bg-background border-b border-b-accent">
            <TableHead className="h-6"/>
            <TableHead className="h-6 text-xs text-accent">NAME</TableHead>
            <TableHead className="h-6 text-xs text-accent">PLUS ONES</TableHead>
            <TableHead className="hidden h-6 text-xs text-accent md:table-cell">EMAIL</TableHead>
            <TableHead className="hidden h-6 text-xs text-accent md:table-cell">PHONE NUMBER</TableHead>
            <TableHead className="h-6 pr-3 text-xs text-right text-accent">NOTES</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {rsvpData.map((rsvp) => {
        // split the data between primary users and guests
        const primaryGuest = rsvp.guests.find((guest) => guest.isPrimary);
        const plusOnes = rsvp.guests.filter((guest) => !guest.isPrimary);

        // check if primary guest exists
        if (primaryGuest == null) {
          return (
            <></>
          );
        }

        return (
        <Popover key={rsvp.id}>
            <Collapsible>
              <Table className="table-fixed">
                {/** custom column sizing */}
                <RsvpColumns />
                <TableHeader>
                  <TableRow className="group/category hover:bg-muted/20 has-aria-expanded:bg-muted/20 ">
                    <TableHead className="pt-2 w-7">
                      {plusOnes.length === 0 ? (
                        <></>
                      ) : (
                        <CollapsibleTrigger className="group">
                          <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                        </CollapsibleTrigger>
                      )}
                    </TableHead>
                    <TableHead className="font-bold text-lg pb-1 md:pb-0">
                      {primaryGuest.name}
                      {/* Mobile: email/phone columns are hidden, so fold them into a subline here. */}
                      <p className="text-xs font-normal text-accent overflow-y-scroll pb-2 md:hidden">
                        {primaryGuest.email ?? "No email"} • {primaryGuest.phoneNumber ?? "No phone"}
                      </p>
                    </TableHead>
                    <TableHead className="font-bold text-center text-lg pb-1 md:text-left md:pb-0">{plusOnes.length}</TableHead>
                    <TableHead className="hidden font-bold text-lg pb-1 md:table-cell md:pb-0">{primaryGuest.email ?? <span className="text-muted">None Provided</span>}</TableHead>
                    <TableHead className="hidden font-bold text-lg pb-1 md:table-cell md:pb-0">{primaryGuest.phoneNumber ?? <span className="text-muted">None Provided</span>}</TableHead>
                    <TableHead className="font-bold text-lg pb-1 md:pb-0">
                      <div className="flex justify-end items-center mr-3">
                        {primaryGuest.notes ? (
                          <>
                            <PopoverTrigger><MessageSquareWarning className="cursor-pointer active:translate-y-px active:text-gold over:text-gold"/></PopoverTrigger>
                            <PopoverContent className="w-50">
                              <div className="px-1 py-1">
                                <h1>Note for {primaryGuest.name}.</h1>
                                <div className="flex h-20 w-full mt-1 px-2 py-2 rounded-xs border border-border/70 bg-muted/5">
                                  {primaryGuest.notes}
                                </div>
                              </div>
                            </PopoverContent>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <CollapsibleContent asChild>
                  <TableBody className="last:border-b-2 border-burg">
                    {plusOnes.map((guest, idx) => (
                      <TableRow key={guest.id}>
                        <TableCell/>
                        <TableCell className="font-bold text-lg pb-1 md:pb-0">
                          <div className="flex items-center">
                            {idx === plusOnes.length - 1 ? (
                              <LineDotRightHorizontal strokeWidth={2} className="h-5 mb-2 rotate-90 text-muted" />
                            ) : (
                              <GitCommitVertical strokeWidth={2} className="h-5 text-muted" />
                            )}
                            <div className="flex flex-col">
                              {guest.name}
                              {/* Mobile: fold this guest's own email/phone into a subline. */}
                              <p className="text-xs font-normal text-accent truncate md:hidden">
                                {guest.email ?? "No email"} • {guest.phoneNumber ?? "No phone"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell/>
                        <TableCell className="hidden font-bold text-lg pb-1 md:table-cell md:pb-0">{guest.email ?? <span className="text-muted">None Provided</span>}</TableCell>
                        <TableCell className="hidden font-bold text-lg pb-1 md:table-cell md:pb-0">{guest.phoneNumber ?? <span className="text-muted">None Provided</span>}</TableCell>
                        <TableCell className="font-bold text-lg pb-1 md:pb-0">
                          <div className="flex justify-end items-center mr-3">
                            {guest.notes ? (
                              <Popover>
                                <PopoverTrigger><MessageSquareWarning className="hover:text-gold cursor-pointer"/></PopoverTrigger>
                                <PopoverContent className="w-50">
                                  <div className="px-1 py-1">
                                    <h1>Note for {guest.name}.</h1>
                                    <div className="flex h-20 w-full mt-1 px-2 py-2 rounded-xs border border-border/70 bg-muted/5">
                                      {guest.notes}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <></>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </CollapsibleContent>
              </Table>
            </Collapsible>
          </Popover>
        );
      })}
    </>
  );
}
