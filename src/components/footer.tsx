import Link from "next/link";

export default function Footer () {
  return (
    <div className="h-30 w-full bg-burg md:h-40">
      <div className="flex flex-col w-full h-full text-gold/50 justify-center items-center">
        <p>© {new Date().getFullYear()} Nathen &amp; Piper. All rights reserved.</p>
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
  );
}