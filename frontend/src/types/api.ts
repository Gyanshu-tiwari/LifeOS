import {
  Goal,
  Task,
  DocumentItem,
  GoalPlan,
  AgentInfo,
  ActionItem,
  NotificationItem,
  AgentType,
} from './index';

export type ApiMode = 'mock' | 'real';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, any>;
}

// Request payloads
export interface CreateGoalRequest {
  title: string;
  description: string;
  category?: string;
  location: string;
  deadline: string;
  constraints: {
    budget: string;
    vehicle: string;
    maxCommute: string;
    location: string;
  };
}

export interface CreateTaskRequest {
  goalId?: string;
  title: string;
  description: string;
  dueDate: string;
  dueLabel: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  relatedAgent?: AgentType;
}

export interface UploadDocumentRequest {
  goalId: string;
  title: string;
  category: string;
  fileName: string;
  requiredFor: string;
  file?: File;
}

export interface PlanDecisionRequest {
  planId: string;
  decision: 'approve' | 'modify' | 'reject';
  feedback?: string;
  modifications?: Partial<GoalPlan>;
}

export interface ActionDecisionRequest {
  actionId: string;
  decision: 'approve' | 'reject';
  authorizationSignature?: string;
}

// WebSocket Event Types
export type AgentEventType =
  | 'agent:started'
  | 'agent:progress'
  | 'agent:completed'
  | 'agent:failed'
  | 'research:result'
  | 'maps:commute_verified'
  | 'verification:audit_complete'
  | 'plan:generated'
  | 'action:requested'
  | 'action:executed';

export interface AgentWebSocketEvent {
  type: AgentEventType;
  agentId: string;
  agentType: AgentType;
  goalId: string;
  timestamp: string;
  payload: {
    actionDescription?: string;
    progressPercentage?: number;
    resultSummary?: string;
    evidenceNotes?: string[];
    [key: string]: any;
  };
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
