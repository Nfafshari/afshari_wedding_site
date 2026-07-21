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
      className={`border-olivine rounded-full text-olivine hover:bg-olivine hover:text-background md:text-xl md:px-5 md:py-4 ${isActive ? 'bg-burg border-burg text-background' : 'bg-background'}`}
      {...props}
    >
      {children}
    </Button>
  )
}