export type ProductCategory =
  | 'Tools'
  | 'Outdoor'
  | 'Landscaping'
  | 'Grills'
  | 'Home Improvement'
  | 'Seasonal';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: ProductCategory;
  badge?: 'Sale' | 'New';
  inStock: boolean;
  image?: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: '7-Piece Patio Dining Set',
    price: 450,
    originalPrice: 899,
    description: 'Weather-resistant outdoor dining set, all-season design.',
    category: 'Outdoor',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/59444aeb-52d7-40e5-8f8f-1e89e8899d3c_jpg.jpg',
  },
  {
    id: '2',
    name: 'DeWalt 20V Max Drill Combo Kit',
    price: 129,
    originalPrice: 279,
    description: 'High performance drill and driver combo. Includes 2 batteries.',
    category: 'Tools',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/5ecd6b7e-2134-4677-8677-59865f7d2a3b_jpg.jpg',
  },
  {
    id: '3',
    name: 'Folding Adirondack Chair',
    price: 65,
    description: 'Durable HDPE plastic, easy-fold design, weather resistant.',
    category: 'Outdoor',
    inStock: true,
    image: '/images/catalog/60b4b087-e634-44d5-af6f-6eed391d798e_png.png',
  },
  {
    id: '4',
    name: 'Gorilla Carts Steel Utility Cart',
    price: 85,
    originalPrice: 149,
    description: 'Heavy-duty steel utility wagon, 400 lb capacity.',
    category: 'Landscaping',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/aba2682c-92e7-426b-957d-a2ff23820361_png.png',
  },
  {
    id: '5',
    name: 'Kitchen Faucet with Pull-Down Sprayer',
    price: 95,
    originalPrice: 199,
    description: 'Brushed nickel finish, easy installation, dual-function spray.',
    category: 'Home Improvement',
    badge: 'Sale',
    inStock: true,
  },
  {
    id: '6',
    name: 'LED Shop Light (4ft)',
    price: 19,
    originalPrice: 45,
    description: 'Super bright 4000 lumen LED, plug-and-play workshop lighting.',
    category: 'Tools',
    badge: 'Sale',
    inStock: true,
  },
  {
    id: '7',
    name: 'Milwaukee M18 Fuel Sawzall',
    price: 159,
    originalPrice: 349,
    description: 'Brushless motor, anti-vibration, 18V lithium compatible.',
    category: 'Tools',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/8d8390a7-66bb-4ff2-a6ca-773ade88973d_png.png',
  },
  {
    id: '8',
    name: 'Outdoor Solar Path Lights (6pk)',
    price: 24,
    description: 'Automatic dusk-to-dawn solar landscaping lights, stainless steel.',
    category: 'Landscaping',
    badge: 'New',
    inStock: true,
    image: '/images/catalog/83cf087a-4136-4a1a-89f7-855f3f094568_jpg.jpg',
  },
  {
    id: '9',
    name: 'Ridgid 14 Gal Wet/Dry Vac',
    price: 49,
    originalPrice: 99,
    description: 'Powerful dual-stage motor, fine dust filter included.',
    category: 'Tools',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/de38cf64-2f38-4c1c-b540-87d7a2421f48_jpg.jpg',
  },
  {
    id: '10',
    name: 'Ryobi 40V Brushless Mower',
    price: 299,
    originalPrice: 549,
    description: 'Self-propelled, 20" cutting deck, no gas needed.',
    category: 'Landscaping',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/a712d9c6-82a0-4e68-bdf3-d82d7fdbd474_jpg.jpg',
  },
  {
    id: '11',
    name: 'Smart Wi-Fi Thermostat',
    price: 89,
    description: 'Compatible with Alexa and Google Home. Easy DIY install.',
    category: 'Home Improvement',
    badge: 'New',
    inStock: true,
    image: '/images/catalog/5843b637-e17c-48a9-b5ab-30e4f828ae25_jpg.jpg',
  },
  {
    id: '12',
    name: 'Weber Spirit II E-210 Gas Grill',
    price: 349,
    originalPrice: 599,
    description: '2-burner propane grill, GS4 grilling system, folding side tables.',
    category: 'Grills',
    badge: 'Sale',
    inStock: true,
    image: '/images/catalog/4e28cc10-881f-4aed-a8cf-4bc24d26d2d8_jpg.jpg',
  },
  {
    id: '13',
    name: 'Pressure Washer 2800 PSI',
    price: 189,
    originalPrice: 379,
    description: 'Gas-powered, 2.3 GPM, ideal for driveways and decks.',
    category: 'Tools',
    badge: 'Sale',
    inStock: true,
  },
  {
    id: '14',
    name: 'Garden Hose 100ft Heavy Duty',
    price: 35,
    description: 'Kink-free, UV resistant expandable hose with spray nozzle.',
    category: 'Landscaping',
    inStock: true,
  },
  {
    id: '15',
    name: 'Patio Umbrella 9ft',
    price: 79,
    originalPrice: 149,
    description: 'Crank-open mechanism, weather-resistant fabric, steel pole.',
    category: 'Outdoor',
    badge: 'Sale',
    inStock: true,
  },
  {
    id: '16',
    name: 'Char-Broil Gas Grill 4-Burner',
    price: 249,
    originalPrice: 449,
    description: 'Cabinet-style grill with side burner and 60,000 BTU total output.',
    category: 'Grills',
    badge: 'Sale',
    inStock: true,
  },
];
