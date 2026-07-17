// src/services/shareService.ts

import type { CreateShareRequest, CreateShareResponse, ShareData, MyShareItem } from '../types/share';
import i18n from '../locales/i18n';

// API calls go through Vite proxy in dev, or same-domain in production
const API_BASE = '/api/share';

// 人性化错误提示
function getFriendlyError(error: unknown, defaultMsg: string): string {
  if (error instanceof Error) {
    if (error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token')) {
      return i18n.t('common:status.error');
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return i18n.t('common:status.error');
    }
    return error.message;
  }
  return defaultMsg;
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    throw new Error(i18n.t('common:status.error'));
  }
}

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

export async function createShare(data: CreateShareRequest): Promise<CreateShareResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await safeParseJson(response);
      throw new Error(error.message || error.error || i18n.t('common:status.error'));
    }

    const result = await safeParseJson(response);
    return extractData<CreateShareResponse>(result);
  } catch (error) {
    throw new Error(getFriendlyError(error, i18n.t('common:status.error')));
  }
}

export async function getShare(id: string): Promise<ShareData> {
  try {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      const error = await safeParseJson(response);
      throw new Error(error.message || error.error || i18n.t('common:status.loadFailed'));
    }

    const result = await safeParseJson(response);
    return extractData<ShareData>(result);
  } catch (error) {
    throw new Error(getFriendlyError(error, i18n.t('common:status.loadFailed')));
  }
}

export async function getMyShares(): Promise<{ shares: MyShareItem[] }> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE}/my`, { headers });

    if (!response.ok) {
      const error = await safeParseJson(response);
      throw new Error(error.message || error.error || i18n.t('common:status.loadFailed'));
    }

    const result = await safeParseJson(response);
    return extractData<{ shares: MyShareItem[] }>(result);
  } catch (error) {
    throw new Error(getFriendlyError(error, i18n.t('common:status.loadFailed')));
  }
}

export async function deleteShare(id: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await safeParseJson(response);
      throw new Error(error.message || error.error || i18n.t('common:status.error'));
    }
  } catch (error) {
    throw new Error(getFriendlyError(error, i18n.t('common:status.error')));
  }
}

export async function updateShare(id: string, updates: { isPublic?: boolean }): Promise<MyShareItem> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await safeParseJson(response);
      throw new Error(error.message || error.error || i18n.t('common:status.error'));
    }

    const result = await safeParseJson(response);
    return extractData<MyShareItem>(result);
  } catch (error) {
    throw new Error(getFriendlyError(error, i18n.t('common:status.error')));
  }
}
