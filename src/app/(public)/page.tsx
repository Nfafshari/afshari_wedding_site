import { Hammer, Wrench } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full px-4 items-center mt-20 bg-cream">
      <div className="flex">
        <Hammer strokeWidth={0.25} className="w-40 h-40 md:w-90 md:h-90 text-gold" />
        <Wrench strokeWidth={0.25} className="w-40 h-40 md:w-90 md:h-90 text-gold" />
      </div>
      <h1 className="text-3xl text-center mt-8">This page is currently under development but the planner is fully complete!</h1>
    </div>
  );
}
