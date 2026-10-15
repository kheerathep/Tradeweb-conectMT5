import { apiClient } from './client';
import { User } from '../types';

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  timezone?: string;
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginWithGoogle: (credential: string) =>
    apiClient<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  logout: () =>
    apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => apiClient<User>('/auth/me'),
};

