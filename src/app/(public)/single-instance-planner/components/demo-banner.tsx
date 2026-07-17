"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDemoPlanner } from "../demo-store";

/**
 * Explains what this planner is, and offers a way back to the seed.
 *
 * Mostly it exists to set an expectation. Everything here is React state, so the
 * first hard refresh throws away whatever the visitor typed — which reads as data
 * loss unless it was announced as a feature first.
 */
export default function DemoBanner () {
  const { reset } = useDemoPlanner();

  return (
    <div className="flex w-full flex-wrap gap-x-3 gap-y-1 items-center justify-center px-4 py-2 bg-olivine/50 border-t-3 border-b-3 border-olivine text-burg text-sm animate-pulse hover:animate-none">
      <p className="text-center">
        <span className="font-bold tracking-[0.16em] text-burg/80">DEMO:</span>
        {' This is a demo of our planner! It uses sample data and it lives only in your browser. You can edit anything and refresh to put it back.'}
      </p>
      <Button
        variant={'ghost'}
        className="h-7 px-2 text-burg/70 underline hover:bg-olivine/30 hover:text-burg"
        onClick={() => reset()}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </Button>
    </div>
  );
}
