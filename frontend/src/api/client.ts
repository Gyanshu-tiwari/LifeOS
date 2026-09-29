import { ApiResponse, ApiError, ApiMode } from '../types/api';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

const API_MODE: ApiMode =
  ((import.meta as any).env?.VITE_API_MODE as ApiMode) || 'mock';

export class ApiClient {
  private baseUrl: string;
  private mode: ApiMode;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, mode: ApiMode = API_MODE) {
    this.baseUrl = baseUrl;
    this.mode = mode;
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  // Simulated latency for testing mock loading states
  public async simulateDelay(ms: number = 250): Promise<void> {
    if (this.mode === 'mock') {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (this.mode === 'mock') {
      throw new Error(
        `Direct request called on mock mode. Service should supply mock data fallback.`
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: errorData.message || `Request failed with status ${response.status}`,
          statusCode: response.status,
          code: errorData.code,
          details: errorData.details,
        };
        throw apiError;
      }

      const json = await response.json();
      return {
        data: json.data !== undefined ? json.data : json,
        success: true,
        message: json.message,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err.statusCode) throw err;
      const networkError: ApiError = {
        message: err.message || 'Network error: Unable to reach LIFEOS backend services',
        statusCode: 0,
        code: 'NETWORK_ERROR',
      };
      throw networkError;
    }
  }

  public get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
