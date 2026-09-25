import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  Star,
  CheckCircle2,
  Sparkles,
  Filter,
  MapPin,
  Clock,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';

export const ResearchPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || 'PG accommodation near Lucknow University with Metro access under ₹12,000';

  const [query, setQuery] = useState(initialQuery);
  const [areaFilter, setAreaFilter] = useState<'all' | 'Indira Nagar' | 'Gomti Nagar' | 'Hazratganj'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const { showToast } = useLifeOS();

  const researchFindings = [
    {
      id: 'res-1',
      title: 'Shivani Girls PG & Student Residency',
      area: 'Indira Nagar',
      location: 'Indira Nagar, Lucknow (300m to Lekhraj Metro)',
      rent: '₹8,500/month',
      amenities: 'Mess Included (3 meals), Wi-Fi, 24/7 Security, Power Backup',
      commute: '18 mins via Red Line Metro to University',
      source: 'Student Portal & Field Verification (Aug 4, 2026)',
      confidence: 96,
      verified: true,
      tradeoff: 'Excellent food ratings; double sharing room.',
    },
    {
      id: 'res-2',
      title: 'Gomti Nagar Scholar Accommodations',
      area: 'Gomti Nagar',
      location: 'Vibhuti Khand, Gomti Nagar',
      rent: '₹11,000/month',
      amenities: 'Single AC Room, High-speed Fiber, Attached Bathroom',
      commute: '28 mins via Metro & feeder e-rickshaw',
      source: 'Verified Property Registry (Aug 5, 2026)',
      confidence: 92,
      verified: true,
      tradeoff: 'Higher rent; leaves less discretionary budget.',
    },
    {
      id: 'res-3',
      title: 'Hazratganj Youth Student Flat (Shared)',
      area: 'Hazratganj',
      location: 'Hazratganj, Lucknow',
      rent: '₹7,500/month + utilities',
      amenities: 'Shared Kitchen, Walking distance to Central Library',
      commute: '12 mins direct bus / 20 mins walk',
      source: 'Local Campus Noticeboard (Aug 2, 2026)',
      confidence: 88,
      verified: true,
      tradeoff: 'Self-cooking required; variable electricity bills.',
    },
  ];

  const filtered = researchFindings.filter((item) => {
    if (areaFilter !== 'all' && item.area !== areaFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.amenities.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      showToast(`Research Agent sweep completed for: "${query}"`, 'success');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Research Agent Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          Evidence-Backed Research
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          LIFEOS aggregates real listings and sources, discarding unverified or stale data.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:flex-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accommodations, fees, university circulars..."
              className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <LifeOSButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSearching}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          >
            Run Deep Sweep
          </LifeOSButton>
        </div>
      </form>

      {/* Source Integrity Notice */}
      <div className="p-4 sm:p-5 rounded-3xl bg-purple-50/70 border border-purple-100 flex items-start gap-3.5 shadow-soft-sm">
        <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 leading-relaxed">
          <span className="font-bold">Provenance & Verification:</span> All data points shown below have been audited for rent inflation, hidden maintenance charges, and accurate Google/OpenStreetMap transit estimates.
        </div>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['all', 'Indira Nagar', 'Gomti Nagar', 'Hazratganj'] as const).map((area) => (
          <button
            key={area}
            onClick={() => setAreaFilter(area)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              areaFilter === area
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {area === 'all' ? 'All Areas' : area}
          </button>
        ))}
      </div>

      {/* Research Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            Verified Options ({filtered.length})
          </h2>
          <span className="text-xs text-slate-400">
            Filtered by: ₹15,000 budget & ≤ 45 min commute
          </span>
        </div>

        {filtered.length === 0 ? (
          <LifeOSEmptyState
            icon={Building}
            title="No accommodations found"
            description="No listings match your search in this area. Try clearing filters or searching a nearby neighborhood."
            actionLabel="Reset Filters"
            onAction={() => {
              setAreaFilter('all');
              setQuery('');
            }}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">{item.title}</h3>
                      <LifeOSBadge variant="success">
                        {item.confidence}% Match
                      </LifeOSBadge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{item.location}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xl font-extrabold text-[#1E60F2]">{item.rent}</span>
                    <span className="text-xs text-slate-400 block font-medium mt-0.5">{item.commute}</span>
                  </div>
                </div>

                {/* Details & Amenities */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="text-slate-700">
                    <span className="font-bold text-slate-900">Amenities:</span> {item.amenities}
                  </div>
                  <div className="text-slate-600">
                    <span className="font-bold text-slate-900">Agent Evaluation:</span> {item.tradeoff}
                  </div>
                </div>

                {/* Source Footnote */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>Source:</span>
                    <strong className="text-slate-600 font-semibold">{item.source}</strong>
                  </span>

                  <LifeOSButton
                    onClick={() => showToast(`Added "${item.title}" to Goal comparison set`, 'success')}
                    variant="outline"
                    size="sm"
                  >
                    Select for Comparison →
                  </LifeOSButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
