import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  Car,
  Bus,
  Footprints,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface StartingLocationBoxProps {
  initialOrigin?: string | null;
  defaultDestination?: string | null;
  onPlanRoute: (params: { origin: string; destination?: string; travelMode: string }) => Promise<void> | void;
  isPlanning?: boolean;
  onClose?: () => void;
  showClose?: boolean;
}

const COMMON_STARTING_HUBS = [
  'New Delhi',
  'Gurgaon',
  'Noida',
  'Mumbai',
  'Bengaluru',
  'Jaipur',
  'Chandigarh',
  'Pune',
];

export default function StartingLocationBox({
  initialOrigin = '',
  defaultDestination = '',
  onPlanRoute,
  isPlanning = false,
  onClose,
  showClose = false,
}: StartingLocationBoxProps) {
  const [origin, setOrigin] = useState(initialOrigin || '');
  const [destination, setDestination] = useState(defaultDestination || '');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TRANSIT' | 'WALK'>('DRIVE');
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const { addToast } = useToast();

  // Reverse geocode lat,lng to human city/region name
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const region = data.principalSubdivision;
        if (city && region && city !== region) {
          return `${city}, ${region}`;
        }
        if (city) return city;
      }
    } catch {
      // Ignore network errors on reverse geocode and fallback to coords
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  // Detect location from client IP address when GPS is unavailable or permission denied
  const detectLocationFromIP = async (): Promise<string | null> => {
    try {
      const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const region = data.principalSubdivision;
        const lat = data.latitude;
        const lon = data.longitude;
        if (city && region && city !== region) {
          return `${city}, ${region}`;
        }
        if (city) return city;
        if (lat && lon) return `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`;
      }
    } catch {
      // Secondary fallback
    }

    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (res2.ok) {
        const data = await res2.json();
        if (data.city) {
          return `${data.city}, ${data.region || data.country_name}`;
        }
      }
    } catch {
      // Secondary fallback error
    }

    return null;
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationSuccess(false);

    const tryBrowserGPS = (): Promise<{ lat: number; lon: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error('Geolocation not supported by browser'));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { timeout: 5000, enableHighAccuracy: false, maximumAge: 300000 }
        );
      });
    };

    try {
      let resolvedLocation: string | null = null;
      let isGps = false;

      try {
        const coords = await tryBrowserGPS();
        isGps = true;
        resolvedLocation = await reverseGeocode(coords.lat, coords.lon);
      } catch (gpsErr) {
        console.warn('Browser GPS unavailable, falling back to IP location:', gpsErr);
        resolvedLocation = await detectLocationFromIP();
      }

      if (resolvedLocation) {
        setOrigin(resolvedLocation);
        setLocationSuccess(true);
        addToast({
          title: isGps ? 'GPS Location Detected' : 'Current Location Detected',
          message: `Starting location set to ${resolvedLocation}.`,
          type: 'success',
          duration: 3500,
        });
      } else {
        addToast({
          title: 'Location Unavailable',
          message: 'Could not automatically detect your location. Please select one of the popular hubs below or type your city.',
          type: 'info',
          duration: 4000,
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Location Error',
        message: err?.message || 'Could not detect location. Please select a city manually.',
        type: 'info',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) {
      addToast({
        title: 'Starting Location Required',
        message: 'Please choose "Use Current Location" or type your starting city/address.',
        type: 'info',
      });
      return;
    }

    onPlanRoute({
      origin: trimmedOrigin,
      destination: destination.trim() || undefined,
      travelMode,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft-lg border-2 border-lifeos-blue/20 relative overflow-hidden transition-all duration-300">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent pointer-events-none rounded-full blur-2xl" />

      {showClose && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start space-x-3.5 mb-4 relative z-10">
        <div className="w-11 h-11 rounded-xl bg-lifeos-blue/10 border border-lifeos-blue/20 flex items-center justify-center shrink-0 text-lifeos-blue shadow-soft-sm">
          <Navigation size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base md:text-lg text-lifeos-navy tracking-tight">
              {initialOrigin ? 'Update Starting Location' : 'Choose Your Starting Location'}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-lifeos-blue text-white px-2 py-0.5 rounded-full">
              Required
            </span>
          </div>
          <p className="text-xs text-lifeos-muted mt-1 leading-relaxed max-w-xl">
            To chart your journey on the map and calculate the optimal driving route and verified stops along the way, set your departure point.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Quick GPS Location Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            data-testid="use-current-location-btn"
            onClick={handleUseCurrentLocation}
            disabled={isLocating || isPlanning}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs md:text-sm border transition active:scale-[0.99] shadow-soft-sm ${
              locationSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent hover:from-blue-700 hover:to-indigo-700 shadow-md'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Detecting Your Location...</span>
              </>
            ) : locationSuccess ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Using Current Location ({origin})</span>
              </>
            ) : (
              <>
                <Compass size={16} />
                <span>📍 Use My Current Location</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center space-x-3 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or enter city</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Manual Origin Input */}
        <div>
          <label className="block text-xs font-bold text-lifeos-navy mb-1.5">
            Starting Location / Departure City
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
              <MapPin size={16} />
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setLocationSuccess(false);
              }}
              placeholder="e.g. New Delhi, Gurgaon, Mumbai, Airport..."
              disabled={isPlanning}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm text-lifeos-navy font-medium placeholder:text-gray-400 focus:bg-white focus:border-lifeos-blue focus:ring-2 focus:ring-lifeos-blue/10 outline-none transition"
            />
          </div>
        </div>

        {/* Quick Pick Hubs */}
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] text-lifeos-muted font-medium mb-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span>Popular Starting Hubs:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_STARTING_HUBS.map((hub) => (
              <button
                key={hub}
                type="button"
                onClick={() => {
                  setOrigin(hub);
                  setLocationSuccess(false);
                }}
                disabled={isPlanning}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                  origin === hub
                    ? 'bg-blue-50 border-lifeos-blue text-lifeos-blue font-bold shadow-sm'
                    : 'bg-white border-gray-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {hub}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Mode Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs font-bold text-lifeos-navy">Mode of Travel:</span>
          <div className="flex p-0.5 bg-gray-100 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setTravelMode('DRIVE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                travelMode === 'DRIVE'
                  ? 'bg-white text-lifeos-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Car size={13} />
              <span>Drive</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('TRANSIT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                travelMode === 'TRANSIT'
                  ? 'bg-white text-lifeos-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Bus size={13} />
              <span>Transit</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('WALK')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                travelMode === 'WALK'
                  ? 'bg-white text-lifeos-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Footprints size={13} />
              <span>Walk</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            data-testid="plan-route-submit"
            disabled={!origin.trim() || isPlanning}
            className={`w-full text-white font-bold py-3 px-5 rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.99] flex items-center justify-center space-x-2 text-xs md:text-sm ${
              locationSuccess
                ? 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-500/20 shadow-lg'
                : 'bg-lifeos-navy hover:bg-lifeos-dark'
            }`}
          >
            {isPlanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Computing Best Route & Waypoints...</span>
              </>
            ) : (
              <>
                <Navigation size={16} />
                <span>Plan Best Route →</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
