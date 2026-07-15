export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'staff' | 'admin';
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
}
