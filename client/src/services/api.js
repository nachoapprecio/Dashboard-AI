import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para agregar token a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Autenticación
  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Chat
  async sendMessage(question) {
    const response = await this.api.post('/chat', { question });
    return response.data;
  }

  // Reportes
  async getReportes(filters = {}) {
    const response = await this.api.get('/reportes', { params: filters });
    return response.data;
  }

  // PDF
  async generatePDF(htmlContent, reportSummary) {
    const response = await this.api.post('/pdf/generate', {
      htmlContent,
      reportSummary
    });
    return response.data;
  }
}

export default new ApiService();
