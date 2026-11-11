/**
 * Central business configuration for JD Power Warehouse.
 * All public-facing contact data is sourced from here.
 *
 * PENDING (required before go-live):
 *  - PHONE: real phone number from business owner
 *  - WHATSAPP: real WhatsApp number (digits only, e.g. "18154441234")
 *  - FACEBOOK: official Facebook page URL
 *  - INSTAGRAM: official Instagram profile URL
 */
export const SITE_CONFIG = {
  name: 'JD Power Warehouse',
  url: 'https://jd-power-warehouse.com',
  email: 'contact@jd-power-warehouse.com',

  // ── Contact — PENDING real values from business owner ──────────────────────
  // phone: '+1 (815) 000-0000',   // TODO: replace with real number
  // whatsapp: '18150000000',       // TODO: digits only, no spaces/dashes

  location: {
    city: 'Plainfield',
    state: 'IL',
    stateCode: 'IL',
    country: 'US',
    display: 'Plainfield & Homer Glen, IL',
    mapsQuery: 'Plainfield,+IL',
    // streetAddress: undefined,  // TODO: confirm street address for JSON-LD
  },

  hours: {
    display: 'Daily 6am–10pm',
    opens: '06:00',
    closes: '22:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },

  // ── Social — PENDING real accounts from business owner ─────────────────────
  social: {
    // facebook: 'https://www.facebook.com/jdpowerwarehouse',  // TODO
    // instagram: 'https://www.instagram.com/jdpowerwarehouse', // TODO
  },

  seo: {
    title: 'JD Power Warehouse — Discount Home Improvement & Tools in Plainfield, IL',
    description:
      'Save up to 70% on power tools, outdoor furniture, lawn equipment, grills, and hardware in Plainfield & Homer Glen, IL. Daily overstock deals at JD Power Warehouse.',
    keywords: [
      'liquidation', 'overstock', 'tools', 'outdoor furniture', 'power tools',
      'Plainfield IL', 'Homer Glen IL', 'home improvement', 'discount tools',
      'warehouse sale',
    ],
  },
} as const
