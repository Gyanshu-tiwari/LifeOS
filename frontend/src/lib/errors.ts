/**
 * LIFEOS Centralized Error Normalization System
 *
 * Translates low-level network, HTTP, and internal errors into clean,
 * actionable, user-friendly messages without exposing stack traces,
 * API keys, or raw system payloads.
 */

export interface NormalizedError {
  title: string;
  message: string;
  statusCode?: number;
  isRetryable: boolean;
}

export function normalizeError(
  error: unknown,
  context?: 'auth' | 'plan' | 'tasks' | 'places' | 'route' | 'packing' | 'itinerary' | 'general'
): NormalizedError {
  // If already normalized or string
  if (typeof error === 'string') {
    return cleanMessage(error, context);
  }

  const err = error as any;
  const status = err?.status || err?.response?.status || err?.statusCode;
  const rawMsg = err?.message || err?.error || err?.detail;

  // 1. Network / Connection errors
  if (
    err?.code === 'ECONNABORTED' ||
    rawMsg?.includes?.('timeout') ||
    rawMsg?.includes?.('timed out') ||
    status === 408
  ) {
    return {
      title: 'Request Timed Out',
      message: 'This operation is taking longer than expected. Please check your connection and try again.',
      statusCode: 408,
      isRetryable: true,
    };
  }

  if (
    err?.code === 'ERR_NETWORK' ||
    status === 0 ||
    rawMsg?.includes?.('Network Error') ||
    rawMsg?.includes?.('Failed to fetch') ||
    rawMsg?.includes?.('Unable to connect')
  ) {
    return {
      title: 'Connection Issue',
      message: 'Unable to connect to LIFEOS servers. Please verify your internet connection.',
      statusCode: 0,
      isRetryable: true,
    };
  }

  // 2. Authentication & Authorization errors
  if (status === 401 || rawMsg?.includes?.('auth') || rawMsg?.includes?.('token')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired or authentication failed. Please sign in again.',
      statusCode: 401,
      isRetryable: false,
    };
  }

  if (status === 403) {
    return {
      title: 'Access Restricted',
      message: 'You do not have permission to view or modify this resource.',
      statusCode: 403,
      isRetryable: false,
    };
  }

  // 3. Not Found errors
  if (status === 404) {
    const noun = context === 'plan' ? 'plan' : context === 'places' ? 'place' : 'requested item';
    return {
      title: 'Item Not Found',
      message: `We couldn't find the ${noun} you were looking for. It may have been removed.`,
      statusCode: 404,
      isRetryable: false,
    };
  }

  // 4. Rate Limiting / 429
  if (status === 429) {
    return {
      title: 'Rate Limit Reached',
      message: 'Too many requests were sent in a short time. Please wait a moment before trying again.',
      statusCode: 429,
      isRetryable: true,
    };
  }

  // 5. Validation errors (422)
  if (status === 422) {
    let detailText = 'Please review your input and try again.';
    if (Array.isArray(err?.response?.data?.detail)) {
      const msgs = err.response.data.detail.map((d: any) => d.msg).filter(Boolean);
      if (msgs.length > 0) {
        detailText = msgs.join(', ');
      }
    } else if (typeof rawMsg === 'string' && !rawMsg.includes('{') && !rawMsg.includes('Traceback')) {
      detailText = rawMsg;
    }

    return {
      title: 'Invalid Input',
      message: detailText,
      statusCode: 422,
      isRetryable: false,
    };
  }

  // 6. Server errors (500, 502, 503)
  if (status && status >= 500) {
    if (context === 'plan') {
      return {
        title: 'Plan Generation Delayed',
        message: 'The AI planning service is currently processing high demand. Please try generating again.',
        statusCode: status,
        isRetryable: true,
      };
    }
    return {
      title: 'Service Temporarily Unavailable',
      message: 'Something went wrong on our server. Our team has been notified. Please try again.',
      statusCode: status,
      isRetryable: true,
    };
  }

  // 7. Context-specific fallback
  return cleanMessage(rawMsg || 'An unexpected error occurred.', context);
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage?: string
): { userMessage: string; title: string; statusCode?: number; isRetryable: boolean } {
  const norm = normalizeError(error);
  return {
    title: norm.title,
    userMessage:
      fallbackMessage && (norm.title === 'Notice' || norm.title === 'Application Error')
        ? fallbackMessage
        : norm.message,
    statusCode: norm.statusCode,
    isRetryable: norm.isRetryable,
  };
}

function cleanMessage(raw: string, context?: string): NormalizedError {
  // Never expose code traces, SQL, or internal stack details
  if (
    raw.includes('Traceback') ||
    raw.includes('Exception') ||
    raw.includes('SQL') ||
    raw.includes('SELECT') ||
    raw.includes('UndefinedColumn') ||
    raw.includes('Internal Server Error') ||
    raw.length > 300
  ) {
    return {
      title: 'Application Error',
      message: 'A technical error occurred. Please try again shortly.',
      isRetryable: true,
    };
  }

  if (context === 'places') {
    return {
      title: 'Places Unavailable',
      message: 'Places could not be loaded right now. Please try refreshing.',
      isRetryable: true,
    };
  }

  if (context === 'route') {
    return {
      title: 'Route Calculation Issue',
      message: 'Could not compute the journey route right now. Please try again.',
      isRetryable: true,
    };
  }

  if (context === 'tasks') {
    return {
      title: 'Task Update Failed',
      message: 'Could not update your task. Please check your connection and retry.',
      isRetryable: true,
    };
  }

  return {
    title: 'Notice',
    message: raw.replace(/^Error:\s*/i, '').trim(),
    isRetryable: true,
  };
}
