export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  ai_usage_today: number;
  usage_reset_at: string;
  created_at: string;
}

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}
