'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import type { Product, Category } from '@/lib/db/types';
import { formatPrice } from '@/lib/utils';
import { getProductImageSrc } from '@/lib/product-image';

interface ShopClientProps {
  products: Product[]
  categories: Category[]
}

const categoryColors: Record<string, string> = {
  Tools:              'from-amber-950/80 to-yellow-950/40',
  Outdoor:            'from-teal-950/80 to-cyan-950/40',
  Landscaping:        'from-green-950/80 to-emerald-950/40',
  Grills:             'from-red-950/80 to-orange-950/40',
  'Home Improvement': 'from-blue-950/80 to-indigo-950/40',
  Seasonal:           'from-purple-950/80 to-violet-950/40',
};

const categoryEmoji: Record<string, string> = {
  Tools:              '🔧',
  Outdoor:            '🪑',
  Landscaping:        '🌿',
  Grills:             '🔥',
  'Home Improvement': '🏠',
  Seasonal:           '⭐',
};

function ProductImage({ categoryName, name, imagePath }: { categoryName: string; name: string; imagePath?: string | null }) {
  const src = imagePath ? getProductImageSrc(imagePath) : null;
  if (src) {
    return (
      <div className="w-full h-44 relative rounded-t-xl overflow-hidden bg-[#141414]">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
    );
  }
  const grad = categoryColors[categoryName] ?? 'from-zinc-900/80 to-neutral-900/40';
  const emoji = categoryEmoji[categoryName] ?? '📦';
  return (
    <div className={`w-full h-44 bg-gradient-to-br ${grad} flex flex-col items-center justify-center gap-2 rounded-t-xl`}>
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <span className="text-[10px] text-[#8c8c8c] text-center px-3 leading-tight line-clamp-2">{name}</span>
    </div>
  );
}

const ALL_CATEGORIES = 'All';
const SORT_OPTIONS = [
  { value: 'name-asc',   label: 'Name A–Z'     },
  { value: 'name-desc',  label: 'Name Z–A'     },
  { value: 'price-asc',  label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
];

export default function ShopClient({ products, categories }: ShopClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') ?? ALL_CATEGORIES;

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<string>(initialCategory);
  const [sort, setSort]         = useState('name-asc');
  const [cartCount, setCartCount] = useState(0);

  const filterCategories = [ALL_CATEGORIES, ...categories.map((c) => c.name)];

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }

    if (category !== ALL_CATEGORIES) {
      result = result.filter((p) => p.category?.name === category);
    }

    switch (sort) {
      case 'name-asc':   result.sort((a, b) => a.name.localeCompare(b.name));   break;
      case 'name-desc':  result.sort((a, b) => b.name.localeCompare(a.name));   break;
      case 'price-asc':  result.sort((a, b) => a.price - b.price);              break;
      case 'price-desc': result.sort((a, b) => b.price - a.price);              break;
    }

    return result;
  }, [search, category, sort, products]);

  function addToCart() {
    setCartCount((n) => n + 1);
    // Demo: real cart integration goes here
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header row */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#f3c41b]">Our Inventory</h1>
          <p className="text-[#8c8c8c] text-sm mt-1">{filtered.length} item{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] text-sm font-medium px-4 py-2.5 rounded-xl hover:border-[#f3c41b]/40 transition-colors relative"
          aria-label={`Shopping cart, ${cartCount} items`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Shopping Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#f3c41b] text-[#0f0f0f] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c8c]" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm focus:outline-none focus:border-[#f3c41b] placeholder-[#8c8c8c]"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#8c8c8c] shrink-0" />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm focus:outline-none focus:border-[#f3c41b] min-w-[160px]"
        >
          {filterCategories.map((c) => (
            <option key={c} value={c}>{c === ALL_CATEGORIES ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm focus:outline-none focus:border-[#f3c41b] min-w-[160px]"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#8c8c8c] text-lg">No products found matching your search.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setCategory(ALL_CATEGORIES); }}
            className="mt-4 text-[#f3c41b] text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const categoryName = product.category?.name ?? '';
            const firstImage = product.images?.[0]?.storage_path ?? null;
            return (
              <div
                key={product.id}
                className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col hover:border-[#f3c41b]/30 transition-colors group"
              >
                {/* Image */}
                <div className="relative">
                  <ProductImage categoryName={categoryName} name={product.name} imagePath={firstImage} />
                  {/* Category badge */}
                  {categoryName && (
                    <span className="absolute top-2 left-2 bg-[#0a0a0a]/80 text-[#8c8c8c] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#2e2e2e] uppercase tracking-wider">
                      {categoryName}
                    </span>
                  )}
                  {/* Sale/New badge */}
                  {product.badge && (
                    <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      product.badge === 'Sale'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#f3c41b] text-[#0f0f0f]'
                    }`}>
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h3 className="text-[#f6f4ee] font-bold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#f3c41b] font-black text-xl">{formatPrice(product.price)}</span>
                    {product.original_price && (
                      <span className="text-[#8c8c8c] text-xs line-through">{formatPrice(product.original_price)}</span>
                    )}
                  </div>
                  <p className="text-[#8c8c8c] text-xs leading-relaxed line-clamp-2 flex-1">
                    {product.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => addToCart()}
                    className="mt-2 w-full bg-[#f3c41b] text-[#0f0f0f] font-bold text-xs py-2.5 rounded-lg hover:bg-[#e8b818] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
