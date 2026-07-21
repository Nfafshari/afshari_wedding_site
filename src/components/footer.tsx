import { Bug, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Footer () {
  return (
    <div className="h-30 w-full bg-burg md:h-40">
      <div className="flex flex-col w-full h-full text-gold/50 justify-center items-center">
        <p>© {new Date().getFullYear()} Nathen &amp; Piper. All rights reserved.</p>
        <div className="flex w-full justify-center items-center text-sm">
          <p className="flex items-center"><Bug className="w-5 h-5"/> See a bug?</p>
          <Link
            href={'https://github.com/Nfafshari/afshari_wedding_site/issues/new'}
            target='_blank'
            rel='noopener noreferrer'
            className="flex items-center ml-2 underline text-sm"
          >
            click here to report it <ExternalLink className="ml-1 w-4 h-4"/>
          </Link>
          <p className="ml-2">or contact admin.</p>
        </div>
        <div className="flex flex-wrap w-full gap-4 mt-4 justify-center items-center">
          <Link href={'/'} className="underline">
            Home
          </Link>
          <Link href={'/planner'} className="underline">
            Planner
          </Link>
          <Link href={'/single-instance-planner'} className="underline">
            Planner (DEMO)
          </Link>
        </div>
      </div>
    </div>
  );
}
