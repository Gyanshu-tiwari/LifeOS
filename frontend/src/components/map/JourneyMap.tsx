import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Place, Route } from '../../types';
import { decodePolyline } from '../../lib/polyline';
import { Maximize2, Sparkles, Utensils, Compass, Hotel, Layers } from 'lucide-react';

if (typeof window !== 'undefined' && 'setWorkerUrl' in maplibregl) {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type PlaceCategory = 'ALL' | 'IMPORTANT' | 'FOOD' | 'WONDERING' | 'STAYS';

export function getPlaceCategory(
  type?: string | null,
  name?: string | null
): 'IMPORTANT' | 'FOOD' | 'WONDERING' | 'STAYS' {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const text = `${t} ${n}`;

  if (
    text.includes('restaurant') ||
    text.includes('food') ||
    text.includes('cafe') ||
    text.includes('bakery') ||
    text.includes('bar') ||
    text.includes('dining') ||
    text.includes('bistro') ||
    text.includes('retreat') ||
    text.includes('eatery') ||
    text.includes('meal')
  ) {
    return 'FOOD';
  }

  if (
    text.includes('monument') ||
    text.includes('museum') ||
    text.includes('historical') ||
    text.includes('castle') ||
    text.includes('fort') ||
    text.includes('palace') ||
    text.includes('temple') ||
    text.includes('church') ||
    text.includes('mosque') ||
    text.includes('landmark') ||
    text.includes('tourist_attraction') ||
    text.includes('heritage')
  ) {
    return 'IMPORTANT';
  }

  if (
    text.includes('hotel') ||
    text.includes('lodging') ||
    text.includes('resort') ||
    text.includes('stay') ||
    text.includes('gas_station') ||
    text.includes('fuel') ||
    text.includes('petrol') ||
    text.includes('parking') ||
    text.includes('transit')
  ) {
    return 'STAYS';
  }

  return 'WONDERING';
}

interface JourneyMapProps {
  route?: Route | null;
  places?: Place[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place | null) => void;
  selectedCategory?: PlaceCategory;
  onSelectCategory?: (category: PlaceCategory) => void;
  className?: string;
  interactive?: boolean;
}

const CARTO_POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const CATEGORY_CONFIG: Record<
  'IMPORTANT' | 'FOOD' | 'WONDERING' | 'STAYS',
  { label: string; icon: string; bg: string; border: string; badgeBg: string; text: string }
> = {
  IMPORTANT: {
    label: 'Important Place',
    icon: '⭐',
    bg: '#D97706',
    border: '#B45309',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    text: 'text-amber-700',
  },
  FOOD: {
    label: 'Food & Dining',
    icon: '🍴',
    bg: '#EA580C',
    border: '#C2410C',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    text: 'text-orange-700',
  },
  WONDERING: {
    label: 'Wondering & Leisure',
    icon: '🧭',
    bg: '#7C3AED',
    border: '#6D28D9',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    text: 'text-purple-700',
  },
  STAYS: {
    label: 'Stay & Transit',
    icon: '🏨',
    bg: '#0284C7',
    border: '#0369A1',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    text: 'text-sky-700',
  },
};

export default function JourneyMap({
  route,
  places = [],
  selectedPlace,
  onSelectPlace,
  selectedCategory: externalCategory,
  onSelectCategory: externalSetCategory,
  className = 'w-full h-full',
  interactive = true,
}: JourneyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [internalCategory, setInternalCategory] = useState<PlaceCategory>('ALL');

  const currentCategory = externalCategory ?? internalCategory;
  const setCategory = (cat: PlaceCategory) => {
    if (externalSetCategory) externalSetCategory(cat);
    setInternalCategory(cat);
  };

  // Filter places based on selected category
  const filteredPlaces = useMemo(() => {
    if (currentCategory === 'ALL') return places;
    return places.filter((p) => getPlaceCategory(p.primary_type, p.name) === currentCategory);
  }, [places, currentCategory]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { ALL: places.length, IMPORTANT: 0, FOOD: 0, WONDERING: 0, STAYS: 0 };
    places.forEach((p) => {
      const cat = getPlaceCategory(p.primary_type, p.name);
      counts[cat]++;
    });
    return counts;
  }, [places]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: CARTO_POSITRON_STYLE,
      center: [77.209, 28.6139], // Default: Delhi
      zoom: 6,
      attributionControl: false,
      interactive: interactive,
    });

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    }

    map.on('load', () => {
      setMapLoaded(true);
      map.resize();
    });

    mapRef.current = map;

    // Use ResizeObserver to ensure map canvas automatically tracks container changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // 2. Render Route Polyline & Flagged Place Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    let hasCoords = false;

    // ── 2A. Draw Route Polyline (if route available) ─────────────────────── //
    if (route?.polyline) {
      const coordinates = decodePolyline(route.polyline);

      if (coordinates.length > 0) {
        coordinates.forEach(([lng, lat]) => {
          bounds.extend([lng, lat]);
          hasCoords = true;
        });

        const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates,
              },
            },
          ],
        };

        if (map.getSource('route-source')) {
          (map.getSource('route-source') as maplibregl.GeoJSONSource).setData(geojson);
        } else {
          map.addSource('route-source', {
            type: 'geojson',
            data: geojson,
          });

          // Route casing
          map.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#1E293B',
              'line-width': 7,
              'line-opacity': 0.75,
            },
          });

          // Main line
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#2563EB',
              'line-width': 4.5,
              'line-opacity': 0.95,
            },
          });
        }

        // Add Origin & Destination Pill Markers
        const startCoord = coordinates[0];
        const endCoord = coordinates[coordinates.length - 1];

        // Origin Marker (Green Flag)
        const startEl = document.createElement('div');
        startEl.className =
          'bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center space-x-1 border-2 border-white cursor-pointer hover:scale-105 transition-all select-none z-20';
        startEl.innerHTML = `<span class="text-xs">🟢</span><span>${escapeHtml(route.origin_text || 'Start')}</span>`;
        const startMarker = new maplibregl.Marker({ element: startEl })
          .setLngLat(startCoord)
          .addTo(map);
        markersRef.current.push(startMarker);

        // Destination Marker (Red Flag)
        const endEl = document.createElement('div');
        endEl.className =
          'bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center space-x-1 border-2 border-white cursor-pointer hover:scale-105 transition-all select-none z-20';
        endEl.innerHTML = `<span class="text-xs">🏁</span><span>${escapeHtml(route.destination_text || 'Destination')}</span>`;
        const endMarker = new maplibregl.Marker({ element: endEl })
          .setLngLat(endCoord)
          .addTo(map);
        markersRef.current.push(endMarker);
      }
    }

    // ── 2B. Add Flagged Places Markers ─────────────────────────────────── //
    filteredPlaces.forEach((place) => {
      if (place.latitude && place.longitude) {
        const coord: [number, number] = [place.longitude, place.latitude];
        bounds.extend(coord);
        hasCoords = true;

        const isSelected = selectedPlace?.id === place.id;
        const category = getPlaceCategory(place.primary_type, place.name);
        const config = CATEGORY_CONFIG[category];

        // Flag Pin DOM Element
        const el = document.createElement('div');
        el.className = `group flex flex-col items-center cursor-pointer select-none transition-all duration-300 ${
          isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-10'
        }`;

        // Visual flag pin with category icon & distinct color
        el.innerHTML = `
          <div style="background-color: ${config.bg}; border-color: ${
          isSelected ? '#FFFFFF' : config.border
        }" class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 text-white transition-all">
            <span class="text-xs drop-shadow-sm">${config.icon}</span>
          </div>
          <div style="border-top-color: ${config.bg};" class="w-0 h-0 border-x-4 border-x-transparent border-t-4 -mt-0.5"></div>
        `;

        // Interactive Popup Card
        const popup = new maplibregl.Popup({
          offset: [0, -10],
          closeButton: false,
          className: 'lifeos-map-popup',
        }).setHTML(`
          <div class="p-2.5 max-w-[210px] font-sans">
            <div class="flex items-center space-x-1 mb-1">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${config.badgeBg}">
                ${config.icon} ${config.label}
              </span>
              ${place.rating ? `<span class="text-[11px] font-bold text-amber-600 ml-auto">★ ${escapeHtml(String(place.rating))}</span>` : ''}
            </div>
            <div class="font-bold text-xs text-slate-900 leading-snug">${escapeHtml(place.name || 'Place')}</div>
            ${place.formatted_address ? `<div class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">${escapeHtml(place.formatted_address)}</div>` : ''}
          </div>
        `);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPlace?.(place);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(coord)
          .setPopup(popup)
          .addTo(map);

        if (isSelected) {
          marker.togglePopup();
        }

        markersRef.current.push(marker);
      }
    });

    // ── 2C. Fit Bounds ─────────────────────────────────────────────────── //
    if (hasCoords) {
      map.fitBounds(bounds, {
        padding: { top: 75, bottom: 65, left: 60, right: 60 },
        maxZoom: 14,
        duration: 800,
      });
    }
  }, [mapLoaded, route, filteredPlaces, selectedPlace, onSelectPlace]);

  // 3. Pan to Selected Place
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedPlace?.latitude || !selectedPlace?.longitude) return;

    map.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: 14,
      essential: true,
      duration: 1000,
    });
  }, [selectedPlace, mapLoaded]);

  // Fit all items into view
  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new maplibregl.LngLatBounds();
    let hasCoords = false;

    if (route?.polyline) {
      const coords = decodePolyline(route.polyline);
      coords.forEach(([lng, lat]) => {
        bounds.extend([lng, lat]);
        hasCoords = true;
      });
    }

    filteredPlaces.forEach((p) => {
      if (p.latitude && p.longitude) {
        bounds.extend([p.longitude, p.latitude]);
        hasCoords = true;
      }
    });

    if (hasCoords) {
      map.fitBounds(bounds, { padding: 60, duration: 800 });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-soft-sm border border-gray-100"
      />

      {/* Floating Category Filter Pills */}
      {interactive && places.length > 0 && (
        <div className="absolute top-3 left-3 right-14 z-10 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 pr-2">
          <button
            type="button"
            onClick={() => setCategory('ALL')}
            className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm border backdrop-blur-md ${
              currentCategory === 'ALL'
                ? 'bg-lifeos-navy text-white border-lifeos-navy shadow'
                : 'bg-white/90 text-slate-700 hover:bg-white border-gray-200'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80">({categoryCounts.ALL})</span>
          </button>

          {categoryCounts.IMPORTANT > 0 && (
            <button
              type="button"
              onClick={() => setCategory('IMPORTANT')}
              className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm border backdrop-blur-md ${
                currentCategory === 'IMPORTANT'
                  ? 'bg-amber-600 text-white border-amber-600 shadow'
                  : 'bg-white/90 text-slate-700 hover:bg-white border-gray-200'
              }`}
            >
              <span>⭐ Important</span>
              <span className="text-[10px] opacity-80">({categoryCounts.IMPORTANT})</span>
            </button>
          )}

          {categoryCounts.FOOD > 0 && (
            <button
              type="button"
              onClick={() => setCategory('FOOD')}
              className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm border backdrop-blur-md ${
                currentCategory === 'FOOD'
                  ? 'bg-orange-600 text-white border-orange-600 shadow'
                  : 'bg-white/90 text-slate-700 hover:bg-white border-gray-200'
              }`}
            >
              <span>🍴 Food</span>
              <span className="text-[10px] opacity-80">({categoryCounts.FOOD})</span>
            </button>
          )}

          {categoryCounts.WONDERING > 0 && (
            <button
              type="button"
              onClick={() => setCategory('WONDERING')}
              className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm border backdrop-blur-md ${
                currentCategory === 'WONDERING'
                  ? 'bg-purple-600 text-white border-purple-600 shadow'
                  : 'bg-white/90 text-slate-700 hover:bg-white border-gray-200'
              }`}
            >
              <span>🧭 Wondering</span>
              <span className="text-[10px] opacity-80">({categoryCounts.WONDERING})</span>
            </button>
          )}

          {categoryCounts.STAYS > 0 && (
            <button
              type="button"
              onClick={() => setCategory('STAYS')}
              className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm border backdrop-blur-md ${
                currentCategory === 'STAYS'
                  ? 'bg-sky-600 text-white border-sky-600 shadow'
                  : 'bg-white/90 text-slate-700 hover:bg-white border-gray-200'
              }`}
            >
              <span>🏨 Stays & Transit</span>
              <span className="text-[10px] opacity-80">({categoryCounts.STAYS})</span>
            </button>
          )}
        </div>
      )}

      {/* Fit to Route Button */}
      {interactive && (
        <button
          onClick={fitAll}
          title="Fit route and places in view"
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-blue-600 p-2.5 rounded-xl shadow-md border border-gray-200 transition z-10 flex items-center space-x-1 text-xs font-semibold active:scale-95"
          aria-label="Fit to map"
        >
          <Maximize2 size={15} />
        </button>
      )}
    </div>
  );
}
