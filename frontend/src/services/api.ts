import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface AccountType {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id: string;
  accountId: number;
  name: string;
  type: AccountType;
  accountNo?: string;
  branch?: string;
  address?: string;
  contact?: string;
  isOwnerAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create Account Interface (what we send to backend)
export interface CreateAccountData {
  name: string;
  type: string; // Backend accepts string (account type name)
  accountNo?: string;
  branch?: string;
  address?: string;
  contact?: string;
  isOwnerAccount: boolean;
}

export interface TransactionDetail {
  _id?: string;
  serialNo: number;
  account: Account | string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

export interface Transaction {
  _id: string;
  transactionId: number;
  date: string;
  details: TransactionDetail[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Create Transaction Interface (what we send to backend)
export interface CreateTransactionData {
  date: string;
  details: {
    account: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
  }[];
}

export interface Party {
  _id: string;
  name: string;
  contact?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAccounts: number;
  ownerAccounts: number;
  totalTransactions: number;
  totalAccountTypes: number;
  recentTransactions: Transaction[];
  accountsByType: Array<{ _id: string[]; count: number }>;
}

// Account Types API
export const accountTypeAPI = {
  getAll: (): Promise<AxiosResponse<AccountType[]>> => api.get('/account-types'),
  create: (data: Partial<AccountType>): Promise<AxiosResponse<AccountType>> => api.post('/account-types', data),
  update: (id: string, data: Partial<AccountType>): Promise<AxiosResponse<AccountType>> => api.put(`/account-types/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<{ message: string }>> => api.delete(`/account-types/${id}`),
};

// Accounts API
export const accountAPI = {
  getAll: (): Promise<AxiosResponse<Account[]>> => api.get('/accounts'),
  getOwnerAccounts: (): Promise<AxiosResponse<Account[]>> => api.get('/accounts/owner'),
  getById: (id: string): Promise<AxiosResponse<Account>> => api.get(`/accounts/${id}`),
  create: (data: CreateAccountData): Promise<AxiosResponse<Account>> => api.post('/accounts', data),
  update: (id: string, data: Partial<CreateAccountData>): Promise<AxiosResponse<Account>> => api.put(`/accounts/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<{ message: string }>> => api.delete(`/accounts/${id}`),
};

// Transactions API
export const transactionAPI = {
  getAll: (params = {}): Promise<AxiosResponse<{
    transactions: Transaction[];
    totalPages: number;
    currentPage: number;
    total: number;
  }>> => api.get('/transactions', { params }),
  getById: (id: string): Promise<AxiosResponse<Transaction>> => api.get(`/transactions/${id}`),
  create: (data: CreateTransactionData): Promise<AxiosResponse<Transaction>> => api.post('/transactions', data),
  delete: (id: string): Promise<AxiosResponse<{ message: string }>> => api.delete(`/transactions/${id}`),
};

// Parties API
export const partyAPI = {
  getAll: (): Promise<AxiosResponse<Party[]>> => api.get('/parties'),
  getById: (id: string): Promise<AxiosResponse<Party>> => api.get(`/parties/${id}`),
  create: (data: Partial<Party>): Promise<AxiosResponse<Party>> => api.post('/parties', data),
  update: (id: string, data: Partial<Party>): Promise<AxiosResponse<Party>> => api.put(`/parties/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<{ message: string }>> => api.delete(`/parties/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<DashboardStats>> => api.get('/dashboard/stats'),
  getAccountsSummary: (): Promise<AxiosResponse<Account[]>> => api.get('/dashboard/accounts-summary'),
};

export default api;