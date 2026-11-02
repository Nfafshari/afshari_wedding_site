/**
 * Words shown on the guest site. Placeholders until the real copy is ready: edit the values
 * here, not the layouts. Each guest page issue adds its own section.
 */
export const COUPLE = "Piper & Nathen";

export const FOOTER_LINE = "We can't wait to celebrate with you";

export const WEDDING = {
  names: ["Piper", "Nathen"],
  /** For the countdown. */
  isoDate: "2027-09-11",
  date: "September 11, 2027",
  venue: "Big Horn Equestrian Center",
  place: "Sheridan, Wyoming",
} as const;

export const HOME = {
  welcome: "Welcome to our wedding",
  /** Set `src` to a file in /public (e.g. "/photos/hero.jpg") to replace the placeholder. */
  heroPhoto: {
    src: undefined as string | undefined,
    alt: "Piper and Nathen",
    placeholder: "Photo needed",
  },
  story: {
    title: "Our Story",
    // Placeholder copy.
    text: "A few sentences about how we met and how we got here. The full story lives on its own page.",
    linkLabel: "Read our story",
  },
  details: {
    title: "Weekend Details",
    items: [
      { key: "venue", title: "The Venue", text: "Big Horn Equestrian Center, Sheridan, Wyoming", href: "/details#venue", linkLabel: "View the venue" },
      { key: "schedule", title: "The Schedule", text: "Every event of the weekend, with times and places.", href: "/details#schedule", linkLabel: "View the schedule" },
      { key: "travel", title: "Travel", text: "Flights, hotels and getting around Sheridan.", href: "/details#travel", linkLabel: "View travel info" },
    ],
  },
} as const;

/** The burgundy band at the foot of guest pages that sends guests to the RSVP form. */
export const RSVP_BAND = {
  kicker: "Kindly",
  title: "RSVP",
  button: "RSVP now",
  /** The one line on the slim band other pages use. */
  slimLine: FOOTER_LINE,
} as const;

/**
 * Our Story page: a short excerpt, then a photo gallery. Placeholder copy, written as "we".
 * Photos: set `src` to a file in /public; `shape` sets the tile's proportions in the gallery.
 */
export const OUR_STORY = {
  title: "Our Story",
  excerpt: [
    "A few sentences about how we met and how we got here: where it started, the moment we knew, and how the question was asked.",
    "We're so glad you're part of our story, and we can't wait to celebrate the next chapter with you on September 11.",
  ],
  galleryTitle: "Photos",
  photoPlaceholder: "Photo needed",
  photos: [
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "portrait" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "landscape" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "square" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "landscape" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "portrait" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "square" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "portrait" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "landscape" },
    { src: undefined as string | undefined, alt: "Piper and Nathen", shape: "portrait" },
  ],
} as const;

/**
 * Details page: the venue, the schedule and travel. Placeholders, except the venue's name and
 * town. Links open in a new tab. Venue photo: set `src` to a file in /public.
 */
export const DETAILS = {
  title: "Details",
  venue: {
    title: "The Venue",
    address: "Street address, Sheridan, WY 82801",
    note: "A sentence or two about the venue: the setting, what to expect on arrival, and where to park.",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Big+Horn+Equestrian+Center+Sheridan+WY",
    mapLabel: "Get directions",
    photo: { src: undefined as string | undefined, alt: "Big Horn Equestrian Center" },
  },
  schedule: {
    title: "The Schedule",
    days: [
      {
        label: "Saturday, September 11",
        events: [
          { time: "4:00 PM", name: "Ceremony", place: "Big Horn Equestrian Center", note: "Dress note, e.g. cocktail attire" },
          { time: "5:30 PM", name: "Reception", place: "Big Horn Equestrian Center", note: "Dinner and dancing to follow" },
        ],
      },
    ],
  },
  travel: {
    title: "Travel",
    intro: "A short note about getting to Sheridan and getting around once you're here.",
    hotelsTitle: "Where to stay",
    bookLabel: "Book a room",
    hotels: [
      { name: "Hotel name", town: "Sheridan, WY", blockCode: "Room block code" as string | undefined, url: "https://example.com" },
      { name: "Second hotel name", town: "Sheridan, WY", blockCode: undefined as string | undefined, url: "https://example.com" },
    ],
  },
  photoPlaceholder: "Photo needed",
} as const;
