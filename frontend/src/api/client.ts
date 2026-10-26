import axios, { AxiosError } from 'axios';

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';

export interface ApiErrorDetail {
  error: string;
  code?: string;
  request_id?: string;
  detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

import { authService } from '../auth/auth.service';

// Attach fresh Firebase ID token on every outgoing request
apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import { normalizeError } from '../lib/errors';

// Response interceptor with structured error translation
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorDetail>) => {
    const normalized = normalizeError(error);

    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        authService.logout().catch(() => {});
      }
      return Promise.reject(
        new ApiError(normalized.message, status, data?.code, data?.request_id)
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError(normalized.message, 408));
    }

    return Promise.reject(new ApiError(normalized.message, 0));
  }
);
