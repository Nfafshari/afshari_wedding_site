interface CategoryColumnsProps {
  heading?: boolean;
}

/**
 * Column sizing for the category tables, shared so every table aligns.
 *
 * On mobile the ESTIMATED and PAID cells are hidden (`md:table-cell`), which
 * makes the later cells shift left — BALANCE lands in column 3 and STATUS in
 * column 4. So each <col> carries a responsive width that fits whichever
 * logical column occupies it at that breakpoint, and the two trailing columns
 * collapse to zero width on mobile where no cell reaches them.
 */
export default function CategoryColumns ({ heading = false }: CategoryColumnsProps) {
  if (heading) {
    return (
      <colgroup>
        {/* chevron */}
        <col className="w-6" />
        {/* category (wider on mobile, since est/paid fold into its subline) */}
        <col className="w-[45%] md:w-[48%]" />
        {/* estimated (desktop) / balance (mobile) */}
        <col className="w-[40%] md:w-[30%]" />
        {/* paid (desktop) / status (mobile) */}
        <col className="w-[25%] md:w-[21.5%]" />
        {/* balance (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[17%]" />
        {/* status (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[16.5%]" />
      </colgroup>
    );
  } else {
    return (
      <colgroup>
        {/* chevron */}
        <col className="w-6" />
        {/* category (wider on mobile, since est/paid fold into its subline) */}
        <col className="w-[45%] md:w-[50%]" />
        {/* estimated (desktop) / balance (mobile) */}
        <col className="w-[30%] md:w-[31%]" />
        {/* paid (desktop) / status (mobile) */}
        <col className="w-[25%] md:w-[21%]" />
        {/* balance (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[17%]" />
        {/* status (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[18%]" />
      </colgroup>
    );
  }
}
