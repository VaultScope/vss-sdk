import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  VSSConfig,
  VSSError,
  HealthStatus,
  SystemStats,
  CPUInfo,
  CPUSpeed,
  CPUTemperature,
  CPULoad,
  MemoryInfo,
  DiskInfo,
  NetworkInterface,
  NetworkStats,
  ProcessInfo,
  GPUInfo,
  SpeedTestResult,
  APIKey,
  Alert,
  LogEntry,
  PowerCommand,
  APIKeyPermissions
} from './types';

export class VSSClient {
  private client: AxiosInstance;
  private config: VSSConfig;

  constructor(config: VSSConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (!originalRequest._retry && this.config.retryAttempts && originalRequest._retryCount < this.config.retryAttempts) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          await this.delay(this.config.retryDelay || 1000);
          return this.client(originalRequest);
        }

        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): VSSError {
    const vssError = new Error() as VSSError;

    if (error.response) {
      vssError.message = (error.response.data as any)?.message || error.message;
      vssError.status = error.response.status;
      vssError.code = (error.response.data as any)?.code || error.code;
      vssError.details = (error.response.data as any)?.details;
    } else if (error.request) {
      vssError.message = 'No response from server';
      vssError.code = 'NETWORK_ERROR';
    } else {
      vssError.message = error.message;
      vssError.code = 'REQUEST_ERROR';
    }

    return vssError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health endpoints
  async health(): Promise<string> {
    const response = await this.client.get<string>('/health');
    return response.data;
  }

  async healthDetailed(): Promise<HealthStatus> {
    const response = await this.client.get<HealthStatus>('/health/detailed');
    return response.data;
  }

  // Stats endpoints
  async stats(): Promise<SystemStats> {
    const response = await this.client.get<SystemStats>('/api/stats');
    return response.data;
  }

  async cpu(): Promise<{
    info: CPUInfo;
    speed: CPUSpeed;
    temperature: CPUTemperature;
    load: CPULoad;
  }> {
    const response = await this.client.get('/api/stats/cpu');
    return response.data;
  }

  async memory(): Promise<MemoryInfo> {
    const response = await this.client.get<MemoryInfo>('/api/stats/memory');
    return response.data;
  }

  async disk(): Promise<DiskInfo[]> {
    const response = await this.client.get<DiskInfo[]>('/api/stats/disk');
    return response.data;
  }

  async network(): Promise<NetworkInterface[]> {
    const response = await this.client.get<NetworkInterface[]>('/api/stats/network');
    return response.data;
  }

  async networkStats(): Promise<NetworkStats[]> {
    const response = await this.client.get<NetworkStats[]>('/api/network/stats');
    return response.data;
  }

  async processes(options?: {
    sortBy?: 'cpu' | 'memory' | 'name' | 'pid';
    limit?: number;
    filter?: string;
  }): Promise<ProcessInfo[]> {
    const response = await this.client.get<ProcessInfo[]>('/api/stats/processes', {
      params: options
    });
    return response.data;
  }

  async gpu(): Promise<GPUInfo[]> {
    const response = await this.client.get<GPUInfo[]>('/api/stats/gpu');
    return response.data;
  }

  // Hardware endpoints
  async hardware(): Promise<any> {
    const response = await this.client.get('/api/hardware');
    return response.data;
  }

  async mainboard(): Promise<any> {
    const response = await this.client.get('/api/hardware/mainboard');
    return response.data;
  }

  async bios(): Promise<any> {
    const response = await this.client.get('/api/hardware/bios');
    return response.data;
  }

  async chassis(): Promise<any> {
    const response = await this.client.get('/api/hardware/chassis');
    return response.data;
  }

  // Speed test
  async speedTest(): Promise<SpeedTestResult> {
    const response = await this.client.post<SpeedTestResult>('/api/speedtest', {}, {
      timeout: 120000 // 2 minutes for speed tests
    });
    return response.data;
  }

  async speedTestStatus(): Promise<{
    running: boolean;
    progress?: number;
    result?: SpeedTestResult;
  }> {
    const response = await this.client.get('/api/speedtest/status');
    return response.data;
  }

  // API Keys management
  async listApiKeys(): Promise<APIKey[]> {
    const response = await this.client.get<APIKey[]>('/api/apikeys');
    return response.data;
  }

  async createApiKey(data: {
    name: string;
    permissions?: APIKeyPermissions;
  }): Promise<APIKey> {
    const response = await this.client.post<APIKey>('/api/apikeys', data);
    return response.data;
  }

  async deleteApiKey(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/apikeys/${id}`);
    return response.data;
  }

  async updateApiKey(id: string, data: {
    name?: string;
    permissions?: APIKeyPermissions;
  }): Promise<APIKey> {
    const response = await this.client.put<APIKey>(`/api/apikeys/${id}`, data);
    return response.data;
  }

  // Alerts management
  async listAlerts(): Promise<Alert[]> {
    const response = await this.client.get<Alert[]>('/api/alerts');
    return response.data;
  }

  async createAlert(alert: Alert): Promise<Alert> {
    const response = await this.client.post<Alert>('/api/alerts', alert);
    return response.data;
  }

  async updateAlert(id: string, alert: Partial<Alert>): Promise<Alert> {
    const response = await this.client.put<Alert>(`/api/alerts/${id}`, alert);
    return response.data;
  }

  async deleteAlert(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/alerts/${id}`);
    return response.data;
  }

  async toggleAlert(id: string, enabled: boolean): Promise<Alert> {
    const response = await this.client.patch<Alert>(`/api/alerts/${id}/toggle`, { enabled });
    return response.data;
  }

  // Logs
  async logs(options?: {
    level?: string;
    source?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<LogEntry[]> {
    const response = await this.client.get<LogEntry[]>('/api/logs', {
      params: options
    });
    return response.data;
  }

  async systemLogs(options?: {
    lines?: number;
    filter?: string;
  }): Promise<string[]> {
    const response = await this.client.get<string[]>('/api/logs/system', {
      params: options
    });
    return response.data;
  }

  // Power commands
  async power(command: PowerCommand): Promise<{ message: string; scheduled?: boolean }> {
    const response = await this.client.post('/api/power', command);
    return response.data;
  }

  async cancelPowerCommand(): Promise<{ message: string }> {
    const response = await this.client.delete('/api/power/cancel');
    return response.data;
  }

  // Network history
  async networkHistory(options?: {
    interface?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await this.client.get('/api/network-history', {
      params: options
    });
    return response.data;
  }

  // Custom request method for extending functionality
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Update configuration
  updateConfig(config: Partial<VSSConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.baseURL) {
      this.client.defaults.baseURL = config.baseURL;
    }

    if (config.apiKey) {
      this.client.defaults.headers['x-api-key'] = config.apiKey;
    }

    if (config.timeout) {
      this.client.defaults.timeout = config.timeout;
    }
  }

  // Get current configuration
  getConfig(): VSSConfig {
    return { ...this.config };
  }
}