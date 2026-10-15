import { apiClient } from './client';
import { Mt5ConnectionResponse, SyncBatch, Mt5Deal } from '../types';

export const mt5Api = {
  getConnection: (tradingAccountId: number): Promise<Mt5ConnectionResponse> => {
    return apiClient<Mt5ConnectionResponse>(`/mt5/connections/${tradingAccountId}`);
  },

  createOrRotateToken: (tradingAccountId: number): Promise<Mt5ConnectionResponse> => {
    return apiClient<Mt5ConnectionResponse>(`/mt5/connections/${tradingAccountId}/token`, {
      method: 'POST',
    });
  },

  disconnect: (tradingAccountId: number): Promise<Mt5ConnectionResponse> => {
    return apiClient<Mt5ConnectionResponse>(`/mt5/connections/${tradingAccountId}/disconnect`, {
      method: 'POST',
    });
  },

  getRecentBatches: (tradingAccountId: number): Promise<SyncBatch[]> => {
    return apiClient<SyncBatch[]>(`/mt5/connections/${tradingAccountId}/batches`);
  },

  getSyncedDeals: (tradingAccountId: number): Promise<Mt5Deal[]> => {
    return apiClient<Mt5Deal[]>(`/mt5/connections/${tradingAccountId}/deals`);
  },
};
