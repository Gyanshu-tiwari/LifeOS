import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Clock,
  Coffee,
  Fuel,
  Hotel,
  RefreshCw,
  Edit2,
  Compass,
  Sparkles,
  Utensils,
  Landmark,
} from 'lucide-react';
import { Plan, Place } from '../types';
import { useRoute, usePlaces, useRecalculateRoute } from '../hooks';
import JourneyMap, { PlaceCategory, getPlaceCategory } from '../components/map/JourneyMap';
import StartingLocationBox from '../components/map/StartingLocationBox';
import { cn } from '../lib/utils';
import { MapLoadingSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';

export default function JourneyPage() {
  const { plan } = useOutletContext<{ plan: Plan }>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('ALL');
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);
  const { addToast } = useToast();

  const {
    data: route,
    isLoading: routeLoading,
    error: routeError,
    refetch: refetchRoute,
  } = useRoute(plan.id);

  const { data: places = [], isLoading: placesLoading } = usePlaces(plan.id);
  const recalculateMutation = useRecalculateRoute(plan.id);

  const hasRoute = Boolean(route && route.origin_text && route.polyline);
  // Show starting location box if no route exists or if user clicked to edit
  const showStartingLocationBox = !hasRoute || isEditingOrigin;

  const formatDistance = (m?: number | null) => {
    if (!m) return '-- km';
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
  };

  const formatDuration = (s?: number | null) => {
    if (!s) return '--';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getCategoryDetails = (category: 'IMPORTANT' | 'FOOD' | 'WONDERING' | 'STAYS') => {
    switch (category) {
      case 'IMPORTANT':
        return {
          icon: Landmark,
          label: 'Must-See Landmark',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'FOOD':
        return {
          icon: Coffee,
          label: 'Food & Dining',
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
        };
      case 'WONDERING':
        return {
          icon: Compass,
          label: 'Wondering & Leisure',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'STAYS':
        return {
          icon: Hotel,
          label: 'Stay & Transit',
          bg: 'bg-sky-100 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
    }
  };

  const handlePlanRoute = async ({
    origin,
    destination,
    travelMode,
  }: {
    origin: string;
    destination?: string;
    travelMode: string;
  }) => {
    try {
      await recalculateMutation.mutateAsync({
        origin,
        destination,
        travel_mode: travelMode,
      });

      setIsEditingOrigin(false);
      addToast({
        title: 'Route Planned Successfully!',
        message: `Optimal route calculated from ${origin}.`,
        type: 'success',
        duration: 3500,
      });
    } catch (err: any) {
      addToast({
        title: 'Route Planning Failed',
        message: err?.response?.data?.detail || 'Could not calculate directions for the specified locations.',
        type: 'error',
      });
    }
  };

  const handleRefreshRoute = () => {
    recalculateMutation.mutate(undefined, {
      onSuccess: () => {
        addToast({
          title: 'Route Recalculated',
          message: 'Real-time route geometry and durations have been refreshed.',
          type: 'success',
          duration: 3000,
        });
      },
      onError: () => {
        addToast({
          title: 'Route Recalculation Failed',
          message: 'Unable to recalculate route directions. Please check your connection.',
          type: 'error',
        });
      },
    });
  };

  // Filtered places according to selected category
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'ALL') return places;
    return places.filter((p) => getPlaceCategory(p.primary_type, p.name) === selectedCategory);
  }, [places, selectedCategory]);

  const originName = route?.origin_text || 'Origin Not Set';
  const destinationName = route?.destination_text || plan.title || 'Destination';

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg">
      {/* Map Header */}
      <div className="h-72 md:h-96 relative bg-slate-100 shrink-0">
        {routeLoading ? (
          <MapLoadingSkeleton />
        ) : routeError ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <ErrorState
              error={routeError}
              fallbackMessage="Could not load map route."
              onRetry={() => refetchRoute()}
            />
          </div>
        ) : (
          <JourneyMap
            route={route}
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 -mt-4 relative z-10 space-y-4 max-w-4xl mx-auto w-full pb-16">
        {/* Starting Location Selection Box */}
        {showStartingLocationBox && (
          <StartingLocationBox
            initialOrigin={route?.origin_text}
            defaultDestination={route?.destination_text || plan.title}
            onPlanRoute={handlePlanRoute}
            isPlanning={recalculateMutation.isPending}
            showClose={hasRoute}
            onClose={() => setIsEditingOrigin(false)}
          />
        )}

        {/* Route Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg md:text-xl font-bold text-lifeos-navy">
                  {originName} → {destinationName}
                </h2>
                {!hasRoute && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    Route Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-lifeos-muted mt-0.5 capitalize">
                {hasRoute
                  ? `Travel mode: ${(route?.travel_mode || 'Drive').toLowerCase()}`
                  : 'Select your starting location above to activate the driving route.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {hasRoute && (
                <button
                  type="button"
                  onClick={() => setIsEditingOrigin(true)}
                  className="text-xs text-lifeos-blue hover:text-blue-700 flex items-center space-x-1.5 border border-blue-200 bg-blue-50/70 px-3 py-1.5 rounded-xl font-semibold transition active:scale-95 shadow-soft-sm"
                  title="Change departure location"
                >
                  <Edit2 size={13} />
                  <span>Change Start</span>
                </button>
              )}

              {hasRoute && (
                <button
                  onClick={handleRefreshRoute}
                  disabled={recalculateMutation.isPending}
                  className="text-xs text-lifeos-navy hover:text-lifeos-blue flex items-center space-x-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-xl font-semibold transition disabled:opacity-50 active:scale-95 shadow-soft-sm"
                  title="Recalculate route via Maps API"
                  aria-label="Refresh route"
                >
                  <RefreshCw
                    size={13}
                    className={recalculateMutation.isPending ? 'animate-spin' : ''}
                  />
                  <span className="hidden sm:inline">
                    {recalculateMutation.isPending ? 'Recalculating...' : 'Refresh'}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs md:text-sm text-lifeos-navy font-semibold pt-1 border-t border-gray-100">
            <div className="flex items-center space-x-1.5">
              <Navigation size={15} className="text-lifeos-blue" />
              <span>{formatDistance(route?.distance_meters)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock size={15} className="text-lifeos-blue" />
              <span>{formatDuration(route?.duration_seconds)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin size={15} className="text-lifeos-blue" />
              <span>{places.length} flagged locations</span>
            </div>
          </div>
        </div>

        {/* Flagged Places & Waypoints Section */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-lifeos-navy text-sm md:text-base">
                Flagged Locations & Verified Stops
              </h3>
              <p className="text-xs text-lifeos-muted mt-0.5">
                Important landmarks, restaurants, cafes, and wandering spots.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {(['ALL', 'IMPORTANT', 'FOOD', 'WONDERING', 'STAYS'] as PlaceCategory[]).map((cat) => {
                const isSelected = selectedCategory === cat;
                const labels: Record<PlaceCategory, string> = {
                  ALL: 'All',
                  IMPORTANT: '⭐ Important',
                  FOOD: '🍴 Food',
                  WONDERING: '🧭 Wondering',
                  STAYS: '🏨 Stays',
                };
                return (
                  <button
                    key={cat}
                    type="button"
                    data-testid={`category-tab-${cat.toLowerCase()}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-lg border transition whitespace-nowrap',
                      isSelected
                        ? 'bg-lifeos-navy text-white border-lifeos-navy shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {labels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pb-2">
            {/* Origin Stop */}
            <div className="relative pl-6">
              <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-emerald-500 shadow-sm text-emerald-600">
                <MapPin size={12} strokeWidth={3} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-lifeos-navy">{originName}</h4>
                  <p className="text-xs text-lifeos-muted mt-0.5">Journey Start Departure</p>
                </div>
                {!hasRoute && (
                  <button
                    type="button"
                    onClick={() => setIsEditingOrigin(true)}
                    className="text-xs text-lifeos-blue font-bold hover:underline"
                  >
                    Set Location
                  </button>
                )}
              </div>
            </div>

            {/* Intermediate Flagged Places */}
            {placesLoading ? (
              <div className="pl-6 text-xs text-lifeos-muted py-2">Loading verified locations...</div>
            ) : filteredPlaces.length === 0 ? (
              <div className="pl-6 text-xs text-lifeos-muted py-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                No locations match the selected category for this journey.
              </div>
            ) : (
              filteredPlaces.map((place) => {
                const category = getPlaceCategory(place.primary_type, place.name);
                const details = getCategoryDetails(category);
                const IconComponent = details.icon;
                const isSelected = selectedPlace?.id === place.id;

                return (
                  <div
                    key={place.id}
                    data-testid="timeline-stop"
                    onClick={() => setSelectedPlace(isSelected ? null : place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedPlace(isSelected ? null : place);
                    }}
                    className={cn(
                      'relative pl-6 cursor-pointer p-3 rounded-xl transition select-none border',
                      isSelected
                        ? 'bg-blue-50/90 border-blue-300 shadow-soft-sm'
                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute -left-[13px] top-3 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 shadow-sm',
                        category === 'IMPORTANT' && 'border-amber-500 text-amber-600',
                        category === 'FOOD' && 'border-orange-500 text-orange-600',
                        category === 'WONDERING' && 'border-purple-500 text-purple-600',
                        category === 'STAYS' && 'border-sky-500 text-sky-600'
                      )}
                    >
                      <IconComponent size={12} strokeWidth={2.5} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-lifeos-navy leading-snug">
                            {place.name}
                          </h4>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                              details.bg
                            )}
                          >
                            {details.label}
                          </span>
                        </div>
                        {place.rating && (
                          <span className="text-[11px] font-semibold text-amber-600 shrink-0">
                            ★ {place.rating}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-lifeos-muted mt-1 leading-relaxed">
                        {place.formatted_address || place.primary_type || 'Verified location'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Destination Stop */}
            <div className="relative pl-6">
              <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-rose-500 shadow-sm text-rose-600">
                <MapPin size={12} strokeWidth={3} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-lifeos-navy">{destinationName}</h4>
                <p className="text-xs text-lifeos-muted mt-0.5">
                  Arrival Destination • {hasRoute ? formatDuration(route?.duration_seconds) : '--'} estimated travel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
