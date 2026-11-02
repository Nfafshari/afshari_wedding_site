import type { Metadata } from "next";

import GuestSection from "@/components/guest-section";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { REGISTRY } from "@/lib/guest-content";
import { prisma } from "@/lib/prisma";
import { getClaimedQuantity } from "@/lib/registry";
import RegistryList, { type PublicRegistryItem } from "./client";

export const metadata: Metadata = {
  title: "Registry · Piper & Nathen",
};

/** Per request, so claim counts are current and the build never needs the database. */
export const dynamic = 'force-dynamic';

/**
 * The registry as guests see it. Public on purpose (guests aren't signed in), so it
 * selects claim quantities only, never who claimed.
 */
async function getPublicRegistry (): Promise<PublicRegistryItem[]> {
  const items = await prisma.registryItem.findMany({
    select: {
      id: true,
      name: true,
      link: true,
      image: true,
      quantityWanted: true,
      claimed: { select: { quantity: true } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    link: item.link,
    // The schema's placeholder default is a blank icon; show the gift icon instead.
    image: item.image === "/window.svg" ? null : item.image,
    quantityWanted: item.quantityWanted,
    claimedCount: getClaimedQuantity(item),
  }));
}

export default async function RegistryPage() {
  const items = await getPublicRegistry();

  return (
    <div>
      <GuestSection className="pt-6 pb-10 text-center md:pt-10 md:pb-14">
        <h1 className="guest-display text-5xl md:text-6xl">{REGISTRY.title}</h1>
        <Sprig className="mx-auto mt-6" />
        <p className="mx-auto mt-6 max-w-prose leading-relaxed">{REGISTRY.intro}</p>
      </GuestSection>

      <GuestSection className="pt-0 md:pt-0">
        {items.length > 0 ? (
          <RegistryList items={items} />
        ) : (
          <p className="text-center italic text-burg/70">{REGISTRY.empty}</p>
        )}
      </GuestSection>

      <RsvpBand variant="slim" />
    </div>
  );
}
