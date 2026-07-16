"use server";

import { revalidatePath } from "next/cache";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@/generated/prisma/client";

/**
 * Which input a failure relates to, so the client can flag the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name';

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/**
 * Example action — rename it, add params, and wire up Prisma.
 */
export async function exampleAction(name: string): Promise<ActionResult> {
  // Validate on the server.
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Name cannot be empty.', field: 'name' };
  }

  try {
    // TODO: perform the DB write, e.g.
    // await prisma.model.create({ data: { name: trimmedName } });
  } catch (error) {
    // P2002 = unique constraint, P2025 = record not found. Handle as needed:
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { ... }
    console.error("*ERROR - exampleAction failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Refresh the page data after a successful write.
  revalidatePath('/rsvp');
  return { ok: true };
}
