import { create } from 'zustand';
import type { User } from '../types/auth';
import { authService } from '../services/auth.service';
import { setApiToken, setLogoutCallback } from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  logoutStore: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true, // starts checking auth silently on startup

  setAccessToken: (token: string | null) => {
    setApiToken(token);
    set({ accessToken: token });
  },

  logoutStore: () => {
    setApiToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: false,
    });
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(credentials);
      setApiToken(response.accessToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (error) {
      console.error('API logout failed:', error);
    } finally {
      // Clear store anyway
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      // Step 1: Attempt to refresh the access token silently
      const refreshResponse = await authService.refresh();
      const token = refreshResponse.accessToken;
      
      setApiToken(token);
      set({ accessToken: token });

      // Step 2: Fetch user profile using the new access token
      const meResponse = await authService.getMe();
      
      set({
        user: meResponse.user,
        isAuthenticated: true,
      });
    } catch (error) {
      // If silent refresh fails, clear auth states quietly
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
}));

setLogoutCallback(() => {
  useAuthStore.getState().logoutStore();
});

export default useAuthStore;
export type { AuthState };
