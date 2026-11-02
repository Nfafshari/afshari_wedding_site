"use client";

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useSidebar } from "@/components/ui/sidebar"
import { PUBLIC_NAV_ITEMS } from '@/lib/public-nav';
import LogoSvg from './logo-svg';

type NavItem = (typeof PUBLIC_NAV_ITEMS)[number];

function GuestNavLink ({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className='relative whitespace-nowrap rounded-sm py-2 font-guest text-xs font-medium uppercase tracking-[0.14em] text-cream/90 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold aria-[current=page]:text-gold after:absolute after:inset-x-0 after:bottom-0 after:mx-auto after:h-px after:w-6 after:bg-gold after:opacity-0 aria-[current=page]:after:opacity-100 xl:text-[13px] xl:tracking-[0.2em]'
    >
      {item.label}
    </Link>
  );
}

export default function Header () {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  // The first half of the pages sit left of the crest, the rest to its right.
  const split = Math.ceil(PUBLIC_NAV_ITEMS.length / 2);
  const links = (items: readonly NavItem[]) =>
    items.map((item) => <GuestNavLink key={item.href} item={item} isActive={pathname === item.href} />);

  return(
    // The crest hangs below the band; the bottom margin keeps it clear of the page.
    <header className="relative z-40 mb-8 h-16 w-full bg-burg lg:mb-12 lg:h-24">
      <button
        type='button'
        aria-label='Open menu'
        className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-cream hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden'
        onClick={() => setOpenMobile(true)}
      >
        <Menu className='size-7' aria-hidden />
      </button>

      <nav aria-label='Main' className='hidden h-full items-center px-6 lg:flex'>
        <div className='flex flex-1 items-center justify-end gap-4 xl:gap-6'>
          {links(PUBLIC_NAV_ITEMS.slice(0, split))}
        </div>
        {/* Room for the crest. */}
        <div className='w-44 shrink-0 xl:w-52' />
        <div className='flex flex-1 items-center justify-start gap-4 xl:gap-6'>
          {links(PUBLIC_NAV_ITEMS.slice(split))}
        </div>
      </nav>

      <Link
        href='/'
        aria-label='Piper & Nathen, home'
        className='absolute left-1/2 top-0 w-24 -translate-x-1/2 rounded-b-full bg-burg px-4.5 pt-2 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:w-40 lg:px-8 lg:pt-3 lg:pb-5'
      >
        <LogoSvg aria-hidden className='h-auto w-full' />
      </Link>
    </header>
  );
}
