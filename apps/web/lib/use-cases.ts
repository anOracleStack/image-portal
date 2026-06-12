export const USE_CASE_SLUGS = [
  "posters-flyers",
  "restaurant-menus",
  "event-tickets",
  "product-packaging",
  "art-photography",
  "business-cards",
] as const;

export type UseCaseSlug = (typeof USE_CASE_SLUGS)[number];

export type UseCaseConfig = {
  slug: UseCaseSlug;
  /** ALL CAPS display title on cards & modal */
  titleCaps: string;
  lines: readonly [string, string];
  destination: string;
  /** Short label for demo example strings */
  categoryLabel: string;
  uploadExample: string;
  captureExample: string;
  scanExample: string;
};

export const USE_CASES: readonly UseCaseConfig[] = [
  {
    slug: "posters-flyers",
    titleCaps: "POSTERS & FLYERS",
    lines: [
      "Printed materials that change with your content.",
      "Update the link without reprinting.",
    ],
    destination: "rub.pub/summer-launch",
    categoryLabel: "event poster",
    uploadExample: "Example: event poster file (.PNG)",
    captureExample: "Example: phone photo of a poster on a wall",
    scanExample: "Example: scanning a printed flyer in the wild",
  },
  {
    slug: "restaurant-menus",
    titleCaps: "RESTAURANT MENUS",
    lines: [
      "The menu image itself is scannable.",
      "Change prices & bring up items instantly.",
    ],
    destination: "rub.pub/menu",
    categoryLabel: "restaurant menu",
    uploadExample: "Example: trifold menu file (.PNG)",
    captureExample: "Example: phone photo of a menu at the table",
    scanExample: "Example: scanning a printed menu in the dining room",
  },
  {
    slug: "event-tickets",
    titleCaps: "EVENT TICKETS",
    lines: [
      "Real-time — schedule, venue, & refunds.",
      "Update ticket details without reprinting.",
    ],
    destination: "rub.pub/tickets",
    categoryLabel: "event ticket",
    uploadExample: "Example: ticket artwork file (.PNG)",
    captureExample: "Example: phone photo of a ticket at the venue",
    scanExample: "Example: scanning a printed ticket at the door",
  },
  {
    slug: "product-packaging",
    titleCaps: "PRODUCT PACKAGING",
    lines: [
      "Packaging becomes a channel to your brand.",
      "Manuals, offers, & unboxing.",
    ],
    destination: "rub.pub/unbox",
    categoryLabel: "product box",
    uploadExample: "Example: packaging panel file (.PNG)",
    captureExample: "Example: phone photo of a box on a shelf",
    scanExample: "Example: scanning packaging in-store",
  },
  {
    slug: "art-photography",
    titleCaps: "ART & PHOTOGRAPHY",
    lines: [
      "Every physical print becomes a gallery link.",
      "Collectors scan to view, buy, or learn more.",
    ],
    destination: "rub.pub/gallery",
    categoryLabel: "art print",
    uploadExample: "Example: exhibition print file (.PNG)",
    captureExample: "Example: phone photo of a print on a gallery wall",
    scanExample: "Example: scanning a framed print at an opening",
  },
  {
    slug: "business-cards",
    titleCaps: "BUSINESS CARDS",
    lines: [
      "Your card design is the key to your link.",
      "No separate QR block required on the card.",
    ],
    destination: "rub.pub/card",
    categoryLabel: "business card",
    uploadExample: "Example: business card design file (.PNG)",
    captureExample: "Example: phone photo of a card on a desk",
    scanExample: "Example: scanning a card at a networking event",
  },
] as const;

export function getUseCase(slug: UseCaseSlug): UseCaseConfig {
  const found = USE_CASES.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown use case slug: ${slug}`);
  return found;
}

export function demoAssetPath(slug: UseCaseSlug, file: "reference" | "scan" | "thumb"): string {
  return `/demo/${slug}/${file}.webp`;
}
