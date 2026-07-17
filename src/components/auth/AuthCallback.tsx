// src/components/auth/AuthCallback.tsx

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export const AuthCallback: React.FC = () => {
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(t('callback.processing'));
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus(t('callback.handlingAuth'));

        // 先从 URL hash 中解析 token（在清除 URL 之前）
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          setStatus(t('callback.settingSession'));
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            setError(sessionError.message);
            return;
          }
        }

        // 清除 URL 中的敏感信息
        window.history.replaceState({}, document.title, window.location.origin + '/');

        setStatus(t('callback.fetchingProfile'));

        // 获取用户信息
        const { error: userError } = await supabase.auth.getUser();

        if (userError) {
          setError(userError.message);
          return;
        }

        setStatus(t('callback.loadingUser'));
        await fetchProfile();

        setStatus(t('callback.loginSuccess'));
        // 跳转到主页（使用 replace 避免回退到回调页）
        window.location.replace('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('callback.unknownError'));
      }
    };

    handleCallback();
  }, [fetchProfile, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <p className="text-red-600 mb-4">{t('callback.loginFailed')} {error}</p>
          <a href="/" className="text-blue-500 hover:underline">
            {t('callback.backHome')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};