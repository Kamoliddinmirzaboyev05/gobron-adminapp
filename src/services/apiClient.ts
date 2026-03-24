
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { authStorage } from '../utils/authStorage';

const API_BASE_URL = 'https://gobron-backend.onrender.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the access token to headers
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await authStorage.getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to handle token refresh
const refreshAuthLogic = async (failedRequest: AxiosError) => {
  const { refreshToken } = await authStorage.getTokens();
  if (!refreshToken) {
    return Promise.reject(failedRequest);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
    
    await authStorage.setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

    if (failedRequest.response) {
        failedRequest.response.config.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return Promise.resolve();
    }

    return Promise.reject(failedRequest);

  } catch (error) {
    console.error('Failed to refresh token:', error);
    await authStorage.clearTokens();
    // You might want to navigate the user to the login screen here
    return Promise.reject(error);
  }
};

// Use the interceptor to handle 401 errors
createAuthRefreshInterceptor(apiClient, refreshAuthLogic);

export default apiClient;
