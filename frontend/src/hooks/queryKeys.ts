export const queryKeys = {
  activities: {
    all: ['activities'] as const,
    list: (params?: { limit?: number; offset?: number; status?: string }) =>
      ['activities', 'list', params] as const,
    detail: (id: string) => ['activities', id] as const,
    plans: (id: string) => ['activities', id, 'plans'] as const,
    runs: (id: string) => ['activities', id, 'runs'] as const,
    run: (activityId: string, runId: string) =>
      ['activities', activityId, 'runs', runId] as const,
  },
  plans: {
    all: ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
    sections: (id: string) => ['plans', id, 'sections'] as const,
    tasks: (id: string) => ['plans', id, 'tasks'] as const,
    progress: (id: string) => ['plans', id, 'progress'] as const,
    nextAction: (id: string) => ['plans', id, 'next-action'] as const,
    places: (id: string) => ['plans', id, 'places'] as const,
    route: (id: string) => ['plans', id, 'route'] as const,
    packing: (id: string) => ['plans', id, 'packing'] as const,
    itinerary: (id: string) => ['plans', id, 'itinerary'] as const,
  },
  tasks: {
    detail: (id: string) => ['tasks', id] as const,
  },
};
