/** Lowercase, without accents or surrounding spaces, so "  Zoë " and "zoe" compare equal. */
function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * Whether any of the fields contains the query, ignoring case and accents. An empty query
 * matches everything, so a cleared search shows the whole list. Missing fields are skipped.
 */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]) {
  const needle = normalize(query);
  if (!needle) return true;
  return fields.some((field) => field != null && normalize(field).includes(needle));
}
