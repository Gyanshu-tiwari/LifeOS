export type ActivityStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type PlanStatus = 'GENERATING' | 'READY' | 'FAILED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type PlanRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'SUPERSEDED';

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  raw_intent: string;
  activity_type: string;
  status: ActivityStatus;
  start_at?: string | null;
  end_at?: string | null;
  origin_text?: string | null;
  destination_text?: string | null;
  travel_mode?: string | null;
  constraints_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityListResponse {
  items: Activity[];
  total: number;
  limit: number;
  offset: number;
}

// Backend PlanResponse does NOT embed sections — they must be fetched separately
export interface Plan {
  id: string;
  activity_id: string;
  title: string;
  status: PlanStatus;
  version: number;
  created_from_run_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanSection {
  id: string;
  plan_id: string;
  title: string;
  description?: string | null;
  section_type: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  plan_section_id: string;
  parent_task_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_at?: string | null;
  estimated_minutes?: number | null;
  source?: string | null;
  metadata_json?: Record<string, any> | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithSubtasks extends Task {
  subtasks: TaskWithSubtasks[];
}

export interface Place {
  id: string;
  provider: string;
  provider_place_id: string;
  name?: string | null;
  formatted_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  primary_type?: string | null;
  types_json?: string[] | null;
  rating?: number | null;
  website_uri?: string | null;
  phone?: string | null;
}

export interface PlanRun {
  id: string;
  activity_id: string;
  plan_id?: string | null;
  status: PlanRunStatus;
  started_at?: string | null;
  finished_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  model?: string | null;
}

// Backend RouteResponse shape
export interface Route {
  id: string;
  plan_id: string;
  origin_text?: string | null;
  destination_text?: string | null;
  travel_mode?: string | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  polyline?: string | null;
  provider?: string | null;
}

export interface RouteStop {
  id: string;
  route_id: string;
  place_id?: string | null;
  place?: Place | null;
  label: string;
  order_index: number;
  detour_minutes?: number | null;
  reason?: string | null;
}

export interface PackingItem {
  id: string;
  plan_id: string;
  item: string;
  category?: string | null;
  priority: 'ESSENTIAL' | 'RECOMMENDED' | 'OPTIONAL';
  quantity?: number | null;
  reason?: string | null;
  checked_at?: string | null;  // null = unpacked; set = packed
  created_at: string;
}

export interface ItineraryItem {
  id: string;
  plan_id: string;
  place_id?: string | null;
  task_id?: string | null;
  title: string;
  description?: string | null;
  order_index: number;
  status: string;
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Backend NextActionResponse shape
export interface NextActionResponse {
  plan_id: string;
  task: Task | null;
  message: string;
}

// Backend PlanProgressResponse shape
export interface PlanProgressResponse {
  plan_id: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  completion_percent: number;
}

// Plan section with tasks (client-side assembled)
export interface PlanSectionWithTasks extends PlanSection {
  tasks: Task[];
}

// Plan with sections (client-side assembled)
export interface PlanWithSections extends Plan {
  sections: PlanSectionWithTasks[];
}

export type NotificationType =
  | 'PLAN_READY'
  | 'PLAN_FAILED'
  | 'TASK_REMINDER'
  | 'TASK_COMPLETED'
  | 'ROUTE_UPDATED'
  | 'ITINERARY_UPDATED'
  | 'ACTIVITY_CREATED'
  | 'SYSTEM'
  | 'IMPORTANT_UPDATE';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  read_at: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unread_count: number;
  total: number;
}

