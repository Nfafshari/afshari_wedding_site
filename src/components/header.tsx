"use client";

import { Menu } from 'lucide-react';
import NavButton from '@/components/nav-button';
import { useSidebar } from "@/components/ui/sidebar"
import { useState } from 'react';

export default function Header () {
  const {
    toggleSidebar
  } = useSidebar();

  const [isActive, setIsActive] = useState('/');

  return(
    <header className="z-9999 w-screen h-20 flex items-center bg-(--burg) md:h-25 md:justify-center">
      {/* Mobile menu */}
      <nav className='pl-5 flex flex-row items-center md:hidden'>
        <Menu 
          className='w-12 h-12 text-5xl text-white hover:bg-[#2004044b] p-2 rounded-full'
          onClick={toggleSidebar}
        />
        <h1 className='script-title text-white text-5xl pl-2 pt-2'>Piper & Nathen</h1>
      </nav>

      {/* Desktop menu */}
      <nav className='hidden px-7 w-full flex-row items-center md:flex'>
        <div className='flex w-full gap-3 items-center justify-center lg:pr-10 lg:justify-start'>
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

        <div className='script-title hidden justify-center items-center pr-4 md:flex lg:w-full'>
          Piper & Nathen
        </div>

        <div className='flex w-full gap-3 items-center justify-center lg:pl-10 lg:justify-end'>
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