import Footer from "@/components/footer";
import PlannerHeader from "@/components/planner-header";
import { NavSidebar } from "@/components/nav-sidebar";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/planner" },
  { label: "Checklist", href: "/planner/checklist" },
  { label: "RSVP Manager", href: "/planner/rsvp" },
  { label: "Budget", href: "/planner/budget" },
  { label: "Registry Claims", href: "/planner/registry-manager" },
  { label: "Documents", href: "/planner/doc-archive" },
];

export default async function PlannerLayout ({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-dvh flex flex-col">
      <NavSidebar 
        navItems={NAV_ITEMS}
      />
      <PlannerHeader />
      <div className="w-full px-3 pt-0.5">
        <Link
          className="flex justify-end text-destructive underline hover:text-red-800 md:flex"
          href={'/sign-out'}
        >
          Sign Out?
        </Link>
      </div>
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
