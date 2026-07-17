// src/components/share/ReportModal.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { createReport, type TargetType } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';

interface ReportModalProps {
  targetType: TargetType;
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

const REPORT_REASON_KEYS = [
  'pornography',
  'violence',
  'illegal',
  'plagiarism',
  'spam',
  'fraud',
  'other',
] as const;

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetName,
  onClose,
}) => {
  const { t } = useTranslation(['share', 'common']);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    const finalReason = reason === 'other' ? customReason.trim() : t(`report.reasons.${reason}`);
    if (!finalReason) {
      setError(t('report.reasonRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createReport({
        target_type: targetType,
        target_id: targetId,
        reason: finalReason,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.message?.includes('已举报') || err.message?.includes('already reported')) {
        setError(t('report.alreadyReported'));
      } else {
        setError(err.message || t('report.submitFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-8">
            <p className="text-gray-600">{t('report.authRequired')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('report.submitSuccess')}</h3>
            <p className="text-gray-500 text-sm">{t('report.thankYou')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('report.title')}</h2>
            {targetName && (
              <p className="text-sm text-gray-500 truncate max-w-[260px]">{targetName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {REPORT_REASON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setReason(key)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors w-full text-left ${
                reason === key ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                reason === key ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {reason === key && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="text-sm text-gray-700">{t(`report.reasons.${key}`)}</span>
            </button>
          ))}
        </div>

        {reason === 'other' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder={t('report.placeholder')}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            rows={3}
          />
        )}

        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !reason || (reason === 'other' && !customReason.trim())}
          className="w-full py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? t('common:buttons.submitting') : t('common:buttons.submit')}
        </button>
      </div>
    </div>
  );
};
