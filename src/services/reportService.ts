// src/services/reportService.ts

import i18n from '../locales/i18n';

// Extract data from NestJS TransformInterceptor response wrapper { data: ... }
function extractData<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

// Get auth headers from Supabase session
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export type TargetType = 'share' | 'template';

export interface CreateReportRequest {
  target_type: TargetType;
  target_id: string;
  reason: string;
}

export async function createReport(data: CreateReportRequest): Promise<{ id: string; created_at: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/reports', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: i18n.t('common:status.error') }));
    throw new Error(error.message || error.error || i18n.t('common:status.error'));
  }

  const result = await response.json();
  return extractData<{ id: string; created_at: string }>(result);
}
