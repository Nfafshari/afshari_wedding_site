/**
 * Document archive rules, shared by the documents page and its tests.
 *
 * Structural parameters rather than `ArchivedDoc`, for the same reason as lib/registry.ts:
 * keeping `lib/` from importing `app/`.
 */

import { matchesSearch } from "./search";

/** The tag a tile shows for a file type. */
export type FileTypeLabel = 'PDF' | 'JPG' | 'PNG' | 'File';

/**
 * The file type, from the stored file name's extension: "3f2a….pdf" is a PDF. The upload
 * action names every file `<uuid><extension>` from its MIME type, so the extension is ours,
 * not the uploader's. Anything unexpected reads as a plain "File".
 */
export function fileTypeLabel (filePath: string): FileTypeLabel {
  const extension = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase();
  if (!filePath.includes('.')) return 'File';
  if (extension === 'pdf') return 'PDF';
  if (extension === 'png') return 'PNG';
  if (extension === 'jpg' || extension === 'jpeg') return 'JPG';
  return 'File';
}

/** How the archive is ordered, kept in `?sort=`. Newest is the default. */
export const DOC_SORTS = ['newest', 'az'] as const;
export type DocSort = typeof DOC_SORTS[number];

export function isDocSort (value: string | null): value is DocSort {
  return DOC_SORTS.some((sort) => sort === value);
}

type DocLike = { name: string; companyName: string; createdAt: Date };

/** The documents the archive shows: those whose name or company matches the search, in the chosen order. */
export function filterAndSortDocs<T extends DocLike> (docs: T[], query: string, sort: DocSort): T[] {
  const matching = docs.filter((doc) => matchesSearch(query, doc.name, doc.companyName));
  return matching.toSorted(sort === 'az'
    ? (a, b) => a.name.localeCompare(b.name)
    : (a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
