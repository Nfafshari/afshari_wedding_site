"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { PUBLIC_NAV_ITEMS } from "@/lib/public-nav";
import LogoSvg from "./logo-svg";

/**
 * The guest site's menu below the lg breakpoint, where the header has no room for its links.
 * It is a plain Sheet rather than the planner's NavSidebar, because the shadcn Sidebar only
 * switches to its drawer below md and the guest header needs it up to lg. The header's menu
 * button opens it through the sidebar context's `openMobile`.
 */
export default function GuestNavDrawer() {
  const { openMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent side="left" showCloseButton={false} className="gap-0 border-gold/40 bg-burg text-cream">
        <SheetHeader className="items-center border-b border-gold/40 py-6">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Pages of the wedding site.</SheetDescription>
          <LogoSvg aria-hidden className="h-auto w-20" />
        </SheetHeader>
        <SheetClose
          aria-label="Close menu"
          className="absolute top-3 right-3 rounded-full p-2 text-cream hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X className="size-5" aria-hidden />
        </SheetClose>
        <nav aria-label="Main">
          <ul className="mt-4 flex flex-col">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                  className="block border-l-2 border-transparent px-6 py-4 font-heading text-lg font-medium uppercase tracking-[0.2em] text-cream hover:bg-cream/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold aria-[current=page]:border-l-gold aria-[current=page]:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
