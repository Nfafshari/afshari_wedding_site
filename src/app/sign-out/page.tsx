import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { signOff } from "./action";
import Link from "next/link";

export default function SignOut () {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center w-79 h-62 bg-muted/10 border border-border rounded-xl shadow-xs px-3 py-5 md:w-80">
          <h1 className="page-title">Sign Out?</h1>
          <hr className="w-full bg-accent mt-2 mb-1" />
          <h2 className="text-center my-3">You are about to sign out. Do you wish to proceed?</h2>
          <hr className="w-full bg-accent mt-2 mb-1" />
          <form
            className="w-full"
            action={signOff}
          >
          <Button 
            className="mt-3 mb-2 w-full text-lg shadow bg-destructive border-b-3 border-b-red-900 text-white hover:bg-destructive/70 active:border-b-2 active:translate-y-0.5 active:-translate-x-px"
            variant={'destructive'}
            size={'lg'}
          >
            Sign Out
          </Button>
          </form>
          <Link 
            className="flex w-full justify-center underline text-sm text-accent hover:text-burg"
            href={'/planner'}
          >
            Go Back?
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}