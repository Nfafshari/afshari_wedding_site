"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  /** Full-size image URL — same source as the thumbnail. */
  src: string;
  /** Describes the image; also becomes the (visually hidden) dialog title. */
  alt: string;
  /**
   * The clickable thumbnail that opens the lightbox. Passed through as the
   * dialog trigger via `asChild`, so it must be a single focusable element.
   */
  children: React.ReactNode;
}

/**
 * A "classic" image lightbox: the thumbnail (passed as children) opens a modal
 * that overlaps the page with an enlarged copy of the image. Escape, the X
 * button, and clicking the backdrop all close it — all courtesy of Radix's
 * Dialog primitive, the same one `sheet.tsx` builds on.
 *
 * Built on the primitive directly rather than a generic shadcn `Dialog`
 * component because a lightbox is unframed (just the image on a dark backdrop)
 * and nothing else in the app needs a plain dialog yet.
 */
export default function ImageLightbox({ src, alt, children }: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70 duration-100 supports-backdrop-filter:backdrop-blur-xs",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          // No description in a lightbox; tell Radix so it doesn't warn about a
          // missing aria-describedby.
          aria-describedby={undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-popover p-2 shadow-lg ring-1 ring-foreground/10 outline-none",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Required for a11y, but the alt text on the image already says it — hide it. */}
          <DialogPrimitive.Title className="sr-only">{alt}</DialogPrimitive.Title>

          {/*
            A plain <img> for the same reason as the row thumbnail: registry
            pictures come from arbitrary retailer CDNs, so next/image is off the table.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-h-[calc(90vh-1rem)] max-w-[calc(92vw-1rem)] rounded-lg object-contain"
          />

          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close image"
              className="absolute top-3 right-3 bg-popover/80 backdrop-blur-sm hover:bg-popover"
            >
              <XIcon />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
