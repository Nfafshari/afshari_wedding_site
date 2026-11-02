import type { Metadata } from "next";
import Image from "next/image";

import GuestSection from "@/components/guest-section";
import ImageLightbox from "@/components/image-lightbox";
import LogoSvg from "@/components/logo-svg";
import RsvpBand from "@/components/rsvp-band";
import Sprig from "@/components/sprig";
import { OUR_STORY } from "@/lib/guest-content";

export const metadata: Metadata = {
  title: "Our Story · Piper & Nathen",
};

/** Re-render hourly, so the RSVP band disappears once RSVPs close. */
export const revalidate = 3600;

const SHAPES = { portrait: "aspect-3/4", landscape: "aspect-4/3", square: "aspect-square" } as const;

type Photo = (typeof OUR_STORY.photos)[number];

/** One gallery tile. A real photo opens larger on click; without one, a quiet placeholder. */
function GalleryTile({ photo }: { photo: Photo }) {
  const frame = `relative w-full overflow-hidden rounded-sm border border-gold/50 ${SHAPES[photo.shape]}`;

  if (!photo.src) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-3 bg-olivine-100`}>
        <LogoSvg aria-hidden className="h-auto w-12 opacity-40" />
        <p className="guest-label">{OUR_STORY.photoPlaceholder}</p>
      </div>
    );
  }

  return (
    <ImageLightbox src={photo.src} alt={photo.alt}>
      <button
        type="button"
        aria-label={`Enlarge photo: ${photo.alt}`}
        className={`${frame} block cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 768px) 33vw, 50vw"
          className="object-cover transition-opacity hover:opacity-90"
        />
      </button>
    </ImageLightbox>
  );
}

export default function OurStoryPage() {
  return (
    <div>
      <GuestSection className="pt-6 pb-10 text-center md:pt-10 md:pb-14">
        <h1 className="guest-display text-5xl md:text-6xl">{OUR_STORY.title}</h1>
        <Sprig className="mx-auto mt-6" />
        {OUR_STORY.excerpt.map((paragraph) => (
          <p key={paragraph} className="mx-auto mt-6 max-w-prose leading-relaxed">{paragraph}</p>
        ))}
      </GuestSection>

      <GuestSection aria-labelledby="gallery-title" className="pt-0 md:pt-0">
        <h2 id="gallery-title" className="sr-only">{OUR_STORY.galleryTitle}</h2>
        {/* Columns rather than a grid, so mixed shapes stack without gaps (masonry). */}
        <ul className="columns-2 gap-3 md:columns-3 md:gap-5">
          {OUR_STORY.photos.map((photo, index) => (
            <li key={index} className="mb-3 break-inside-avoid md:mb-5">
              <GalleryTile photo={photo} />
            </li>
          ))}
        </ul>
      </GuestSection>

      <RsvpBand variant="slim" />
    </div>
  );
}
