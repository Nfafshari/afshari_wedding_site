import Rsvp from "./client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export const dynamic = 'force-dynamic';

export async function getInvitations () {
  // Guarded here rather than only in the layout: Next renders layouts and pages in
  // parallel, so this query would otherwise fire before the layout's redirect wins.
  await requireUser();

  const invitations = prisma.invitation.findMany({
    include: {
      guests: {
        // Invited members first, then their plus-ones.
        orderBy: [{ isPlusOne: "asc" }, { name: "asc" }, { id: "asc" }]
      },
    },

    orderBy: [{ partyName: "asc" }, { id: "asc" }]
  });

  return invitations;
}

/** Singular shape, plural name — matches the other pages' exports. */
export type Invitations = Awaited<ReturnType<typeof getInvitations>>[number]
export type InvitationGuest = Invitations['guests'][number]

export default async function RsvpPage() {
  const invitations = await getInvitations();

  return <Rsvp invitations={invitations}/>;
}
