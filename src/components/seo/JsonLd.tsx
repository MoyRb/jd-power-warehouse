import { SITE_CONFIG } from '@/lib/site-config';

/** Renders a JSON-LD <script> tag. Only renders on the server. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + LocalBusiness combined schema for the root layout. */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    email: SITE_CONFIG.email,
    description: SITE_CONFIG.seo.description,
    areaServed: [
      { '@type': 'City', name: 'Plainfield', containedIn: 'Illinois' },
      { '@type': 'City', name: 'Homer Glen', containedIn: 'Illinois' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CONFIG.location.city,
      addressRegion: SITE_CONFIG.location.stateCode,
      addressCountry: SITE_CONFIG.location.country,
    },
    openingHoursSpecification: SITE_CONFIG.hours.days.map((day) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day,
      opens: SITE_CONFIG.hours.opens,
      closes: SITE_CONFIG.hours.closes,
    })),
    // No aggregateRating, review, or unverified claims
  };

  return <JsonLd data={data} />;
}

/** WebSite schema with sitelinks searchbox. */
export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

/** BreadcrumbList schema for inner pages. */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${SITE_CONFIG.url}${item.href}`,
    })),
  };

  return <JsonLd data={data} />;
}
