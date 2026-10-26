import { apiClient } from './client';
import { Activity, ActivityListResponse, Plan, PlanRun } from '../types';

export interface CreateActivityPayload {
  title: string;
  raw_intent: string;
  activity_type: string;
  origin_text?: string;
  destination_text?: string;
  travel_mode?: string;
  start_at?: string;
  end_at?: string;
  constraints_json?: Record<string, any>;
}

export const activitiesApi = {
  async getActivities(params?: { limit?: number; offset?: number; status?: string }): Promise<ActivityListResponse> {
    const response = await apiClient.get<ActivityListResponse>('/activities', {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        status: params?.status,
      },
    });
    return response.data;
  },

  async getActivity(id: string): Promise<Activity> {
    const response = await apiClient.get<Activity>(`/activities/${id}`);
    return response.data;
  },

  async createActivity(payload: CreateActivityPayload): Promise<Activity> {
    const response = await apiClient.post<Activity>('/activities', payload);
    return response.data;
  },

  async updateActivity(id: string, payload: Partial<CreateActivityPayload>): Promise<Activity> {
    const response = await apiClient.patch<Activity>(`/activities/${id}`, payload);
    return response.data;
  },

  async generatePlan(activityId: string, idempotencyKey?: string): Promise<PlanRun> {
    const body = idempotencyKey ? { idempotency_key: idempotencyKey } : undefined;
    const response = await apiClient.post<PlanRun>(
      `/activities/${activityId}/plan-runs`,
      body
    );
    return response.data;
  },

  async getPlanRunStatus(activityId: string, runId: string): Promise<PlanRun> {
    const response = await apiClient.get<PlanRun>(
      `/activities/${activityId}/plan-runs/${runId}`
    );
    return response.data;
  },

  async getPlanRuns(activityId: string): Promise<PlanRun[]> {
    const response = await apiClient.get<{ items: PlanRun[]; total: number }>(
      `/activities/${activityId}/plan-runs`
    );
    return response.data.items;
  },

  async getActivityPlans(activityId: string): Promise<Plan[]> {
    const response = await apiClient.get<Plan[]>(`/activities/${activityId}/plans`);
    return response.data;
  },
};
