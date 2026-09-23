import axios from 'axios';

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
};

const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

const apiBaseUrl = (import.meta.env.VITE_LOAD_BALANCER_API ?? '').trim();

export const api = createApiInstance(apiBaseUrl);

export const getApiErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      const payload = data as ApiErrorPayload;
      
      // Intentar obtener el mensaje de várias propiedades
      let message = payload.message ?? payload.error;
      
      // Si no hay mensaje directo, revisar si está en un objeto detail
      if (!message && payload.detail && typeof payload.detail === 'object') {
        const detailObj = payload.detail as Record<string, unknown>;
        message = detailObj.message ?? detailObj.error;
      }

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};


