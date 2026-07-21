"use server";

import { signOut } from "@/auth";

export async function signOff () {
    await signOut({ redirectTo: '/' });
}