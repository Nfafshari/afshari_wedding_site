/**
 * Column sizing for the category tables, shared so every table aligns.
 *
 * On mobile the ESTIMATED, PAID and actions cells are hidden (`md:table-cell`),
 * which makes the later cells shift left — BALANCE lands in column 3 and STATUS
 * in column 4. So each <col> carries a responsive width that fits whichever
 * logical column occupies it at that breakpoint, and the three trailing columns
 * collapse to zero width on mobile where no cell reaches them.
 */
export default function CategoryColumns () {
  return (
    <colgroup>
      {/* chevron */}
      <col className="w-6" />
      {/* category (wider on mobile, since est/paid and the actions fold beneath it) */}
      <col className="w-[45%] md:w-[30%]" />
      {/* estimated (desktop) / balance (mobile) */}
      <col className="w-[30%] md:w-[16%]" />
      {/* paid (desktop) / status (mobile) */}
      <col className="w-[25%] md:w-[16%]" />
      {/* balance (desktop) / collapsed (mobile) */}
      <col className="w-0 md:w-[16%]" />
      {/* status (desktop) / collapsed (mobile) */}
      <col className="w-0 md:w-[14%]" />
      {/* edit / delete (desktop) / collapsed (mobile) */}
      <col className="w-0 md:w-18" />
    </colgroup>
  );
}
