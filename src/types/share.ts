// src/types/share.ts

import type { PageSchema } from './schema';

export interface ShareData {
  id: string;
  name: string;
  isPublic: boolean;
  pageSchema: PageSchema | PageSchema[];
  pageCount: number;
  createdAt?: string;
  viewCount?: number;
  creator?: {
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateShareRequest {
  name: string;
  isPublic: boolean;
  pageSchema: PageSchema | PageSchema[];
  pageCount: number;
}

export interface CreateShareResponse {
  id: string;
  shareUrl: string;
}

export interface MyShareItem {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  viewCount: number;
  status: string;
}
