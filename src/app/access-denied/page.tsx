import Footer from "@/components/footer";
import Header from "@/components/header";
import GuestNavDrawer from "@/components/guest-nav-drawer";
import { Ban, TriangleAlert } from "lucide-react";
import Link from "next/link";

export default async function AccessDenied ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // NextAuth routes every sign-in failure here, not just authorization ones.
  // Only AccessDenied means "you are not on the allow list".
  const isDenied = error === 'AccessDenied';

  return (
    <div className="min-h-dvh flex flex-col">
      <GuestNavDrawer />
      <Header />
      <div className="flex flex-col flex-1 justify-center items-center">
        {isDenied ? (
          <>
            <Ban className="w-40 h-40" />
            <h1 className="page-title">Access Denied.</h1>
            <h2>Contact admin for access.</h2>
          </>
        ) : (
          <>
            <TriangleAlert className="w-40 h-40" />
            <h1 className="page-title">Sign-in failed.</h1>
            <h2>Something went wrong signing you in. Please try again.</h2>
            {error && (
              <p className="text-xs text-gold-ink mt-2">Reference code: {error}</p>
            )}
          </>
        )}
        <Link
          href={'/'}
          className="text-xs text-gold-ink underline hover:text-burg mt-3"
        >
          Return home?
        </Link>
      </div>
      <Footer />
    </div>
  );
}
