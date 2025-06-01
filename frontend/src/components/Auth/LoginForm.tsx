import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginRequest } from '../../types/auth.types';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onClose: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onClose }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData);
      onClose(); // Close modal on successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Don't have an account?{' '}
          <button 
            type="button" 
            className="link-button" 
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}; 