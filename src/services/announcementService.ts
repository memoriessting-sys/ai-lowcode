export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning';
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
}

export async function fetchPublishedAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await fetch('/api/announcements/published');
    if (!res.ok) return [];
    const json = await res.json();
    // 后端 TransformInterceptor 包裹在 { data: ... } 中
    return json?.data || json || [];
  } catch {
    return [];
  }
}
