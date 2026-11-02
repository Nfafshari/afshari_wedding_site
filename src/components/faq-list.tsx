"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { Accordion } from "radix-ui";

export interface FaqItem {
  question: string;
  answer: string;
  link?: { href: string; label: string };
}

/**
 * The guest FAQ: each question opens its answer, and several can be open at once. Radix
 * handles the keyboard (Tab, Enter/Space, arrow keys) and announces expanded or collapsed.
 */
export default function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root type="multiple" className="border-t border-gold/50">
      {items.map((item) => (
        <Accordion.Item key={item.question} value={item.question} className="border-b border-gold/50">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 rounded-sm py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="font-heading text-xl font-semibold md:text-2xl">{item.question}</span>
              <Plus className="size-5 shrink-0 text-gold-ink group-data-[state=open]:hidden" aria-hidden />
              <Minus className="hidden size-5 shrink-0 text-gold-ink group-data-[state=open]:block" aria-hidden />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-6 pr-11 leading-relaxed">
            <p>{item.answer}</p>
            {item.link && (
              <Link
                href={item.link.href}
                className="guest-label mt-3 inline-block rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.link.label}
              </Link>
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
