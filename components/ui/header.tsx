import { Menu } from 'lucide-react';
import NavButton from '@/components/ui/navButton';

export default function Header () {
  return(
    <header className="z-9999 w-screen h-26 flex items-center bg-(--burg) md:h-45 md:pb-10 md:justify-center">
      {/* Mobile menu */}
      <nav className='pl-5 flex flex-row items-center md:hidden'>
        <Menu 
          className='w-12 h-12 text-5xl text-white hover:bg-[#2004044b] p-2 rounded-full'
        />
        <h1 className='text-5xl text-white font-pinyon pl-2 pt-1'>Nathen & Piper</h1>
      </nav>

      {/* Desktop menu */}
      <nav className='hidden px-7 w-full flex-row items-center md:flex'>
        <div className='flex w-full gap-3 pr-10 items-center justify-start'>
          <NavButton href={'/'}>Home</NavButton>
          <NavButton href={'/'}>Our Story</NavButton>
          <NavButton href={'/'}>Details</NavButton>
          <NavButton href={'/'}>RSVP</NavButton>
        </div>
        <div className='flex w-full gap-3 pl-10 items-center justify-end'>
          <NavButton href={'/'}>Registry</NavButton>
          <NavButton href={'/'}>Wedding Party</NavButton>
          <NavButton href={'/'}>Dashboard</NavButton>
          <NavButton href={'/'}>Help</NavButton>
        </div>
      </nav>
    </header>
  );
}