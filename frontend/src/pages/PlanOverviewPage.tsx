import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Map,
  ListTodo,
  MapPin,
  Package,
  Calendar as CalendarIcon,
  Navigation,
  Clock,
  Check,
} from 'lucide-react';
import { Plan, Activity } from '../types';
import { useNextAction, usePlanProgress, useRoute, usePlaces } from '../hooks';

type OutletCtx = { plan: Plan; activity?: Activity };

export default function PlanOverviewPage() {
  const { plan, activity } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();

  const { data: nextActionData } = useNextAction(plan.id);
  const { data: progress } = usePlanProgress(plan.id);
  const { data: route } = useRoute(plan.id);
  const { data: places } = usePlaces(plan.id);

  const nextAction = nextActionData?.task ?? null;

  const formatDistance = (m?: number | null) => {
    if (!m) return null;
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
  };

  const formatDuration = (s?: number | null) => {
    if (!s) return null;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      {/* Next Action */}
      {nextAction && (
        <section>
          <h2 className="text-sm font-semibold text-lifeos-navy mb-3">Next action</h2>
          <div
            onClick={() => navigate(`/plans/${plan.id}/tasks`)}
            className="bg-lifeos-card border border-lifeos-border rounded-2xl p-4 flex items-center justify-between shadow-soft-sm cursor-pointer hover:shadow-soft transition"
          >
            <div className="flex items-start space-x-3">
              <div className="bg-lifeos-lavender p-2 rounded-xl text-lifeos-lavenderText shrink-0">
                <ListTodo size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lifeos-navy leading-snug">{nextAction.title}</h3>
                {nextActionData?.message && (
                  <p className="text-xs text-lifeos-muted mt-0.5">{nextActionData.message}</p>
                )}
                <span className="inline-flex items-center space-x-1 mt-1.5 bg-lifeos-warning/10 text-lifeos-warning text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-lifeos-warning" />
                  <span>{nextAction.priority === 'HIGH' ? 'Essential' : 'Recommended'}</span>
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-lifeos-subtle shrink-0" />
          </div>
        </section>
      )}

      {/* No next action — all done */}
      {nextActionData && !nextAction && (
        <section>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
              <Check size={20} />
            </div>
            <p className="text-sm font-medium text-emerald-800">{nextActionData.message}</p>
          </div>
        </section>
      )}

      {/* Progress & Summary */}
      {progress && (
        <section>
          <h2 className="text-sm font-semibold text-lifeos-navy mb-3">Plan summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={<ListTodo size={18} />}
              title={`${progress.total_tasks} tasks`}
              subtitle={`${progress.completed_tasks} done`}
            />
            <SummaryCard
              icon={<CalendarIcon size={18} />}
              title={`${progress.completion_percent.toFixed(0)}%`}
              subtitle="Complete"
            />
            {route?.distance_meters && (
              <SummaryCard
                icon={<Navigation size={18} />}
                title={formatDistance(route.distance_meters)!}
                subtitle="Total distance"
              />
            )}
            {route?.duration_seconds && (
              <SummaryCard
                icon={<Clock size={18} />}
                title={formatDuration(route.duration_seconds)!}
                subtitle="Drive time"
              />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-lifeos-card border border-lifeos-border rounded-2xl p-4 shadow-soft-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-lifeos-navy">
                {progress.completed_tasks} / {progress.total_tasks} tasks complete
              </span>
              <span className="text-sm font-bold text-lifeos-blue">
                {progress.completion_percent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-lifeos-blue h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress.completion_percent}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Route Preview */}
      {route && (
        <section>
          <h2 className="text-sm font-semibold text-lifeos-navy mb-3">Route</h2>
          <div
            onClick={() => navigate(`/plans/${plan.id}/journey`)}
            className="bg-lifeos-card rounded-2xl p-3 border border-lifeos-border shadow-soft-sm cursor-pointer hover:shadow-soft transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="bg-lifeos-blueLight p-3 rounded-xl shrink-0">
                <Map size={20} className="text-lifeos-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-lifeos-navy truncate">
                  {route.origin_text && route.destination_text
                    ? `${route.origin_text} → ${route.destination_text}`
                    : plan.title}
                </h3>
                <p className="text-xs text-lifeos-muted mt-0.5">
                  {[formatDistance(route.distance_meters), formatDuration(route.duration_seconds)]
                    .filter(Boolean)
                    .join(' • ') || 'View full route on map'}
                </p>
              </div>
              <div className="shrink-0 text-lifeos-blue font-medium text-xs bg-lifeos-blueLight px-3 py-1.5 rounded-full">
                View map
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Places Preview */}
      {places && places.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-lifeos-navy">Verified places ({places.length})</h2>
            <button
              onClick={() => navigate(`/plans/${plan.id}/places`)}
              className="text-xs text-lifeos-blue font-medium hover:underline"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {places.slice(0, 2).map((place) => (
              <div
                key={place.id}
                onClick={() => navigate(`/plans/${plan.id}/places`)}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-soft-sm flex items-start space-x-3 cursor-pointer hover:border-blue-100 transition"
              >
                <div className="w-10 h-10 bg-blue-50 text-lifeos-blue rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-lifeos-navy truncate">{place.name}</h4>
                  <p className="text-xs text-lifeos-muted truncate mt-0.5">
                    {place.primary_type || 'Place'} {place.rating ? `• ★ ${place.rating}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{place.formatted_address}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity context */}
      {activity && (activity.origin_text || activity.destination_text) && (
        <section>
          <h2 className="text-sm font-semibold text-lifeos-navy mb-3">Trip details</h2>
          <div className="bg-lifeos-card border border-lifeos-border rounded-2xl p-4 shadow-soft-sm space-y-2">
            {activity.origin_text && (
              <div className="flex items-start space-x-3 text-sm">
                <MapPin size={16} className="text-lifeos-success mt-0.5 shrink-0" />
                <div>
                  <span className="text-lifeos-muted text-xs">From</span>
                  <p className="text-lifeos-navy font-medium">{activity.origin_text}</p>
                </div>
              </div>
            )}
            {activity.destination_text && (
              <div className="flex items-start space-x-3 text-sm">
                <MapPin size={16} className="text-lifeos-danger mt-0.5 shrink-0" />
                <div>
                  <span className="text-lifeos-muted text-xs">To</span>
                  <p className="text-lifeos-navy font-medium">{activity.destination_text}</p>
                </div>
              </div>
            )}
            {activity.travel_mode && (
              <div className="flex items-start space-x-3 text-sm">
                <Navigation size={16} className="text-lifeos-blue mt-0.5 shrink-0" />
                <div>
                  <span className="text-lifeos-muted text-xs">Mode</span>
                  <p className="text-lifeos-navy font-medium capitalize">
                    {activity.travel_mode.toLowerCase()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick links to all sections */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tasks', path: 'tasks', icon: <ListTodo size={18} /> },
          { label: 'Journey', path: 'journey', icon: <Map size={18} /> },
          { label: 'Places', path: 'places', icon: <MapPin size={18} /> },
          { label: 'Packing', path: 'packing', icon: <Package size={18} /> },
          { label: 'Itinerary', path: 'itinerary', icon: <CalendarIcon size={18} /> },
        ].map(({ label, path, icon }) => (
          <button
            key={path}
            onClick={() => navigate(`/plans/${plan.id}/${path}`)}
            className="bg-lifeos-card border border-lifeos-border rounded-2xl p-4 shadow-soft-sm hover:shadow-soft transition flex items-center space-x-3 text-left"
          >
            <div className="text-lifeos-blue shrink-0">{icon}</div>
            <span className="font-semibold text-sm text-lifeos-navy">{label}</span>
            <ChevronRight size={16} className="text-lifeos-subtle ml-auto" />
          </button>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-lifeos-card border border-lifeos-border rounded-2xl p-3 shadow-sm flex flex-col items-start space-y-2">
      <div className="text-lifeos-blue">{icon}</div>
      <div>
        <div className="font-bold text-sm text-lifeos-navy">{title}</div>
        <div className="text-xs text-lifeos-muted">{subtitle}</div>
      </div>
    </div>
  );
}
