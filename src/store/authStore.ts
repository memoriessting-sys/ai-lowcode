// src/store/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { AuthUser, Profile, UsageInfo } from '../types/auth';

// Extract data from NestJS TransformInterceptor response wrapper { data: ... }
function extractData<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isGuest: boolean;
  loading: boolean;
  usage: UsageInfo | null;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setUsage: (usage: UsageInfo | null) => void;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  fetchProfile: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  resetGuestUsage: () => void;
}

const GUEST_STORAGE_KEY = 'ai-lowcode-guest';
const USAGE_DATE_KEY = 'ai-lowcode-usage-date';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isGuest: false,
      loading: true,
      usage: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setUsage: (usage) => set({ usage }),

      signInWithOAuth: async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          // OAuth error handled by redirect
        }
      },

      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { error: error.message };
        }
        return { error: null };
      },

      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          return { error: error.message };
        }
        return { error: null };
      },

      signOut: async () => {
        // 清除 Supabase session
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.warn('Supabase signOut failed, continuing with local cleanup:', err);
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            // 完全忽略
          }
        }

        // 清除所有 localStorage
        localStorage.removeItem('ai-lowcode-auth');
        localStorage.removeItem('ai-lowcode-guest');
        localStorage.removeItem('ai-lowcode-usage-date');

        // 重置状态（loading 保持 false，不要设 true 否则会无限转圈）
        set({ user: null, profile: null, usage: null, isGuest: false, loading: false });

        // 再次清除（防止 persist 中间件在 set 时重新写入）
        localStorage.removeItem('ai-lowcode-auth');
        localStorage.removeItem('ai-lowcode-guest');
        localStorage.removeItem('ai-lowcode-usage-date');

        // 刷新页面以完全重置状态
        window.location.href = '/';
      },

      continueAsGuest: async () => {
        // 如果之前有 Supabase session，先登出
        try {
          await supabase.auth.signOut();
        } catch {
          // 忽略 signOut 错误
        }
        // 检查是否已有 guest_id
        const stored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (!stored) {
          const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ guestId, usage: 0 }));
        }
        set({ user: null, profile: null, isGuest: true, loading: false, usage: null });
        get().resetGuestUsage();
      },

      fetchProfile: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            set({ user: null, profile: null, loading: false });
            return;
          }

          // GitHub 用户信息可能在 user_metadata.name 或 user_metadata.full_name
          // Supabase GitHub OAuth 返回的元数据格式
          const authUser: AuthUser = {
            id: user.id,
            email: user.email || '',
            displayName: user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.user_name || user.email?.split('@')[0] || null,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          };
          set({ user: authUser, isGuest: false, loading: false });

          // 获取 profile via backend API
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/auth/me', { headers });

            if (response.ok) {
              const rawData = await response.json();
              const profile = extractData<Profile>(rawData);
              if (profile) {
                set({ profile });
              }
            } else {
              // Profile might not exist yet, try creating it
              const { data: newProfile } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  display_name: authUser.displayName,
                  avatar_url: authUser.avatarUrl,
                })
                .select()
                .single();

              if (newProfile) {
                set({ profile: newProfile });
              }
            }
          } catch (profileErr) {
            // Profile fetch failed, try direct Supabase as fallback
            console.warn('fetchProfile API failed, trying direct Supabase:', profileErr);
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              set({ profile });
            } else if (error) {
              const { data: newProfile } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  display_name: authUser.displayName,
                  avatar_url: authUser.avatarUrl,
                })
                .select()
                .single();

              if (newProfile) {
                set({ profile: newProfile });
              }
            }
          }
        } catch (err) {
          // 静默处理错误，不弹出提示
          console.error('fetchProfile error:', err);
          set({ loading: false });
        }
      },

      fetchUsage: async () => {
        const { isGuest, user } = get();

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (!isGuest && user) {
            // 登录用户：使用 token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }
          } else {
            // 游客：使用 guest_id
            const guestData = localStorage.getItem(GUEST_STORAGE_KEY);
            let guestId: string;

            if (guestData) {
              const parsed = JSON.parse(guestData);
              guestId = parsed.guestId || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              if (!parsed.guestId) {
                localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ ...parsed, guestId }));
              }
            } else {
              guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ guestId }));
            }

            headers['x-guest-id'] = guestId;
          }

          const response = await fetch('/api/usage', { headers });

          if (response.ok) {
            const rawData = await response.json();
            const data = extractData<{ used: number; limit: number; remaining: number; resetAt: string }>(rawData);
            set({
              usage: {
                used: data.used,
                limit: data.limit,
                remaining: data.remaining,
                resetAt: data.resetAt,
              },
            });
          } else {
            // 默认值
            set({
              usage: {
                used: 0,
                limit: isGuest ? 1 : 3,
                remaining: isGuest ? 1 : 3,
                resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
              },
            });
          }
        } catch (err) {
          console.error('fetchUsage error:', err);
          set({
            usage: {
              used: 0,
              limit: isGuest ? 1 : 3,
              remaining: isGuest ? 1 : 3,
              resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
            },
          });
        }
      },

      resetGuestUsage: () => {
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem(USAGE_DATE_KEY);

        if (lastDate !== today) {
          // 新的一天，重置游客使用次数
          localStorage.setItem(USAGE_DATE_KEY, today);
          const stored = localStorage.getItem(GUEST_STORAGE_KEY);
          if (stored) {
            const data = JSON.parse(stored);
            data.usage = 0;
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
          }
        }
      },
    }),
    {
      name: 'ai-lowcode-auth',
      partialize: (state) => ({
        isGuest: state.isGuest,
      }),
    }
  )
);

// 监听 usage-update 事件
if (typeof window !== 'undefined') {
  window.addEventListener('usage-update', ((e: CustomEvent) => {
    useAuthStore.getState().setUsage(e.detail);
  }) as EventListener);
}
