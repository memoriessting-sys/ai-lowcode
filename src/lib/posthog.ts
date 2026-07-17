// src/lib/posthog.ts

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export function initPostHog() {
  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: true, // 自动捕获点击事件
    });
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}

export function identifyGuest(guestId: string) {
  if (POSTHOG_KEY) {
    posthog.identify(guestId, { type: 'guest' });
  }
}

export function resetUser() {
  if (POSTHOG_KEY) {
    posthog.reset();
  }
}

// 追踪用户行为步骤
export function trackStep(step: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) {
    posthog.capture('user_step', { step, ...properties });
  }
}

// 追踪功能使用
export function trackFeature(feature: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) {
    posthog.capture('feature_used', { feature, ...properties });
  }
}

// 追踪 AI 生成
export function trackAIGeneration(prompt: string, success: boolean, elementCount?: number) {
  if (POSTHOG_KEY) {
    posthog.capture('ai_generation', {
      prompt_length: prompt.length,
      success,
      element_count: elementCount,
    });
  }
}

// 追踪导出
export function trackExport(type: 'single' | 'multi' | 'pdf', pageCount: number) {
  if (POSTHOG_KEY) {
    posthog.capture('export', { type, page_count: pageCount });
  }
}

// 追踪分享
export function trackShare(action: 'create' | 'view' | 'import') {
  if (POSTHOG_KEY) {
    posthog.capture('share', { action });
  }
}

// 用户步骤枚举
export const UserStep = {
  // 登录流程
  LANDING_PAGE: 'landing_page',
  CLICK_LOGIN: 'click_login',
  LOGIN_SUCCESS: 'login_success',
  CLICK_GUEST: 'click_guest',
  GUEST_ENTER: 'guest_enter',

  // 编辑流程
  VIEW_EDITOR: 'view_editor',
  FIRST_AI_PROMPT: 'first_ai_prompt',
  AI_GENERATE_SUCCESS: 'ai_generate_success',
  AI_GENERATE_FAIL: 'ai_generate_fail',
  DRAG_ELEMENT: 'drag_element',
  EDIT_PROPERTY: 'edit_property',
  CREATE_PAGE: 'create_page',
  DELETE_PAGE: 'delete_page',

  // 导出流程
  CLICK_EXPORT: 'click_export',
  EXPORT_SINGLE: 'export_single',
  EXPORT_MULTI: 'export_multi',

  // 分享流程
  CLICK_SHARE: 'click_share',
  SHARE_CREATE: 'share_create',
  SHARE_VIEW: 'share_view',
  SHARE_IMPORT: 'share_import',

  // 退出
  LOGOUT: 'logout',
  LEAVE_PAGE: 'leave_page',
} as const;

export type UserStepType = typeof UserStep[keyof typeof UserStep];
