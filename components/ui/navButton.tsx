import Link from "next/link";

interface NavButtonProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
}

export default function NavButton ({
 children,
 ...props
}: NavButtonProps) {
  return (
    <Link 
      className="px-3 py-4 text-xl border border-transparent text-center text-white hover:border hover:border-(--burg) hover:border-b-(--gold) xl:text-3xl"
      {...props}
    >
      {children}
    </Link>
  );
}