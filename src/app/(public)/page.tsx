import { Blocks, Construction, Hammer, Wrench } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full px-4 items-center mt-20 bg-cream">
      <div className="flex">
        <Hammer strokeWidth={0.25} className="w-40 h-40 md:w-90 md:h-90 text-gold" />
        <Wrench strokeWidth={0.25} className="w-40 h-40 md:w-90 md:h-90 text-gold" />
      </div>
      <h1 className="text-3xl text-center mt-8">This page is currently under development but the planner is fully complete!</h1>
      <h2 className="text-lg text-center mt-12">If you are looking for the demo click the button below!</h2>
      <Link 
        href={'/single-instance-planner'}
        className="text-burg text-2xl bg-olivine px-3 py-1 rounded-lg mt-4 shadow-md border-b-3 border-b-chart-4 active:translate-y-0.5 active:-translate-x-px active:border-b-2"
      >
        Launch Planner Sandbox
      </Link>
    </div>
  );
}
