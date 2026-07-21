import Rsvp from "./client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export const dynamic = 'force-dynamic';

export async function getRsvps () {
  // Guarded here rather than only in the layout: Next renders layouts and pages in
  // parallel, so this query would otherwise fire before the layout's redirect wins.
  await requireUser();

  const rsvps = prisma.rsvp.findMany({
    include: {
      guests: {
        orderBy: [{ name: "asc" }, { id: "asc" }]
      },
     },

    orderBy: [{ id: "asc" }]
  });

  return rsvps;
}

export type Rsvps = Awaited<ReturnType<typeof getRsvps>>[number]

export default async function RsvpPage() {
  const rsvps = await getRsvps();

  return <Rsvp rsvpData={rsvps}/>;
}
