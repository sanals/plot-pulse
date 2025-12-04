export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string; // Can be username or email
  password: string;
}

export interface CreateUserRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  role?: string; // Optional, will default on backend if not provided
}

// Alias for consistency with other parts of the codebase
export type RegisterRequest = CreateUserRequest;

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  data: T;
}

export interface MessageResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
} 