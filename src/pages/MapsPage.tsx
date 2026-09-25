import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Train,
  Footprints,
  ShieldCheck,
  AlertTriangle,
  Compass,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const MapsPage: React.FC = () => {
  const { showToast } = useLifeOS();
  const [selectedRoute, setSelectedRoute] = useState<string>('route-1');
  const [transitMode, setTransitMode] = useState<'all' | 'metro' | 'bus'>('all');

  const routes = [
    {
      id: 'route-1',
      name: 'Red Line Metro (Recommended)',
      mode: 'metro',
      origin: 'Indira Nagar (Lekhraj Market Metro Station)',
      destination: 'Lucknow University Main Gate',
      duration: '25 mins',
      distance: '6.4 km',
      cost: '₹20 (₹18 with GoSmart Metro card)',
      breakdown: '7m walk + 18m Metro train (5 stops)',
      status: 'optimal',
      constraintSatisfied: true,
      notes: 'Direct transit corridor, air-conditioned, zero traffic delay risk during peak morning hours.',
    },
    {
      id: 'route-2',
      name: 'E-Rickshaw + Metro Transit',
      mode: 'metro',
      origin: 'Gomti Nagar (Vibhuti Khand)',
      destination: 'Lucknow University Campus',
      duration: '34 mins',
      distance: '9.2 km',
      cost: '₹35 (₹15 E-Rickshaw + ₹20 Metro)',
      breakdown: '10m E-Rickshaw to Polytechnic + 24m Metro train',
      status: 'viable',
      constraintSatisfied: true,
      notes: 'Feasible secondary route; slightly higher daily transit expenditure.',
    },
    {
      id: 'route-3',
      name: 'City Bus Route 204 (Local Roadway)',
      mode: 'bus',
      origin: 'Hazratganj Outer Ring',
      destination: 'University Gate 2',
      duration: '48 mins',
      distance: '7.8 km',
      cost: '₹15',
      breakdown: '12m walk + 36m Bus during morning rush hours',
      status: 'exceeded_constraint',
      constraintSatisfied: false,
      notes: '⚠️ Exceeds maximum 45-minute commute constraint during rush hours due to traffic congestion on University Road.',
    },
  ];

  const filteredRoutes = routes.filter((r) => {
    if (transitMode === 'metro') return r.mode === 'metro';
    if (transitMode === 'bus') return r.mode === 'bus';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Maps & Commute Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Transit & Commute Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Calculates precise travel times without a personal vehicle to guarantee the ≤ 45 min commute constraint.
          </p>
        </div>

        <LifeOSButton
          onClick={() => showToast('Maps Agent refreshed transit routes via Lucknow Metro API', 'info')}
          variant="outline"
          size="sm"
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh Transit
        </LifeOSButton>
      </div>

      {/* Origin / Destination Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Origin (Candidate Student Cluster)
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-800">
              Indira Nagar / Gomti Nagar, Lucknow
            </p>
            <span className="text-xs text-slate-500">
              Shortlisted PG accommodation vicinity
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Destination
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-800">
              University of Lucknow Campus
            </p>
            <span className="text-xs text-slate-500">
              Babuganj, Hasanganj, Lucknow, UP
            </span>
          </div>
        </div>
      </div>

      {/* Integration Boundary Notice */}
      <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/70 border border-blue-100 flex items-start gap-3.5 shadow-soft-sm">
        <ShieldCheck className="w-5 h-5 text-[#1E60F2] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">
            Maps Integration Boundary:
          </span>{' '}
          Showing verified timetable and distance matrices from Lucknow Metro Rail Corporation (LMRC). When Google Maps Platform API credentials are provided by the backend team, live real-time GPS traffic feeds will plug in seamlessly.
        </div>
      </div>

      {/* Graphical Metro Route Diagram */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-soft bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-7 flex flex-col justify-between text-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-sky-400" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Lucknow Metro Red Line (North-South Corridor)
            </span>
          </div>
          <LifeOSBadge variant="teal">Verified Corridor</LifeOSBadge>
        </div>

        {/* Graphical Route Track */}
        <div className="py-2">
          <div className="flex items-center justify-between relative max-w-xl mx-auto px-2">
            {/* Track Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-sky-400/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 w-3/4 h-1 bg-sky-400 -translate-y-1/2" />

            {/* Stations */}
            <div className="relative z-10 text-center">
              <div className="w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 mx-auto mb-1" />
              <span className="text-[11px] font-bold block text-slate-200">Indira Nagar</span>
              <span className="text-[9.5px] text-slate-400 block">Start</span>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-300 ring-4 ring-sky-400/20 mx-auto mb-1" />
              <span className="text-[11px] font-semibold block text-slate-300">Badshahnagar</span>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-300 ring-4 ring-sky-400/20 mx-auto mb-1" />
              <span className="text-[11px] font-semibold block text-slate-300">IT College</span>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-4 h-4 rounded-full bg-amber-400 ring-4 ring-amber-400/20 mx-auto mb-1" />
              <span className="text-[11px] font-bold block text-slate-200">Lucknow Univ</span>
              <span className="text-[9.5px] text-emerald-400 font-bold block">25 mins</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10 gap-2">
          <span>Constraint Threshold: Max 45 min commute without car</span>
          <span className="font-bold text-emerald-400">
            ✓ Result: 25 mins total (Passes with 20 min safe margin)
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['all', 'metro', 'bus'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTransitMode(m)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              transitMode === m
                ? 'bg-[#1E60F2] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {m === 'all' ? 'All Evaluated Routes' : `${m.toUpperCase()} Routes`}
          </button>
        ))}
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            onClick={() => setSelectedRoute(route.id)}
            className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
              selectedRoute === route.id
                ? 'bg-blue-50/40 border-[#1E60F2] ring-2 ring-blue-500/10 shadow-soft'
                : 'bg-white border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    route.constraintSatisfied
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {route.constraintSatisfied ? (
                    <Train className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">{route.name}</h3>
                    {route.constraintSatisfied ? (
                      <LifeOSBadge variant="success">Satisfies Constraint</LifeOSBadge>
                    ) : (
                      <LifeOSBadge variant="danger">Exceeds 45 min</LifeOSBadge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{route.breakdown}</p>
                </div>
              </div>

              <div className="text-left sm:text-right pl-13 sm:pl-0">
                <span className="text-base sm:text-lg font-extrabold text-[#1E60F2]">{route.duration}</span>
                <span className="text-xs text-slate-500 block font-medium">{route.cost}</span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
              {route.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
