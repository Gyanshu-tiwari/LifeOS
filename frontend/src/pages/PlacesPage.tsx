import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Star, MapPin, Bookmark, ExternalLink, Phone, Navigation } from 'lucide-react';
import { Plan, Place } from '../types';
import { usePlaces } from '../hooks';
import { cn } from '../lib/utils';
import { PlacesListSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export default function PlacesPage() {
  const { plan } = useOutletContext<{ plan: Plan }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [filter, setFilter] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`lifeos_places_saved_${plan.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data: places = [], isLoading, error, refetch } = usePlaces(plan.id);

  const toggleBookmark = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = place.id;
    const isNowBookmarked = !bookmarkedIds.includes(id);

    setBookmarkedIds((prev) => {
      const next = isNowBookmarked ? [...prev, id] : prev.filter((i) => i !== id);
      localStorage.setItem(`lifeos_places_saved_${plan.id}`, JSON.stringify(next));
      return next;
    });

    addToast({
      title: isNowBookmarked ? 'Place Bookmarked' : 'Bookmark Removed',
      message: `${place.name} has been ${isNowBookmarked ? 'saved to your favorites' : 'removed'}.`,
      type: isNowBookmarked ? 'success' : 'info',
      duration: 2500,
    });
  };

  const categories = ['All', 'Food', 'Fuel', 'Stay', 'Things to do', 'Saved'];

  // Filter places based on selected category
  const filteredPlaces = places.filter((place) => {
    if (filter === 'Saved') return bookmarkedIds.includes(place.id);
    if (filter === 'All') return true;

    const type = (place.primary_type || '').toLowerCase();
    const name = (place.name || '').toLowerCase();

    if (filter === 'Food') {
      return (
        type.includes('restaurant') ||
        type.includes('food') ||
        type.includes('cafe') ||
        type.includes('bakery') ||
        type.includes('meal') ||
        name.includes('restaurant') ||
        name.includes('dhaba') ||
        name.includes('cafe')
      );
    }
    if (filter === 'Fuel') {
      return type.includes('gas') || type.includes('fuel') || name.includes('fuel') || name.includes('petrol');
    }
    if (filter === 'Stay') {
      return type.includes('hotel') || type.includes('lodging') || type.includes('resort') || name.includes('hotel') || name.includes('resort');
    }
    if (filter === 'Things to do') {
      return (
        type.includes('point_of_interest') ||
        type.includes('tourist_attraction') ||
        type.includes('park') ||
        type.includes('natural_feature') ||
        !type.includes('restaurant')
      );
    }
    return true;
  });

  // Get image category background
  const getCategoryImage = (type?: string | null) => {
    const t = (type || '').toLowerCase();
    if (t.includes('restaurant') || t.includes('food') || t.includes('cafe')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300';
    }
    if (t.includes('hotel') || t.includes('lodging') || t.includes('resort')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=300';
    }
    if (t.includes('gas') || t.includes('fuel')) {
      return 'https://images.unsplash.com/photo-1527018607912-0bb4c90ef4fa?auto=format&fit=crop&q=80&w=300';
    }
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300';
  };

  return (
    <div className="flex flex-col min-h-screen bg-lifeos-bg pb-12">
      {/* Category Filters */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-4 py-3 flex space-x-2 overflow-x-auto no-scrollbar border-b border-gray-100 shadow-soft-sm">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
              filter === c
                ? 'bg-lifeos-navy text-white border-lifeos-navy shadow-soft-sm'
                : 'bg-white text-lifeos-navy border-gray-200 hover:bg-gray-50'
            )}
          >
            {c} {c === 'Saved' && bookmarkedIds.length > 0 ? `(${bookmarkedIds.length})` : ''}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <PlacesListSkeleton />
        ) : error ? (
          <ErrorState
            error={error}
            fallbackMessage="Places couldn't be loaded right now."
            onRetry={() => refetch()}
          />
        ) : filteredPlaces.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={filter === 'Saved' ? 'No Saved Places' : 'No Places Found'}
            description={
              filter === 'Saved'
                ? 'Bookmark locations to keep them pinned here for quick reference during your trip.'
                : `No places matching "${filter}" were found for this plan.`
            }
            actionLabel={filter !== 'All' ? 'View All Places' : undefined}
            onAction={filter !== 'All' ? () => setFilter('All') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPlaces.map((place) => {
              const isBookmarked = bookmarkedIds.includes(place.id);
              const imageSrc = getCategoryImage(place.primary_type);

              return (
                <div
                  key={place.id}
                  onClick={() => navigate(`/plans/${plan.id}/journey`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/plans/${plan.id}/journey`);
                  }}
                  className="bg-white rounded-2xl p-4 shadow-soft-sm border border-gray-100 flex flex-col sm:flex-row gap-3.5 hover:border-blue-200 hover:shadow-soft transition cursor-pointer select-none active:scale-[0.99]"
                >
                  <div className="w-full sm:w-28 h-36 sm:h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                    <img
                      src={imageSrc}
                      alt={place.name || 'Verified place'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium capitalize">
                      {place.primary_type || 'Place'}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lifeos-navy text-sm leading-tight line-clamp-1">
                          {place.name}
                        </h3>
                        <button
                          onClick={(e) => toggleBookmark(place, e)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors ml-2 shrink-0 active:scale-90',
                            isBookmarked
                              ? 'text-lifeos-blue bg-blue-50'
                              : 'text-gray-400 hover:text-lifeos-blue hover:bg-gray-50'
                          )}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark place'}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark place'}
                        >
                          <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
                        </button>
                      </div>

                      {place.rating && (
                        <div className="flex items-center space-x-1 mt-0.5 text-xs">
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span className="font-bold text-lifeos-navy">{place.rating}</span>
                          <span className="text-[11px] text-lifeos-muted font-normal">Rating</span>
                        </div>
                      )}

                      {place.formatted_address && (
                        <p className="text-xs text-lifeos-muted mt-1.5 flex items-start space-x-1.5 line-clamp-2">
                          <MapPin size={13} className="shrink-0 mt-0.5 text-gray-400" />
                          <span className="leading-relaxed">{place.formatted_address}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-lifeos-muted">
                        {place.phone && (
                          <a
                            href={`tel:${place.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center space-x-1 text-lifeos-blue hover:underline text-xs"
                          >
                            <Phone size={11} />
                            <span>Call</span>
                          </a>
                        )}
                        {place.website_uri && (
                          <a
                            href={place.website_uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center space-x-1 text-lifeos-blue hover:underline text-xs"
                          >
                            <ExternalLink size={11} />
                            <span>Website</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center text-lifeos-blue font-semibold text-xs space-x-1">
                        <Navigation size={12} />
                        <span>Map</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
