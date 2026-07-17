import type { RegistryItem } from "../demo-types";

/**
 * Demo registry data, transcribed from `src/prisma/seed.ts`'s REGISTRY_ITEMS.
 *
 * The seed's invariants still hold, and they are the reason this set is worth
 * keeping intact: no item is over-claimed (the app refuses to create that state,
 * so the data shouldn't fabricate it), and between them the four items cover every
 * state the page renders — nothing claimed, partly claimed by several people,
 * partly claimed by one, and fully claimed with `image: null` so the placeholder
 * fallback gets exercised.
 *
 * Items are pre-sorted by name and claims oldest-first within each item, matching
 * what `getRegistryItems` used to return.
 */
export const DEMO_REGISTRY_ITEMS: RegistryItem[] = [
  // --- Nothing claimed yet ---
  {
    id: 1,
    name: 'Cast Iron Dutch Oven',
    link: 'https://www.amazon.com/Lodge-Quart-Enameled-Enamel-Oyster/dp/B00U1OCPWQ?crid=1N048DEWJV3D4&dib=eyJ2IjoiMSJ9.8xHzKb_rBuHmSTTDrpe9zAxWFv5NzSzCA_NgGSRerwSy896XQSUaK8Flm4zseMPmM_4KEDXrxXkhvG37tVxoE-ZfZhA7lz64gPGkUcavtIbdYth1hFBCnkmjWE0ZwYwb71l_OF3M6Uq6PMYWLUy9TuqvYk-RbQc_pk4jH3oDY379tC8vqI47CT-StfLHkhwVGIZbGYPfKXu2QZH_0xUXhL570ndfHeDIWke2OIg4OYL50bjn2SHg0awoBemthaTq5qp6rDGBdk1xyRC3IfBOVGdCGANWoP9tAb_tYvFJw60.Nsa9Ckw-7-vRd_zXF9eiod9_EDF-iWoBzie-N-DFChI&dib_tag=se&keywords=dutch%2Bover&qid=1784315709&sprefix=dutch%2Bover%2Caps%2C192&sr=8-7&ufe=app_do%3Aamzn1.fos.9fe8cbfa-bf43-43d1-a707-3f4e65a4b666&th=1',
    image: 'https://www.allrecipes.com/thmb/Tv2bnVgeg4c_3buJHVH0gHOCTvE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/lecreuset-42100fc9e440421288f405a3f9b027d2.png',
    quantityWanted: 1,
    claimed: [],
  },
  // --- Partly claimed, several claimants ---
  {
    id: 2,
    name: 'Linen Bath Towels',
    link: 'https://www.amazon.com/COTTON-CRAFT-Waffle-Bath-Towel/dp/B0DHD7482X?crid=282N7QUHEKU0A&dib=eyJ2IjoiMSJ9.kckHkggKFoVIFugaG6G8ARHdBUrC9PtjootucZz8Nm9iQ2QXQ6Ahzx3T5fV9Jjbsm86lra-vYYV2Dkc4kMzKvBOJS0HZE79zS3CYNFea6jszpvjFdcygeFVnyG1NO9wj0XEnOEccF9AtCTNRV1NsCb_0VVgmW4gg3hev1FBdJ234SFrZqXo9gHK4xlX9UZqGYeouAS7HxH_wG8r8VkCA14-dwVpSdiMLqzT8iBxroMnuL0yRyyiFTqw9ragmBkwf4BOGaPjMmHBVr_ehLJ3SkvJpmYpUegy0PwR6gRpDmbw.2Ey9xVavmDqUdA0K4E3VAvWtQs6Uy1g9HqJUxXvbooQ&dib_tag=se&keywords=linen%2Bbath%2Btowels&qid=1784315981&sprefix=linen%2Bbath%2Btowels%2Caps%2C191&sr=8-16&th=1',
    image: 'https://res.cloudinary.com/companystore/image/upload/b_rgb:FFFFFF,c_pad,dpr_2.0,f_auto,h_400,q_90,w_400/c_pad,h_400,w_400/v1/webimages/59060_texture_g20_alt1?pgw=1',
    quantityWanted: 8,
    claimed: [
      { id: 1, claimedBy: 'Aunt Sue', quantity: 2, createdAt: new Date('2026-07-02'), itemId: 2 },
      { id: 2, claimedBy: 'The Millers', quantity: 1, createdAt: new Date('2026-07-09'), itemId: 2 },
    ],
  },
  // --- Fully claimed by a single claimant ---
  {
    id: 3,
    name: 'Stand Mixer',
    link: 'https://www.amazon.com/KitchenAid-KSM150PSPT-Artisan-Pouring-Shield/dp/B0000635XA?crid=DF1O6N70I8AY&dib=eyJ2IjoiMSJ9.GSBa-53tmLlLvnbCj_Yb6hvJ1wvB3p-_9Q-yuhtbPv7mxyJum4dmK43QNMHjL2HpXxepTSZiIvi1g_tVKmXkGCSzXm7_IPg3uJHzlmAz1cKI4DHUQyByNgIOq-9aLWfzp1o9C4_zUqxXdxoGN8warGz_krcyddQD0eS1IZnSqBSF0IMAI8xqcLxtDNrymxemHfPJZFxAZMzo_y74COZiUHZg0b5AMhObAO82SNd5wU0.kDUIV9WgDzQTkn8e992xDGVLX5NmZKWYAY0M45LYoSk&dib_tag=se&keywords=stand%2Bmixer&qid=1784316161&sprefix=stand%2Bmixe%2Caps%2C196&sr=8-3&th=1',
    image: 'https://i5.walmartimages.com/seo/KitchenAid-Classic-Series-4-5-Quart-Tilt-Head-Stand-Mixer-Onyx-Black-K45SS_c684367a-f3de-436a-86bf-0f572e0f40dd.c65e4d7b7da28b63c9b0d466b2e5c293.jpeg',
    quantityWanted: 1,
    claimed: [
      { id: 3, claimedBy: 'Grace Okafor', quantity: 1, createdAt: new Date('2026-07-11'), itemId: 3 },
    ],
  },
  // --- Fully claimed, and no image so the placeholder shows ---
  {
    id: 4,
    name: 'Wool Picnic Blanket',
    link: 'https://i5.walmartimages.com/seo/KitchenAid-Classic-Series-4-5-Quart-Tilt-Head-Stand-Mixer-Onyx-Black-K45SS_c684367a-f3de-436a-86bf-0f572e0f40dd.c65e4d7b7da28b63c9b0d466b2e5c293.jpeg',
    image: null,
    quantityWanted: 2,
    claimed: [
      { id: 4, claimedBy: 'Henry Kim', quantity: 1, createdAt: new Date('2026-06-28'), itemId: 4 },
      { id: 5, claimedBy: 'Elena Vasquez', quantity: 1, createdAt: new Date('2026-07-14'), itemId: 4 },
    ],
  },
];
