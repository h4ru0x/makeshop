import { api } from '../api';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'OWNER' | 'CLIENT';
  phoneNumber?: string;
}

export interface ShopRegisterRequest {
  email: string;
  password?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  uid: string;
  name: string;
  email: string;
  role: string;
}

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'user';
const SHOP_AUTH_TOKEN_KEY_PREFIX = 'shop-token:';
const SHOP_AUTH_USER_KEY_PREFIX = 'shop-user:';

const getShopAuthKeys = (shopId: string) => {
  const resolvedShopId = shopId.trim();

  return {
    tokenKey: `${SHOP_AUTH_TOKEN_KEY_PREFIX}${resolvedShopId}`,
    userKey: `${SHOP_AUTH_USER_KEY_PREFIX}${resolvedShopId}`,
  };
};

const persistAuthResponse = (response: AuthResponse, scope: 'global' | 'shop', shopId?: string) => {
  if (!response.token) {
    return;
  }

  if (scope === 'shop') {
    if (!shopId) {
      return;
    }

    const { tokenKey, userKey } = getShopAuthKeys(shopId);
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(userKey, JSON.stringify(response));
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, response.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response));
};

export interface VerifyPasswordRequest {
  email: string;
  password: string;
}

export interface VerifyPasswordResponse {
  code: string;
  message: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  code: string;
}

export interface MeResponse {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  subscription?: string;
  shopId?: string;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const payload = {
    identifier: data.email,
    password: data.password || ''
  };
  const response = await api.post<AuthResponse>('/auth/login', payload);
  persistAuthResponse(response.data, 'global');
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const payload: Record<string, string> = {
    name: data.name,
    email: data.email,
    password: data.password || '',
  };
  if (data.phoneNumber) {
    payload.phoneNumber = data.phoneNumber;
  }
  const response = await api.post<AuthResponse>('/auth/register', payload);
  persistAuthResponse(response.data, 'global');
  return response.data;
};

export const loginShopUser = async (shopId: string, data: LoginRequest): Promise<AuthResponse> => {
  const resolvedShopId = shopId.trim();
  const payload = {
    identifier: data.email,
    password: data.password || '',
    shopId: resolvedShopId,
  };

  const response = await api.post<AuthResponse>('/auth/login', payload);
  persistAuthResponse(response.data, 'shop', resolvedShopId);
  return response.data;
};

export const registerShopUser = async (shopId: string, data: ShopRegisterRequest): Promise<AuthResponse> => {
  const resolvedShopId = shopId.trim();
  const payload: Record<string, string> = {
    email: data.email,
    password: data.password || '',
    shopId: resolvedShopId,
  };

  if (data.phoneNumber) {
    payload.phoneNumber = data.phoneNumber;
  }

  const response = await api.post<AuthResponse>('/auth/register', payload);
  persistAuthResponse(response.data, 'shop', resolvedShopId);
  return response.data;
};

export const verifyPassword = async (data: VerifyPasswordRequest): Promise<VerifyPasswordResponse> => {
  const response = await api.post<VerifyPasswordResponse>('/verify', data);
  return response.data;
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
  const payload: Record<string, string> = {
    code: data.code,
  };

  if (data.name) payload.name = data.name;
  if (data.email) payload.email = data.email;
  if (data.phoneNumber) payload.phoneNumber = data.phoneNumber;
  if (data.password) payload.password = data.password;

  await api.patch('/me', payload);
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/me');
  return response.data;
};

export const updateSubscription = async (subscription: string): Promise<void> => {
  await api.patch('/user/me/subscription', { subscription });
};

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.location.href = '/login';
};

export const getCurrentUser = (): AuthResponse | null => {
  const user = localStorage.getItem(AUTH_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getShopCurrentUser = (shopId: string): AuthResponse | null => {
  if (!shopId.trim()) {
    return null;
  }

  const { userKey } = getShopAuthKeys(shopId);
  const user = localStorage.getItem(userKey);
  return user ? JSON.parse(user) : null;
};

export const clearShopAuth = (shopId: string) => {
  if (!shopId.trim()) {
    return;
  }

  const { tokenKey, userKey } = getShopAuthKeys(shopId);
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
};
