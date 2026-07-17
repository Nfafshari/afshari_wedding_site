"use client";

import Footer from "@/components/footer";
import LogoSvg from "@/components/logo-svg";
import PlannerHeader from "@/components/planner-header";

export default function PlannerLayout ({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <PlannerHeader />
      {children}
      <Footer />
    </div>
  );
}