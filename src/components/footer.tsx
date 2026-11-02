import { ExternalLink, Heart } from "lucide-react";
import Link from "next/link";

import { COUPLE, FOOTER_LINE } from "@/lib/guest-content";

const LINK = "rounded-sm underline-offset-4 hover:text-burg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** One footer for the whole site: the guest pages, the planner and the sign-in pages. */
export default function Footer () {
  return (
    <footer className="w-full border-t border-gold/60 bg-cream-100 px-4 py-10 text-center font-guest">
      <p className="guest-label flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>{FOOTER_LINE}</span>
        <Heart className="size-3.5 fill-current" aria-hidden />
        <span>{COUPLE}</span>
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-burg/70">
        <Link
          href={'https://github.com/Nfafshari/afshari_wedding_site/issues/new'}
          target='_blank'
          rel='noopener noreferrer'
          className={`${LINK} inline-flex items-center gap-1`}
        >
          See a bug? Report it
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
        <Link href={'/'} className={LINK}>
          Home
        </Link>
        <Link href={'/planner'} className={LINK}>
          Planner
        </Link>
      </div>
      <p className="mt-4 text-xs text-burg/70">© {new Date().getFullYear()} {COUPLE}</p>
    </footer>
  );
}
