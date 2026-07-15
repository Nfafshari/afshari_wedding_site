"use client";

import { Menu } from 'lucide-react';
import NavButton from '@/components/nav-button';
import { useSidebar } from "@/components/ui/sidebar"
import { useState } from 'react';
import LogoSvg from './logo-svg';

export default function Header () {
  const {
    toggleSidebar
  } = useSidebar();

  const [isActive, setIsActive] = useState('/');

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
            href={'/'}
            onClick={() => setIsActive('/')}
            isActive={isActive === '/'}
          >
            Home
          </NavButton>
          <NavButton 
            href={'/'}
            onClick={() => setIsActive('our-story')}
            isActive={isActive === 'our-story'}
          >
            Our Story
          </NavButton>
          <NavButton 
            href={'/'}
            onClick={() => setIsActive('rsvp')}
            isActive={isActive === 'rsvp'}
          >
            RSVP
          </NavButton>
        </div>

        <div className='script-title hidden justify-center mx-6 items-center md:flex'>
          <div className='h-20 w-20'>
            <LogoSvg className='w-full h-full' />
          </div>
        </div>

        <div className='flex w-full gap-3 mr-10 items-center justify-start'>
          <NavButton 
            href={'/'}
            onClick={() => setIsActive('registry')}
            isActive={isActive === 'registry'}
          >
            Registry
          </NavButton>
          <NavButton 
            href={'/'}
            onClick={() => setIsActive('details')}
            isActive={isActive === 'details'}
          >
            Details
          </NavButton>
          <NavButton 
            href={'/'}
            onClick={() => setIsActive('wedding-party')}
            isActive={isActive === 'wedding-party'}
          >
            Wedding Party
          </NavButton>
        </div>
      </nav>
    </header>
  );
}