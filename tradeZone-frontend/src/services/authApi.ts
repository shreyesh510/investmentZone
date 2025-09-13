import getAxios from '../utils/interceptor/axiosInterceptor';
import type { UserPermissions } from '../types/permissions';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    isAiFeatureEnabled?: boolean; // Deprecated: kept for backward compatibility
    permissions: UserPermissions; // Primary source of truth for permissions
  };
  token: string;
  testToken: string;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await getAxios.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await getAxios.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('testToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  },
};
