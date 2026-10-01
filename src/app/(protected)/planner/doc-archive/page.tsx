import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { supabase, DOCUMENTS_BUCKET } from "@/lib/supabase";
import DocArchive from "./client";
import type { ArchivedDoc } from "./data";

export const dynamic = 'force-dynamic';

/** How long a document link stays valid. Every render (and every write's revalidate) mints fresh ones. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getDocuments (): Promise<ArchivedDoc[]> {
  // Guarded here rather than only in the layout: Next renders layouts and pages in
  // parallel, so this query would otherwise fire before the layout's redirect wins.
  await requireUser();

  const documents = await prisma.document.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (documents.length === 0) {
    return [];
  }

  // The bucket is private, so each file needs a signed link. One batched call for
  // every document, not one round trip per card.
  const { data: signedUrls, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrls(documents.map((doc) => doc.filePath), SIGNED_URL_TTL_SECONDS);
  if (error) {
    throw new Error(`Could not sign document links: ${error.message}`);
  }

  // Look links up by path rather than trusting the response order to match.
  const linkByPath = new Map(signedUrls.map((signed) => [signed.path, signed.signedUrl]));

  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
    companyName: doc.companyName,
    icon: doc.icon,
    link: linkByPath.get(doc.filePath) ?? '',
  }));
}

/** The archive's size, for the planner overview card. Skips signing links it would never show. */
export async function getDocumentCount (): Promise<number> {
  await requireUser();
  return prisma.document.count();
}

export default async function DocArchivePage() {
  const docs = await getDocuments();

  return <DocArchive docs={docs} />;
}
