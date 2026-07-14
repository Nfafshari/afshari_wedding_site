"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Read and write the URL's query string as component state.
 *
 * Keeping both sides behind one hook means a component never reads the query
 * string from one source and writes it through another, so they can't drift.
 *
 * @returns `searchParams` — the current (read-only) params, and `setParams` —
 * updates them and navigates.
 *
 * @example
 * const { searchParams, setParams } = useQueryParams();
 * const activeTab = searchParams.get('category') ?? 'All';
 */
export function useQueryParams () {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  /**
   * Updates the URL's query string and navigates.
   *
   * Starts from a copy of the current params, so anything you don't touch is
   * preserved. Mutate as many as you need — they land in a single navigation.
   *
   * Navigates with `replace` so filter/sort clicks don't pile up history entries
   * the user has to back through, and with `scroll: false` so clicking a control
   * partway down a long page doesn't jump them to the top.
   *
   * @param update - Mutates the params in place: `set`, `delete`, `append`.
   *
   * @example
   * // One param
   * setParams((params) => params.set('category', 'Venue'));
   *
   * @example
   * // Several at once — still one navigation
   * setParams((params) => {
   *   params.set('sort', 'estimated');
   *   params.set('dir', 'desc');
   * });
   *
   * @example
   * // Clear a param (drops it from the URL entirely)
   * setParams((params) => params.delete('category'));
   */
  function setParams (update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    update(params);

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    router.replace(href, { scroll: false });
  }

  return { searchParams, setParams };
}