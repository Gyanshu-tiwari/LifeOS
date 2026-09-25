import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Goal,
  Task,
  AgentInfo,
  DocumentItem,
  GoalPlan,
  ActionItem,
  NotificationItem,
  UserProfile,
} from '../types';
import { ConnectionStatus } from '../types/api';
import {
  initialGoals,
  initialTasks,
  initialDocuments,
  mockGoalPlan,
  aiAgentsList,
  initialActions,
  initialNotifications,
  mockUser,
} from '../data/mockData';
import { goalService } from '../api/services/goalService';
import { taskService } from '../api/services/taskService';
import { documentService } from '../api/services/documentService';
import { planService } from '../api/services/planService';
import { actionService } from '../api/services/actionService';
import { notificationService } from '../api/services/notificationService';
import { agentService } from '../api/services/agentService';
import { agentWebSocket } from '../services/websocket';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface LifeOSContextType {
  user: UserProfile;
  goals: Goal[];
  activeGoal: Goal;
  tasks: Task[];
  documents: DocumentItem[];
  plan: GoalPlan;
  agents: AgentInfo[];
  actions: ActionItem[];
  notifications: NotificationItem[];
  connectionStatus: ConnectionStatus;
  toast: ToastMessage | null;
  showToast: (msg: string, type?: ToastType) => void;
  setActiveGoalId: (goalId: string) => void;
  addGoal: (goal: Partial<Goal>) => Promise<string>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'isCompleted'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  uploadDocument: (doc: { title: string; category: string; fileName: string; requiredFor: string; file?: File }) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  approvePlan: (planId: string) => Promise<void>;
  rejectPlan: (planId: string, feedback?: string) => Promise<void>;
  modifyPlan: (planId: string, updates: Partial<GoalPlan>) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  recentAgentActivity: string[];
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(mockUser);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [activeGoalId, setActiveGoalIdState] = useState<string>(initialGoals[0].id);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [plan, setPlan] = useState<GoalPlan>(mockGoalPlan);
  const [agents, setAgents] = useState<AgentInfo[]>(aiAgentsList);
  const [actions, setActions] = useState<ActionItem[]>(initialActions);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [recentAgentActivity, setRecentAgentActivity] = useState<string[]>([
    'Research Agent: Audited PG options in Indira Nagar & Gomti Nagar',
    'Maps Agent: Verified 25 min Red Line Metro commute to Campus',
    'Verification Agent: Confirmed 100% budget math compliance (₹13.8k ≤ ₹15k)',
  ]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Connect WebSocket on mount
  useEffect(() => {
    agentWebSocket.connect();
    const unsubStatus = agentWebSocket.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubEvents = agentWebSocket.onEvent((event) => {
      if (event.payload.actionDescription) {
        setRecentAgentActivity((prev) => [
          event.payload.actionDescription!,
          ...prev.slice(0, 5),
        ]);
        showToast(event.payload.actionDescription, 'info');
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, []);

  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0];

  const setActiveGoalId = (goalId: string) => {
    setActiveGoalIdState(goalId);
    const target = goals.find((g) => g.id === goalId);
    if (target) {
      showToast(`Switched active goal context to: "${target.title}"`, 'info');
    }
  };

  const addGoal = async (newGoalData: Partial<Goal>): Promise<string> => {
    try {
      const created = await goalService.createGoal({
        title: newGoalData.title || 'Untitled Goal',
        description: newGoalData.description || '',
        location: newGoalData.location || 'Lucknow, UP',
        deadline: newGoalData.deadline || 'Dec 2026',
        category: newGoalData.category || 'Personal',
        constraints: newGoalData.constraints || {
          budget: 'Flexible',
          vehicle: 'None',
          maxCommute: '30 mins',
          location: newGoalData.location || 'Lucknow, UP',
        },
      });

      setGoals((prev) => [created, ...prev]);
      setActiveGoalIdState(created.id);
      showToast(`New goal created: "${created.title}". Orchestrator analyzing...`, 'success');
      return created.id;
    } catch (err: any) {
      showToast(err.message || 'Failed to create goal', 'error');
      throw err;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const updated = await goalService.updateGoal(id, updates);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      showToast('Goal details updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update goal', 'error');
    }
  };

  const toggleTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const nextState = !target.isCompleted;

    try {
      const updated = await taskService.toggleTask(taskId, nextState);
      setTasks((prev) => {
        const list = prev.map((t) => (t.id === taskId ? updated : t));
        const goalTasks = list.filter((t) => t.goalId === activeGoalId);
        const completedCount = goalTasks.filter((t) => t.isCompleted).length;
        setGoals((prevGoals) =>
          prevGoals.map((g) =>
            g.id === activeGoalId
              ? { ...g, completedTasks: completedCount, totalTasks: Math.max(goalTasks.length, 1) }
              : g
          )
        );
        return list;
      });
      showToast(`Task ${nextState ? 'completed' : 'reopened'}: "${target.title}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle task', 'error');
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    try {
      const created = await taskService.createTask({
        ...taskData,
        goalId: taskData.goalId || activeGoalId,
        priority: taskData.priority || 'medium',
      });
      setTasks((prev) => [created, ...prev]);
      setGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === activeGoalId ? { ...g, totalTasks: g.totalTasks + 1 } : g
        )
      );
      showToast(`Added new task: "${created.title}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add task', 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === activeGoalId ? { ...g, totalTasks: Math.max(g.totalTasks - 1, 1) } : g
        )
      );
      showToast('Task removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const uploadDocument = async (doc: {
    title: string;
    category: string;
    fileName: string;
    requiredFor: string;
    file?: File;
  }) => {
    try {
      const created = await documentService.uploadDocument({
        ...doc,
        goalId: activeGoalId,
      });
      setDocuments((prev) => [created, ...prev]);
      showToast(`Document uploaded: "${doc.title}". Document Agent verified authenticity.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document', 'error');
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      await documentService.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showToast('Document removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const approvePlan = async (planId: string) => {
    try {
      const updated = await planService.submitDecision({
        planId,
        decision: 'approve',
      });
      setPlan(updated);
      showToast('Plan approved! Action Agent ready to execute next steps.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve plan', 'error');
    }
  };

  const rejectPlan = async (planId: string, feedback?: string) => {
    try {
      const updated = await planService.submitDecision({
        planId,
        decision: 'reject',
        feedback,
      });
      setPlan(updated);
      showToast('Plan rejected. Planning Agent re-evaluating.', 'warning');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject plan', 'error');
    }
  };

  const modifyPlan = async (planId: string, updates: Partial<GoalPlan>) => {
    try {
      const updated = await planService.submitDecision({
        planId,
        decision: 'modify',
        modifications: updates,
      });
      setPlan(updated);
      showToast('Plan constraints modified. Re-verifying with Verification Agent.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to modify plan', 'error');
    }
  };

  const approveAction = async (actionId: string) => {
    try {
      const updated = await actionService.executeDecision({
        actionId,
        decision: 'approve',
      });
      setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
      showToast('Action executed by Action Agent with verified credentials.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to execute action', 'error');
    }
  };

  const rejectAction = async (actionId: string) => {
    try {
      const updated = await actionService.executeDecision({
        actionId,
        decision: 'reject',
      });
      setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
      showToast('Action cancelled.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject action', 'error');
    }
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark notification read', err);
    }
  };

  const refreshAgents = async () => {
    try {
      const fleet = await agentService.getAgents();
      setAgents(fleet);
      showToast('Agent fleet status synchronized', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to refresh agents', 'error');
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        user,
        goals,
        activeGoal,
        tasks,
        documents,
        plan,
        agents,
        actions,
        notifications,
        connectionStatus,
        toast,
        showToast,
        setActiveGoalId,
        addGoal,
        updateGoal,
        toggleTask,
        addTask,
        deleteTask,
        uploadDocument,
        deleteDocument,
        approvePlan,
        rejectPlan,
        modifyPlan,
        approveAction,
        rejectAction,
        markNotificationRead,
        refreshAgents,
        recentAgentActivity,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
};
