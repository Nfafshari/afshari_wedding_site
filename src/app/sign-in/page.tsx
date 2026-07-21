import { redirect } from "next/navigation";
import Link from "next/link";

import Footer from "@/components/footer";
import GoogleSignInButton from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signOn } from "./action";
import { auth } from "@/auth";

export default async function SignIn ({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }>; }) {
  // Already signed in? No reason to show a login form.
  const session = await auth();
  if (session?.user) {
    redirect('/planner');
  }

  // Set by the middleware when it bounces a signed-out user off a planner route.
  // Validated server-side in signOn — never trusted as a redirect target here.
  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center w-79 h-100 bg-muted/10 border border-border rounded-xl shadow-xs px-3 py-5 md:w-80">
          <h1 className="page-title">Planner Login</h1>
          <hr className="w-full bg-accent mt-2 mb-1" />
          <Field 
            className="mt-6"
          >
            <form
              action={signOn}
            >
              <input
                type="hidden"
                name="callbackUrl"
                value={callbackUrl ?? ''}
              />
              <GoogleSignInButton
                size={'md'}
                theme={'neutral'}
                className="w-full"
              />
            </form>
            <p className="my-0.5 text-center text-lg text-accent-foreground">or</p>
            <Input 
              className="w-full h-10 bg-muted/5"
              placeholder="Email"
            />
            <Input 
              className="w-full h-10 bg-muted/5"
              placeholder="Password"
              type="password"
            />
          </Field>

          <hr className="w-full bg-accent mt-8 mb-4" />
          <Button
            className="w-[90%] text-burg text-2xl bg-olivine px-3 py-1 rounded-lg shadow-md border-b-3 border-b-chart-4 active:translate-y-0.5 active:-translate-x-px active:border-b-2 hover:bg-olivine/85"
          >
            Login
          </Button>
          <Link 
            href={'/'}
            className="text-xs text-accent underline hover:text-burg mt-3"
          >
            Return home?
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}