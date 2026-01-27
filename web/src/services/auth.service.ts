import api from '@/lib/api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse 
} from '@/types/api.types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Login failed');
    }
    
    const authData = response.data.data!;
    
    // Guardar token
    if (authData.token) {
      localStorage.setItem('token', authData.token);
    }
    
    return authData;
  },
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Registration failed');
    }
    
    const authData = response.data.data!;
    
    // Guardar token
    if (authData.token) {
      localStorage.setItem('token', authData.token);
    }
    
    return authData;
  },
  
  logout() {
    localStorage.removeItem('token');
  },
  
  getToken(): string | null {
    return localStorage.getItem('token');
  },
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
