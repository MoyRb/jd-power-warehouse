import type { ProductCategory } from './products';

export interface CategoryItem {
  id: string;
  name: string;
  slug: ProductCategory;
  iconName: string;
}

export const categories: CategoryItem[] = [
  { id: 'tools',   name: 'Tools & Construction Supplies',  slug: 'Tools',            iconName: 'Wrench'    },
  { id: 'land',    name: 'Landscaping Products',           slug: 'Landscaping',      iconName: 'Leaf'      },
  { id: 'outdoor', name: 'Outdoor Furniture',              slug: 'Outdoor',          iconName: 'Armchair'  },
  { id: 'grills',  name: 'Grills & Outdoor Cooking',       slug: 'Grills',           iconName: 'Flame'     },
  { id: 'season',  name: 'Seasonal Deals',                 slug: 'Seasonal',         iconName: 'Tag'       },
  { id: 'home',    name: 'Home Improvement Products',      slug: 'Home Improvement', iconName: 'Home'      },
];
