// src/components/home/AnnouncementModal.tsx

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchPublishedAnnouncements, type Announcement } from '../../services/announcementService';

const DISMISS_KEY = 'announcement_dismissed_until';

function getDismissedDate(): string | null {
  return localStorage.getItem(DISMISS_KEY);
}

function isDismissedToday(): boolean {
  const dismissed = getDismissedDate();
  if (!dismissed) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dismissed === today;
}

function dismissForToday() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DISMISS_KEY, today);
}

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [noRemind, setNoRemind] = useState(false);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('home');

  useEffect(() => {
    if (isDismissedToday()) return;

    fetchPublishedAnnouncements().then((data) => {
      const important = data.find((a) => a.type === 'warning' && a.status === 'published');
      if (important) {
        setAnnouncement(important);
        setVisible(true);
      }
    });
  }, []);

  const handleClose = () => {
    if (noRemind) dismissForToday();
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white flex-1">{t('announcement.modalTitle')}</h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{announcement.title}</h3>
          <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {announcement.content}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noRemind}
              onChange={(e) => setNoRemind(e.target.checked)}
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            {t('announcement.dontRemind')}
          </label>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors"
          >
            {t('announcement.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
