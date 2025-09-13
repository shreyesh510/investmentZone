import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';
import type { LoginData, RegisterData, AuthResponse } from '../../services/authApi';
import type { UserPermissions } from '../../types/permissions';
import { DEFAULT_USER_PERMISSIONS } from '../../types/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  isAiFeatureEnabled?: boolean; // Deprecated: kept for backward compatibility
  permissions: UserPermissions; // Primary source of truth for permissions
}

interface AuthState {
  user: User | null;
  token: string | null;
  testToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  testToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      
      // Store tokens and permissions in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('testToken', response.testToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.user.permissions) {
        localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      
      // Store tokens and permissions in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('testToken', response.testToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.user.permissions) {
        localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('testToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    authApi.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      const testToken = localStorage.getItem('testToken');
      const user = localStorage.getItem('user');
      const permissions = localStorage.getItem('permissions');
      
  // Initialize from localStorage if present
      
      if ((token || testToken) && user) {
        try {
          state.token = token;
          state.testToken = testToken;
          const userData = JSON.parse(user);
          
          // Add permissions to user data if available, otherwise use defaults
          if (permissions) {
            userData.permissions = JSON.parse(permissions);
          } else {
            userData.permissions = DEFAULT_USER_PERMISSIONS;
          }
          
          state.user = userData;
          state.isAuthenticated = true;
          // Auth initialized successfully
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('testToken');
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');
        }
      } else {
  // No valid credentials found in localStorage
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.testToken = action.payload.testToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.testToken = action.payload.testToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.testToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
