import Link from "next/link";

interface NavButtonProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  isActive: boolean;
}

export default function NavButton ({
 children,
 isActive,
 ...props
}: NavButtonProps) {

  return (
    <Link 
      className={`px-3 py-2.5 text-xl border border-transparent text-center hover:border hover:border-(--burg) hover:border-b-(--gold) hover:text-(--gold) xl:text-3xl ${isActive ? 'text-(--gold) border-b border-b-(--gold)' : 'text-white'}` }
      {...props}
    >
      {children}
    </Link>
  );
}