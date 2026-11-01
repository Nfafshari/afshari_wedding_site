"use client";

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import NavButton from '@/components/nav-button';
import { useSidebar } from "@/components/ui/sidebar"
import LogoSvg from './logo-svg';
import { PLANNER_NAV_ITEMS } from '@/lib/planner-nav';

export default function PlannerHeader () {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  return(
    <header className="relative z-9999 w-screen h-20 flex tracking-wide items-center bg-foreground md:h-25 md:justify-center">
      {/* Mobile menu */}
      <nav className='pl-5 flex w-full flex-row items-center md:hidden'>
        <button
          type='button'
          aria-label='Open menu'
          className='rounded-full p-2 text-cream hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'
          onClick={toggleSidebar}
        >
          <Menu className='w-8 h-8' aria-hidden />
        </button>
        <div className='flex w-full justify-center md:justify-start'>
          <p className='script-title text-gold text-4xl pt-2'>Piper & Nathen</p>
        </div>
      </nav>

      {/* Desktop menu: three pages either side of the logo. */}
      <nav className='hidden px-7 w-full h-35 flex-row items-center md:flex'>
        <div className='flex w-full gap-3 items-center justify-end'>
          {PLANNER_NAV_ITEMS.slice(0, 3).map((item) => (
            <NavButton key={item.href} href={item.href} isActive={pathname === item.href}>
              {item.label}
            </NavButton>
          ))}
        </div>

        <div className='script-title hidden justify-center mx-6 items-center md:flex'>
          <div className='h-20 w-20'>
            <LogoSvg className='w-full h-full' />
          </div>
        </div>

        <div className='flex w-full gap-3 items-center justify-start'>
          {PLANNER_NAV_ITEMS.slice(3).map((item) => (
            <NavButton key={item.href} href={item.href} isActive={pathname === item.href}>
              {item.label}
            </NavButton>
          ))}
        </div>
      </nav>

      {/* Kept apart from the page links so it never reads as a seventh page. */}
      <Link
        href='/sign-out'
        className='absolute top-2 right-4 hidden rounded-sm text-sm text-cream/80 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:block'
      >
        Sign out
      </Link>
    </header>
  );
}
