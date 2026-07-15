"use client";

import { ArrowUpDown, ChevronDown, CirclePlus, PlusIcon, SquarePen } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RsvpTableProps {
  rsvpData: {name: string, createdAt: string, plusOnes: { name: string, createdAt: string }[]}[]
}

export default function RsvpTable ({ rsvpData }: RsvpTableProps) {

  return (
    <>
      {rsvpData.map((person) => {
        return (
          <Collapsible key={person.name} defaultOpen>
            <Table className="table-fixed">
              {/** custom column sizing */}
              {/* <CategoryColumns /> */}
              <TableHeader>
                <TableRow className="group/category">
                  <TableHead className="pt-2 w-7">
                    <CollapsibleTrigger className="group">
                      <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                    </CollapsibleTrigger>
                  </TableHead>
                  <TableHead className="font-bold text-lg pb-1 md:pb-0">{person.name}</TableHead>
                  <TableHead className="font-bold text-lg pb-1 md:pb-0">{person.createdAt}</TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody className="last:border-b border-burg">
                  {person.plusOnes.map((plusOne) => (
                    <TableRow key={plusOne.name}>
                      <TableCell></TableCell>
                      <TableCell className="font-medium">{plusOne.name}</TableCell>
                      <TableCell className="font-medium">{plusOne.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </CollapsibleContent>
            </Table>
          </Collapsible>
        );
      })}
    </>
  );
}