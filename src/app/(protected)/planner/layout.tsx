import Footer from "@/components/footer";
import PlannerHeader from "@/components/planner-header";
import { NavSidebar } from "@/components/nav-sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/planner" },
  { label: "Checklist", href: "/planner/checklist" },
  { label: "RSVP Manager", href: "/planner/rsvp" },
  { label: "Budget", href: "/planner/budget" },
  { label: "Registry Claims", href: "/planner/registry-manager" },
  { label: "Documents", href: "/planner/doc-archive" },
];

export default function PlannerLayout ({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavSidebar 
        navItems={NAV_ITEMS}
      />
      <PlannerHeader />
      {children}
      <Footer />
    </div>
  );
}
