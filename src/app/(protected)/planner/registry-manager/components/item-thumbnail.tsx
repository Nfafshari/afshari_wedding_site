"use client";

import { useState } from "react";
import { Gift } from "lucide-react";

import { cn } from "@/lib/utils";

/** The placeholder the DB fills in when an item is saved without an image. */
export const PLACEHOLDER_IMAGE = '/window.svg';

/**
 * The item's picture, or a gift icon when there is none or it fails to load. Used by the
 * list and the item dialog's preview.
 *
 * A plain <img>, not next/image: registry pictures come from whatever CDN the couple
 * shopped at, so images.remotePatterns would have to be '**', which turns /_next/image
 * into an open resizing proxy anyone can aim anywhere.
 */
export default function ItemThumbnail ({ image, className }: { image: string | null; className?: string }) {
  // Remember which URL failed, not merely that one did, so an edited image gets a fresh try.
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const hasImage = image !== null && image !== PLACEHOLDER_IMAGE && image !== brokenImage;

  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-card", className)}>
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBrokenImage(image)}
          className="size-full object-contain p-0.5"
        />
      ) : (
        <Gift className="size-5 text-gold-ink" strokeWidth={1.5} aria-hidden />
      )}
    </span>
  );
}
