import type { 
  LoginRequest, 
  CreateUserRequest, 
  AuthResponse, 
  TokenRefreshRequest, 
  TokenRefreshResponse, 
  PasswordChangeRequest,
  ApiResponse,
  User 
} from '../types/auth.types';

const API_BASE_URL = 'http://localhost:8091/api/v1';

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const apiResponse: ApiResponse<AuthResponse> = await response.json();
    const authData = apiResponse.data;
    
    // Store tokens
    localStorage.setItem(this.tokenKey, authData.token);
    localStorage.setItem(this.refreshTokenKey, authData.refreshToken);
    
    return authData;
  }

  async register(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const apiResponse: ApiResponse<User> = await response.json();
    return apiResponse.data;
  }

  async refreshToken(): Promise<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // If refresh fails, clear tokens and redirect to login
      this.logout();
      throw new Error('Token refresh failed');
    }

    const apiResponse: ApiResponse<TokenRefreshResponse> = await response.json();
    const tokenData = apiResponse.data;
    
    // Update stored tokens
    localStorage.setItem(this.tokenKey, tokenData.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokenData.refreshToken);
    
    return tokenData;
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password change failed');
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    
    // Clear local storage regardless of API call success
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset failed');
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  getCurrentUser(): { username: string; role: string } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub,
        role: payload.role || 'USER'
      };
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService(); 