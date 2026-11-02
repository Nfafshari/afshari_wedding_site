import Image from "next/image";

import LogoSvg from "@/components/logo-svg";
import { cn } from "@/lib/utils";

interface ArchPhotoProps {
  /** A file in /public. Without one, the arch shows the monogram and `placeholder`. */
  src?: string;
  alt: string;
  placeholder: string;
  /** Passed to next/image so it picks a sensible file size. */
  sizes: string;
  /** Load first; only for a photo at the top of the page. */
  priority?: boolean;
  /** From lg, fill the parent's height instead of keeping 4:5 (the Home hero). */
  stretch?: boolean;
  className?: string;
}

/** A photo in the guest site's arch: a gold-lined arch inside a second, offset gold line. */
export default function ArchPhoto({ src, alt, placeholder, sizes, priority, stretch, className }: ArchPhotoProps) {
  return (
    <div className={cn("mx-auto w-full max-w-sm rounded-t-full border border-gold/70 p-2.5", stretch && "lg:flex lg:flex-col", className)}>
      <div className={cn("relative aspect-4/5 overflow-hidden rounded-t-full border border-gold/70 bg-olivine-100", stretch && "lg:aspect-auto lg:flex-1")}>
        {src ? (
          <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <LogoSvg aria-hidden className="h-auto w-20 opacity-40" />
            <p className="guest-label">{placeholder}</p>
          </div>
        )}
      </div>
    </div>
  );
}
