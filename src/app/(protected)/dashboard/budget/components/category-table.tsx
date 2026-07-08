"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { ChevronDown } from "lucide-react";
import { toCurrency } from "@/lib/utils";
import CategoryColumns from "./category-columns";

export interface Category {
  categoryName: string;
  items: {
    name: string;
    estimatedCost: number;
    paidAmount: number;
  }[];
}

interface CategoryTableProps {
  data: Category[];
}

export default function CategoryTable ({ data }: CategoryTableProps) {

  return (
    <>
      {/** custom heading */}
      <Table className="w-full table-fixed">
        {/** custom column sizing */}
        <CategoryColumns />
        <TableHeader>
          <TableRow className="hover:bg-background border-b border-b-accent">
            <TableHead className="h-6"/>
            <TableHead className="h-6 text-xs leading-tight text-accent">CATEGORY</TableHead>
            <TableHead className="hidden h-6 text-xs leading-tight text-accent md:table-cell">ESTIMATED</TableHead>
            <TableHead className="hidden h-6 text-xs leading-tight text-accent md:table-cell">PAID</TableHead>
            <TableHead className="h-6 text-xs leading-tight text-right text-accent">BALANCE</TableHead>
            <TableHead className="h-6 text-xs leading-tight text-right text-accent">STATUS</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {data.map((category) => {
        const totalEstimated = category.items.reduce((sum, item) => sum + item.estimatedCost, 0);
        const totalPaid = category.items.reduce((sum, item) => sum + item.paidAmount, 0);
        const totalBalance = totalEstimated - totalPaid;

        return (
          <Collapsible key={category.categoryName} defaultOpen>
            <Table className="table-fixed">
              {/** custom column sizing */}
              <CategoryColumns />
              <TableHeader>
                <TableRow>
                  <TableHead className="pt-2">
                    <CollapsibleTrigger className="group">
                      <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                    </CollapsibleTrigger>
                  </TableHead>
                  <TableHead className="font-bold">
                    <div className="md:hidden">
                      {category.categoryName}
                      <p className="text-xs text-accent">{toCurrency(totalEstimated)} est. <span className="text-sm leading-tight">•</span> {toCurrency(totalPaid)} paid</p>
                    </div>
                    <div className="hidden md:block">{category.categoryName}</div>
                  </TableHead>
                  <TableHead className="hidden font-bold md:table-cell">{toCurrency(totalEstimated)}</TableHead>
                  <TableHead className="hidden font-bold md:table-cell">{toCurrency(totalPaid)}</TableHead>
                  <TableHead className="text-right font-bold">{toCurrency(totalBalance)}</TableHead>
                  <TableHead className="text-right font-bold">DUE</TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody className="last:border-b border-burg">
                  {category.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell/>
                      <TableCell className="font-medium">
                        <div className="text-lg md:hidden">
                          {item.name}
                          <p className="text-xs text-accent">{toCurrency(item.estimatedCost)} est. <span className="text-sm leading-tight">•</span> {toCurrency(item.paidAmount)} paid</p>
                        </div>
                        <div className="hidden truncate md:block">{item.name}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{toCurrency(item.estimatedCost)}</TableCell>
                      <TableCell className="hidden md:table-cell">{toCurrency(item.paidAmount)}</TableCell>
                      <TableCell className="text-right">{toCurrency(item.estimatedCost - item.paidAmount)}</TableCell>
                      <TableCell className="text-right">PAID</TableCell>
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
