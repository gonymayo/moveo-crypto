import apiClient from './client';
import type { User } from '@/context/AuthContext';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: async (data: {
    email: string;
    name: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  // Called on page load to validate a stored token and get the current user.
  me: async (token: string): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
