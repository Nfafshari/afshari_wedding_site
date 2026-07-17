"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { DemoPlannerProvider } from "./demo-store";
import DemoBanner from "./components/demo-banner";
import Footer from "@/components/footer";
import Header from "@/components/header";

/**
 * Mounts the demo's store around every demo route.
 *
 * It lives in a layout rather than in each page because Next preserves layouts
 * across navigations within a segment — the provider never unmounts, so edits
 * survive moving between the checklist, the budget and the dashboard. A hard
 * refresh remounts it and the seed comes back, which is the point.
 *
 * A client layout can still receive Server Component `children`: they arrive as an
 * already-rendered prop. Context reaches any *client* descendant regardless of who
 * rendered it.
 */
export default function SingleInstancePlannerLayout ({ children }: { children: React.ReactNode }) {
  return (
    <DemoPlannerProvider>
      <Header />
      <DemoBanner />
      <Link href={'/planner'} className="flex items-center text-burg underline mx-2 mt-2 text-sm"><ChevronLeft className="w-5 h-5"/> Back to Planner</Link>
      {children}
      <Footer />
    </DemoPlannerProvider>
  );
}
