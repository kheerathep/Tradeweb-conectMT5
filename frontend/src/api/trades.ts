import { apiClient } from './client';
import { Trade, Mt5Deal, TradeDirection, TradeStatus } from '../types';

export interface TradeFilterParams {
  accountId: number;
  status?: TradeStatus;
  symbol?: string;
  fromTime?: string;
  toTime?: string;
}

export interface UpdateJournalPayload {
  setupName?: string;
  entryReason?: string;
  exitReason?: string;
  notes?: string;
  emotionBefore?: string;
  emotionAfter?: string;
  followedRules?: boolean;
  mistakes?: string;
  postTradeReview?: string;
  rating?: number;
  riskAmount?: number;
}

export interface CreateManualTradePayload {
  tradingAccountId: number;
  symbol: string;
  direction: TradeDirection;
  totalVolume: number;
  entryPrice: number;
  exitPrice?: number;
  openedAt?: string;
  closedAt?: string;
  grossPnl?: number;
  commissionTotal?: number;
  swapTotal?: number;
  setupName?: string;
  notes?: string;
}

export interface TradeDetailResponse {
  trade: Trade;
  deals: Mt5Deal[];
}

export const tradesApi = {
  getTrades: (params: TradeFilterParams): Promise<Trade[]> => {
    const query = new URLSearchParams();
    query.set('accountId', params.accountId.toString());
    if (params.status) query.set('status', params.status);
    if (params.symbol) query.set('symbol', params.symbol);
    if (params.fromTime) query.set('fromTime', params.fromTime);
    if (params.toTime) query.set('toTime', params.toTime);

    return apiClient<Trade[]>(`/trades?${query.toString()}`);
  },

  getTradeById: (id: number): Promise<TradeDetailResponse> => {
    return apiClient<TradeDetailResponse>(`/trades/${id}`);
  },

  updateJournal: (id: number, payload: UpdateJournalPayload): Promise<Trade> => {
    return apiClient<Trade>(`/trades/${id}/journal`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  createManualTrade: (payload: CreateManualTradePayload): Promise<Trade> => {
    return apiClient<Trade>('/trades', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteTrade: (id: number): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/trades/${id}`, {
      method: 'DELETE',
    });
  },
};
