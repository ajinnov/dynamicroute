import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginData {
  username: string;
  password: string;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

export interface UserCreateData {
  username: string;
  email: string;
  password: string;
}

export interface AWSAccount {
  id: number;
  name: string;
  access_key_id: string;
  region: string;
}

export interface Domain {
  id: number;
  name: string;
  zone_id: string;
  record_type: 'A' | 'AAAA';
  ttl: number;
  current_ip?: string;
  last_updated?: string;
  is_active: boolean;
  aws_account_id: number;
  slack_account_id?: number;
}

export interface SlackAccount {
  id: number;
  name: string;
  webhook_url: string;
  is_active: boolean;
}

export interface SlackAccountCreateData {
  name: string;
  webhook_url: string;
}

export interface DashboardStats {
  total_domains: number;
  active_domains: number;
  total_aws_accounts: number;
  current_ipv4?: string;
  current_ipv6?: string;
}

export const authAPI = {
  login: (data: LoginData) => api.post('/auth/login', data),
};

export const usersAPI = {
  list: () => api.get<UserData[]>('/users'),
  create: (data: UserCreateData) => api.post<UserData>('/users', data),
  update: (id: number, data: { email?: string; is_active?: boolean }) => api.put<UserData>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const awsAccountsAPI = {
  list: () => api.get<AWSAccount[]>('/aws-accounts'),
  create: (data: Omit<AWSAccount, 'id'>) => api.post<AWSAccount>('/aws-accounts', data),
  delete: (id: number) => api.delete(`/aws-accounts/${id}`),
};

export const slackAccountsAPI = {
  list: () => api.get<SlackAccount[]>('/slack-accounts'),
  create: (data: SlackAccountCreateData) => api.post<SlackAccount>('/slack-accounts', data),
  update: (id: number, data: { name?: string; webhook_url?: string; is_active?: boolean }) => 
    api.put<SlackAccount>(`/slack-accounts/${id}`, data),
  test: (id: number) => api.post(`/slack-accounts/${id}/test`),
  delete: (id: number) => api.delete(`/slack-accounts/${id}`),
};

export const domainsAPI = {
  list: () => api.get<Domain[]>('/domains'),
  create: (data: Omit<Domain, 'id' | 'current_ip' | 'last_updated'>) => 
    api.post<Domain>('/domains', data),
  update: (id: number, data: Partial<Omit<Domain, 'id' | 'current_ip' | 'last_updated'>>) => 
    api.put<Domain>(`/domains/${id}`, data),
  updateIP: (id: number) => api.put(`/domains/${id}/update-ip`),
  delete: (id: number) => api.delete(`/domains/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export interface Setting {
  value: any;
  description: string;
  is_system: boolean;
}

export interface SettingsResponse {
  [key: string]: Setting;
}

export interface SettingUpdate {
  value: any;
}

export const settingsAPI = {
  getAll: () => api.get<SettingsResponse>('/settings'),
  get: (key: string) => api.get<Setting>(`/settings/${key}`),
  update: (key: string, data: SettingUpdate) => api.put<Setting>(`/settings/${key}`, data),
  reset: (key: string) => api.post<Setting>(`/settings/reset/${key}`),
};

export default api;