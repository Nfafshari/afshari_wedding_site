"use client";

import { Button } from "./ui/button";

interface NavButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
  isActive: boolean;
}

export default function FilterButton ({ children, isActive, ...props}: NavButtonProps) {
  return (
    <Button 
      variant={'outline'}
      aria-pressed={isActive}
      className="rounded-full md:text-xl md:px-5 md:py-4"
      {...props}
    >
      {children}
    </Button>
  )
}