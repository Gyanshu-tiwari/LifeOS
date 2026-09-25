import { AgentWebSocketEvent, ConnectionStatus } from '../types/api';

type EventListener = (event: AgentWebSocketEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

class AgentWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners: Set<EventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimer: number | null = null;
  private mockIntervalTimer: number | null = null;
  private autoReconnect: boolean = true;

  constructor() {
    this.url =
      (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/ws/agents';
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public connect(token?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const mode = (import.meta as any).env?.VITE_API_MODE || 'mock';

    // In mock mode, simulate live agent websocket events gracefully
    if (mode === 'mock') {
      this.setStatus('connecting');
      setTimeout(() => {
        this.setStatus('connected');
        this.startMockSimulation();
      }, 500);
      return;
    }

    try {
      this.setStatus('connecting');
      const wsUrl = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: AgentWebSocketEvent = JSON.parse(event.data);
          this.emit(parsed);
        } catch (e) {
          console.error('[WebSocket] Failed to parse agent event', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect(token);
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };
    } catch (e) {
      this.setStatus('error');
      this.scheduleReconnect(token);
    }
  }

  private scheduleReconnect(token?: string) {
    if (!this.autoReconnect || this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(token);
    }, 4000);
  }

  public disconnect() {
    this.autoReconnect = false;
    if (this.mockIntervalTimer) {
      clearInterval(this.mockIntervalTimer);
      this.mockIntervalTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public emit(event: AgentWebSocketEvent) {
    this.eventListeners.forEach((fn) => fn(event));
  }

  // Simulated live event dispatcher for development
  private startMockSimulation() {
    if (this.mockIntervalTimer) return;

    const mockEvents: Partial<AgentWebSocketEvent>[] = [
      {
        type: 'research:result',
        agentType: 'research',
        payload: {
          actionDescription: 'Research Agent indexed new student housing review for Indira Nagar',
        },
      },
      {
        type: 'maps:commute_verified',
        agentType: 'maps',
        payload: {
          actionDescription: 'Maps Agent re-verified Metro Red Line schedule (peak frequency: 5m)',
        },
      },
      {
        type: 'verification:audit_complete',
        agentType: 'verification',
        payload: {
          actionDescription: 'Verification Agent confirmed 100% mathematical constraint compliance',
        },
      },
    ];

    let idx = 0;
    this.mockIntervalTimer = window.setInterval(() => {
      const template = mockEvents[idx % mockEvents.length];
      this.emit({
        type: template.type as any,
        agentId: `agent-${template.agentType}`,
        agentType: template.agentType as any,
        goalId: 'goal-lucknow-college',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        payload: template.payload || {},
      });
      idx++;
    }, 18000); // Pulse every 18 seconds in background
  }
}

export const agentWebSocket = new AgentWebSocketService();
