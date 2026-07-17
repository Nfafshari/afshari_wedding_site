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
export default function RsvpColumns ({ heading = false }: CategoryColumnsProps) {
  if (heading) {
    return (
      <colgroup>
        {/* chevron */}
        <col className="w-6" />
        {/* name — wider on mobile, since email/phone fold into a subline beneath it */}
        <col className="w-[52%] md:w-[25%]" />
        {/* plus-ones count */}
        <col className="w-[30%] md:w-[15%]" />
        {/* email (desktop) / notes (mobile) */}
        <col className="w-[25%] md:w-[32%]" />
        {/* phone (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[20%]" />
        {/* notes (desktop) / collapsed (mobile) */}
        <col className="w-0 md:w-[20%]" />
      </colgroup>
    );
  } else {
    return (
      <colgroup>
      {/* chevron */}
      <col className="w-6" />
      {/* name — wider on mobile, since email/phone fold into a subline beneath it */}
      <col className="w-[54%] md:w-[24%]" />
      {/* plus-ones count */}
      <col className="w-[18%] md:w-[12%]" />
      {/* email (desktop) / notes (mobile) */}
      <col className="w-[28%]" />
      {/* phone (desktop) / collapsed (mobile) */}
      <col className="w-0 md:w-[24%]" />
      {/* notes (desktop) / collapsed (mobile) */}
      <col className="w-0 md:w-[12%]" />
    </colgroup>
    );
  }
}
