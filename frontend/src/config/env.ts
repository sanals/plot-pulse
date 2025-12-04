/**
 * Environment configuration
 * All environment variables must be prefixed with VITE_ to be accessible in the app
 */

interface EnvConfig {
  apiBaseUrl: string;
  appName: string;
  appEnv: 'development' | 'production' | 'test';
  enableDebug: boolean;
}

/**
 * Get environment configuration
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api/v1',
    appName: import.meta.env.VITE_APP_NAME || 'PlotPulse',
    appEnv: (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV,
  };
};

/**
 * Environment configuration instance
 */
export const env = getEnvConfig();

/**
 * Check if running in development
 */
export const isDev = (): boolean => env.appEnv === 'development';

/**
 * Check if running in production
 */
export const isProd = (): boolean => env.appEnv === 'production';

/**
 * Get API base URL
 */
export const getApiBaseUrl = (): string => env.apiBaseUrl;

// Log environment in development
if (isDev()) {
  console.log('🔧 Environment Config:', {
    apiBaseUrl: env.apiBaseUrl,
    appName: env.appName,
    appEnv: env.appEnv,
    enableDebug: env.enableDebug,
  });
}

