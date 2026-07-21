import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import RegistryManager from "./client";

export const dynamic = 'force-dynamic';

export async function getRegistryItems () {
  // Guarded here rather than only in the layout: Next renders layouts and pages in
  // parallel, so this query would otherwise fire before the layout's redirect wins.
  await requireUser();

  const registryItems = await prisma.registryItem.findMany({
    include: {
      claimed: {
        // Oldest claim first, so the list reads in the order people called dibs.
        // createdAt ties are possible (the seed writes several in the same ms), so
        // break on id — otherwise Postgres is free to reorder them between queries.
        orderBy: [{ createdAt: "asc" }, { id: "asc" }]
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }]
  });

  // Map the raw Prisma rows into a plain shape for the client. Unlike the budget
  // page there is no Decimal to unwrap here — quantities are Int — but the explicit
  // mapping still keeps the client's props from silently tracking schema columns.
  // createdAt stays a Date: Next serializes those across the boundary fine, and
  // components already call .toLocaleDateString() on Dates elsewhere.
  return registryItems.map((registryItem) => ({
    id: registryItem.id,
    name: registryItem.name,
    link: registryItem.link,
    quantityWanted: registryItem.quantityWanted,
    image: registryItem.image,
    claimed: registryItem.claimed.map((registryClaim) => ({
      id: registryClaim.id,
      claimedBy: registryClaim.claimedBy,
      quantity: registryClaim.quantity,
      createdAt: registryClaim.createdAt,
      itemId: registryClaim.itemId
    })),
  }));
}

export type RegistryItem = Awaited<ReturnType<typeof getRegistryItems>>[number]
export type RegistryClaim = RegistryItem["claimed"][number]

export default async function RegistryManagerPage () {
  const registryItems = await getRegistryItems();

  return <RegistryManager registryItems={registryItems}/>;
}
