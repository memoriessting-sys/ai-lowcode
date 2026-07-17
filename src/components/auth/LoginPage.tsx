// src/components/auth/LoginPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { OAuthButtons } from './OAuthButtons';
import { EmailForm } from './EmailForm';
import { useAuthStore } from '../../store/authStore';
import { trackStep, UserStep, identifyGuest } from '../../lib/posthog';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);

  const handleGuestLogin = () => {
    trackStep(UserStep.CLICK_GUEST);
    continueAsGuest();

    // 识别游客
    const guestData = localStorage.getItem('ai-lowcode-guest');
    if (guestData) {
      const { guestId } = JSON.parse(guestData);
      if (guestId) {
        identifyGuest(guestId);
        trackStep(UserStep.GUEST_ENTER);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('loginPage.title')}</h1>
          <p className="mt-2 text-gray-600">{t('loginPage.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* OAuth Buttons */}
          <OAuthButtons />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('loginPage.orEmail')}</span>
            </div>
          </div>

          {/* Email Form */}
          <EmailForm />
        </div>

        {/* Guest Entry */}
        <div className="mt-6 text-center">
          <button
            onClick={handleGuestLogin}
            className="text-gray-600 hover:text-gray-900 text-sm underline"
          >
            {t('common:auth.guest')}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            {t('common:auth.guestLimit')}
          </p>
        </div>
      </div>
    </div>
  );
};
