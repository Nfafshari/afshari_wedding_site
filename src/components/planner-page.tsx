/** The width and spacing every planner page shares. */
export default function PlannerPage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 text-burg md:px-8">{children}</div>;
}
