import Rsvp from "./client";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function getRsvps () {
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
