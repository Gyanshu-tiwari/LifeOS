import { apiClient } from './client';
import {
  Plan,
  PlanSection,
  Task,
  Place,
  Route,
  PackingItem,
  ItineraryItem,
  NextActionResponse,
  PlanProgressResponse,
} from '../types';

export const plansApi = {
  // Get a single plan overview
  async getPlan(id: string): Promise<Plan> {
    const response = await apiClient.get<Plan>(`/plans/${id}`);
    return response.data;
  },

  // Get plan sections
  async getPlanSections(planId: string): Promise<PlanSection[]> {
    const response = await apiClient.get<PlanSection[]>(`/plans/${planId}/sections`);
    return response.data;
  },

  // Get plan tasks
  async getPlanTasks(planId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`/plans/${planId}/tasks`);
    return response.data;
  },

  // Progress
  async getProgress(planId: string): Promise<PlanProgressResponse> {
    const response = await apiClient.get<PlanProgressResponse>(`/plans/${planId}/progress`);
    return response.data;
  },

  // Next action — returns { plan_id, task, message }
  async getNextAction(planId: string): Promise<NextActionResponse | null> {
    try {
      const response = await apiClient.get<NextActionResponse>(`/plans/${planId}/next-action`);
      return response.data;
    } catch (e: any) {
      if (e.status === 404 || e.status === 422) return null;
      throw e;
    }
  },

  // Places
  async getPlaces(planId: string): Promise<Place[]> {
    const response = await apiClient.get<Place[]>(`/plans/${planId}/places`);
    return response.data;
  },

  // Route
  async getRoute(planId: string): Promise<Route | null> {
    try {
      const response = await apiClient.get<Route>(`/plans/${planId}/route`);
      return response.data;
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  },

  // Recalculate route
  async recalculateRoute(
    planId: string,
    payload?: { origin?: string; destination?: string; travel_mode?: string }
  ): Promise<Route | null> {
    try {
      const response = await apiClient.post<Route>(
        `/plans/${planId}/route/recalculate`,
        payload
      );
      return response.data;
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  },

  // Packing items
  async getPacking(planId: string): Promise<PackingItem[]> {
    const response = await apiClient.get<PackingItem[]>(`/plans/${planId}/packing`);
    return response.data;
  },

  // Toggle packing item
  async togglePackingItem(planId: string, itemId: string, checked: boolean): Promise<PackingItem> {
    const response = await apiClient.patch<PackingItem>(
      `/plans/${planId}/packing/${itemId}`,
      { checked }
    );
    return response.data;
  },

  // Itinerary
  async getItinerary(planId: string): Promise<ItineraryItem[]> {
    const response = await apiClient.get<ItineraryItem[]>(`/plans/${planId}/itinerary`);
    return response.data;
  },

  // Update itinerary item
  async updateItineraryItem(
    planId: string,
    itemId: string,
    payload: { status?: string; start_at?: string; end_at?: string; title?: string; description?: string }
  ): Promise<ItineraryItem> {
    const response = await apiClient.patch<ItineraryItem>(
      `/plans/${planId}/itinerary/${itemId}`,
      payload
    );
    return response.data;
  },
};
