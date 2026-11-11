'use client';

import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

const MAPS_EMBED_URL = `https://www.google.com/maps?q=${SITE_CONFIG.location.mapsQuery}&output=embed`;
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${SITE_CONFIG.location.mapsQuery}`;

export default function BusinessLocationMap() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-[#2e2e2e] min-h-[320px] flex flex-col items-center justify-center gap-4 bg-[#141414]">
        <MapPin className="w-10 h-10 text-[#f3c41b]/40" />
        <div className="text-center px-4">
          <p className="text-[#f6f4ee] font-semibold text-sm">{SITE_CONFIG.location.display}</p>
          <p className="text-[#8c8c8c] text-xs mt-1">{SITE_CONFIG.hours.display}</p>
        </div>
        <a
          href={MAPS_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#f3c41b] hover:text-[#f3c41b]/80 transition-colors font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#2e2e2e] relative min-h-[320px]">
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#141414] flex flex-col items-center justify-center gap-3 z-10">
          <MapPin className="w-8 h-8 text-[#f3c41b]/40 animate-pulse" />
          <p className="text-[#8c8c8c] text-sm">Loading map…</p>
        </div>
      )}

      <iframe
        src={MAPS_EMBED_URL}
        title={`Map showing ${SITE_CONFIG.location.display}`}
        width="100%"
        height="320"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full block"
        style={{ border: 0, minHeight: 320 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />

      {/* Get Directions overlay button */}
      {loaded && (
        <div className="absolute bottom-3 right-3">
          <a
            href={MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#141414]/90 backdrop-blur border border-[#f3c41b]/30 text-[#f3c41b] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Get Directions
          </a>
        </div>
      )}
    </div>
  );
}
