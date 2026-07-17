"use client";

import { useState } from 'react';
import { Menu } from 'lucide-react';

import NavButton from '@/components/nav-button';
import { useSidebar } from "@/components/ui/sidebar"
import LogoSvg from './logo-svg';

export default function PlannerHeader () {
  const { toggleSidebar } = useSidebar();

  const [isActive, setIsActive] = useState('planner');

  return(
    <header className="z-9999 w-screen h-20 flex tracking-wide items-center bg-foreground md:h-25 md:justify-center">
      {/* Mobile menu */}
      <nav className='pl-5 flex w-full flex-row items-center md:hidden'>
        <Menu 
          className='w-12 h-12 text-5xl text-cream hover:bg-cream/15 p-2 rounded-full'
          onClick={toggleSidebar}
        />
        <div className='flex w-full justify-center'>
          <h1 className='script-title text-gold text-5xl pt-2'>Piper & Nathen</h1>
        </div>
      </nav>

      {/* Desktop menu */}
      <nav className='hidden px-7 w-full flex-row items-center md:flex'>
        <div className='flex w-full gap-3 items-center justify-end'>
          <NavButton 
            href={'/planner'}
            onClick={() => setIsActive('planner')}
            isActive={isActive === 'planner'}
          >
            Planner
          </NavButton>
          <NavButton 
            href={'/planner/checklist'}
            onClick={() => setIsActive('checklist')}
            isActive={isActive === 'checklist'}
          >
            Checklist
          </NavButton>
          <NavButton 
            href={'/planner/rsvp'}
            onClick={() => setIsActive('rsvp')}
            isActive={isActive === 'rsvp'}
          >
            RSVP Manager
          </NavButton>
        </div>

        <div className='script-title hidden justify-center mx-6 items-center md:flex'>
          <div className='h-20 w-20'>
            <LogoSvg className='w-full h-full' />
          </div>
        </div>

        <div className='flex w-full gap-3 mr-10 items-center justify-start'>
          <NavButton 
            href={'/planner/budget'}
            onClick={() => setIsActive('budget')}
            isActive={isActive === 'budget'}
          >
            Budget
          </NavButton>
          <NavButton 
            href={'/planner/registry-manager'}
            onClick={() => setIsActive('registry-claim')}
            isActive={isActive === 'registry-claim'}
          >
            Registry Claims
          </NavButton>
          <NavButton 
            href={'/planner/doc-archive'}
            onClick={() => setIsActive('documents')}
            isActive={isActive === 'documents'}
          >
            Documents
          </NavButton>
        </div>
      </nav>
    </header>
  );
}
