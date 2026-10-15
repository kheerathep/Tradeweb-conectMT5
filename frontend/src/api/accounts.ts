import { apiClient } from './client';
import { TradingAccount, AccountType } from '../types';

export interface CreateAccountPayload {
  accountName: string;
  broker?: string;
  mt5Server?: string;
  accountType: AccountType;
  currency?: string;
  initialBalance?: number;
}

export interface UpdateAccountPayload {
  accountName?: string;
  broker?: string;
  mt5Server?: string;
  accountType?: AccountType;
  initialBalance?: number;
}

export const accountsApi = {
  getAccounts: () => apiClient<TradingAccount[]>('/accounts'),

  getAccountById: (id: number) => apiClient<TradingAccount>(`/accounts/${id}`),

  createAccount: (payload: CreateAccountPayload) =>
    apiClient<TradingAccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAccount: (id: number, payload: UpdateAccountPayload) =>
    apiClient<TradingAccount>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  archiveAccount: (id: number) =>
    apiClient<{ message: string }>(`/accounts/${id}`, {
      method: 'DELETE',
    }),
};
