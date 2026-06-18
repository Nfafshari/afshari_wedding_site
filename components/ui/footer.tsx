import Link from "next/link";

export default function Footer () {
  return (
    <div className="h-20 w-full bg-[#240404] md:h-40">
      <div className="flex flex-col w-full h-full text-(--gold)/50 justify-center items-center">
        <p>© {new Date().getFullYear()} Nathen &amp; Piper. All rights reserved.</p>
        <Link href={'/'} className="underline">
          Dashboard
        </Link>
        <Link href={'/'} className="underline">
          Home
        </Link>
      </div>
    </div>
  );
}