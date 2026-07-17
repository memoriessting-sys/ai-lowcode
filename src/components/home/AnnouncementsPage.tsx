// src/components/home/AnnouncementsPage.tsx

import { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchPublishedAnnouncements, type Announcement } from '../../services/announcementService';

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(['home', 'common']);

  const typeConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: t('home:announcement.typeInfo') },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: t('home:announcement.typeWarning') },
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('common:date.justNow');
    if (minutes < 60) return t('common:date.minutesAgo', { count: minutes });
    if (hours < 24) return t('common:date.hoursAgo', { count: hours });
    if (days < 7) return t('common:date.daysAgo', { count: days });
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  useEffect(() => {
    fetchPublishedAnnouncements().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-800">{t('home:announcement.pageTitle')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('home:announcement.empty')}</p>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {announcements.map((item) => {
                const config = typeConfig[item.type] || typeConfig.info;
                const Icon = config.icon;

                return (
                  <div key={item.id} className="relative pl-16">
                    {/* 时间线节点 */}
                    <div className={`absolute left-4 top-4 w-5 h-5 rounded-full ${config.bg} border-2 ${config.border} flex items-center justify-center`}>
                      <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    </div>

                    <div className={`bg-white rounded-xl shadow-sm border ${config.border} overflow-hidden`}>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(item.published_at || item.created_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                        <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
