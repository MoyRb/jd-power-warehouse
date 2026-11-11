import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import ShopClient from '@/components/shop/ShopClient';
import Footer from '@/components/layout/Footer';
import { db } from '@/lib/db';

export const instant = false;

export const metadata: Metadata = {
  title: 'Shop Liquidation Inventory',
  description:
    'Browse tools, lawn equipment, grills, and outdoor patio sets up to 70% off retail prices. Local pickup in Plainfield & Homer Glen, IL. New overstock added weekly.',
  alternates: { canonical: '/shop' },
  openGraph: { title: 'Shop Liquidation Inventory — JD Power Warehouse', url: '/shop' },
};

export default async function ShopPage() {
  // headers() opts this route into dynamic rendering so it's never statically prerendered
  await headers();

  const [productsResult, categories] = await Promise.all([
    db.listProducts({ status: 'published' }),
    db.listCategories(),
  ]);

  return (
    <>
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-10 w-48 bg-[#141414] rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#141414] rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <ShopClient products={productsResult.data} categories={categories} />
      </Suspense>
      <Footer compact />
    </>
  );
}
