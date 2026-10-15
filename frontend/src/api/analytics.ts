import { apiClient } from './client';
import { AnalyticsReport, CsvImportResult } from '../types';

export const analyticsApi = {
  getAnalytics: (accountId: number, fromTime?: string, toTime?: string): Promise<AnalyticsReport> => {
    const query = new URLSearchParams();
    query.set('accountId', accountId.toString());
    if (fromTime) query.set('fromTime', fromTime);
    if (toTime) query.set('toTime', toTime);

    return apiClient<AnalyticsReport>(`/analytics?${query.toString()}`);
  },

  exportCsvUrl: (accountId: number): string => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${base}/trades/export/csv?accountId=${accountId}`;
  },

  importCsv: async (accountId: number, file: File): Promise<CsvImportResult> => {
    const formData = new FormData();
    formData.append('accountId', accountId.toString());
    formData.append('file', file);

    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const response = await fetch(`${base}/trades/import/csv`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let err;
      try {
        err = await response.json();
      } catch {
        err = { message: 'Failed to import CSV' };
      }
      throw err;
    }

    return response.json();
  },
};
