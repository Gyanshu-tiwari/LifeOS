export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  goalId?: string;
  title: string;
  description: string;
  dueDate: string;
  dueLabel: 'Today' | 'Tomorrow' | string;
  isCompleted: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  relatedAgent?: AgentType;
}

export type AgentType =
  | 'orchestrator'
  | 'research'
  | 'maps'
  | 'documents'
  | 'planning'
  | 'verification'
  | 'action';

export interface AgentInfo {
  id: string;
  type: AgentType;
  name: string;
  shortName: string;
  role: string;
  description: string;
  status: 'active' | 'idle' | 'working' | 'waiting_approval';
  currentAction?: string;
  lastExecution?: string;
  result?: string;
  badge?: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  };
}

export interface GoalConstraints {
  budget: string;
  vehicle: string;
  maxCommute: string;
  location: string;
}

export interface DocumentItem {
  id: string;
  goalId: string;
  title: string;
  category: string;
  status: 'verified' | 'missing' | 'reviewing';
  requiredFor: string;
  fileName?: string;
  uploadedAt?: string;
  fileSize?: string;
}

export interface PlanStep {
  id: string;
  phase: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  estimatedCost?: string;
  duration?: string;
  dependencies?: string[];
  assignedAgent: AgentType;
}

export interface GoalPlan {
  id: string;
  goalId: string;
  status: 'pending_review' | 'approved' | 'modified' | 'rejected';
  generatedAt: string;
  summary: string;
  tradeOffs: string[];
  evidenceNotes: string[];
  steps: PlanStep[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'In Progress' | 'Planned' | 'Completed';
  location: string;
  deadline: string;
  completedTasks: number;
  totalTasks: number;
  constraints: GoalConstraints;
  imageUrl?: string;
  category: string;
  activeAgents: AgentType[];
  nextAction?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  agent: AgentType;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  consequence: string;
  evidence: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'agent' | 'deadline' | 'task' | 'verification';
  read: boolean;
  agent?: AgentType;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  notificationCount: number;
  preferences: {
    aiModel: string;
    autonomousLevel: 'always_ask' | 'safe_only' | 'high_trust';
    darkMode: boolean;
  };
}
