import type { Metadata } from 'next';
import './globals.css';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import SubHeader from '@/components/layout/SubHeader';
import Navbar from '@/components/layout/Navbar';
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'JD Power Warehouse — Discount Home Improvement & Tools in Plainfield, IL',
  description:
    'Save up to 70% on power tools, outdoor furniture, lawn equipment, grills, and hardware in Plainfield & Homer Glen, IL. Daily overstock deals at JD Power Warehouse.',
  keywords: 'liquidation, overstock, tools, outdoor furniture, power tools, Plainfield IL, home improvement',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <AnnouncementBar />
        <SubHeader />
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
