import Image from "next/image";

import { cn } from "@/lib/utils";

interface ArtSlotProps {
  /** A transparent PNG, e.g. "/art/florals-left.png". Leave it out until the art exists. */
  src?: string;
  /** Size and position the slot here; the art scales to fit inside it. */
  className?: string;
  /** Passed to next/image so it picks a sensible file size. */
  sizes?: string;
}

/**
 * Reserves room for a piece of painted art (florals, sketches). The art is decoration, so it is
 * hidden from screen readers and never catches clicks. With no `src` the slot stays empty, and
 * the layout doesn't move when the art is added later.
 */
export default function ArtSlot({ src, className, sizes = "(min-width: 1024px) 25vw, 50vw" }: ArtSlotProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative", className)}>
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-contain" />}
    </div>
  );
}
