export interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  name: string;
  location: string;
  initial: string;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    rating: 5,
    quote: 'Found a brand new DeWalt drill for nearly half the price of the big box stores. The staff was incredibly helpful and the warehouse is well organized.',
    name: 'Michael R.',
    location: 'Plainfield, IL',
    initial: 'M',
  },
  {
    id: '2',
    rating: 5,
    quote: 'We bought our entire patio set here. It was a returned item but looked absolutely perfect. Saved over $300!',
    name: 'Sarah L.',
    location: 'Joliet, IL',
    initial: 'S',
  },
  {
    id: '3',
    rating: 5,
    quote: 'Great place for tools and landscaping supplies. I check their inventory every week because they always have something new.',
    name: 'David K.',
    location: 'Naperville, IL',
    initial: 'D',
  },
  {
    id: '4',
    rating: 5,
    quote: 'The WhatsApp support is fantastic. I messaged them about a grill, they sent me extra photos, and I picked it up an hour later.',
    name: 'Jennifer M.',
    location: 'Plainfield, IL',
    initial: 'J',
  },
  {
    id: '5',
    rating: 4,
    quote: 'Liquidation prices but quality products. Highly recommend for any home improvement project.',
    name: 'Robert T.',
    location: 'Shorewood, IL',
    initial: 'R',
  },
  {
    id: '6',
    rating: 5,
    quote: "Best kept secret in Plainfield. I've told all my neighbors about this place.",
    name: 'Amanda S.',
    location: 'Plainfield, IL',
    initial: 'A',
  },
];
