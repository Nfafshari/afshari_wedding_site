import Footer from "@/components/footer";
import PlannerHeader from "@/components/planner-header";
import { NavSidebar } from "@/components/nav-sidebar";
import { PLANNER_NAV_ITEMS } from "@/lib/planner-nav";
import { requireUser } from "@/lib/require-user";

export default async function PlannerLayout ({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-dvh flex flex-col">
      <NavSidebar 
        navItems={PLANNER_NAV_ITEMS}
      />
      <PlannerHeader />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
