// src/components/home/HomePage.tsx

import { LayoutGrid, Pencil, History, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

interface HomePageProps {
  onSelectEntry: (entry: 'templates' | 'custom' | 'history') => void;
}

export function HomePage({ onSelectEntry }: HomePageProps) {
  const { user, profile, isGuest, signOut } = useAuthStore();
  const { t } = useTranslation('home');

  const entries = [
    {
      id: 'templates' as const,
      icon: LayoutGrid,
      title: t('homePage.entries.templates.title'),
      description: t('homePage.entries.templates.description'),
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      id: 'custom' as const,
      icon: Pencil,
      title: t('homePage.entries.custom.title'),
      description: t('homePage.entries.custom.description'),
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      id: 'history' as const,
      icon: History,
      title: t('homePage.entries.history.title'),
      description: t('homePage.entries.history.description'),
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">{t('homePage.logoChar')}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('homePage.brandName')}</h1>
        </div>

        <div className="flex items-center gap-4">
          {user && !isGuest ? (
            <>
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="text-gray-700">
                  {profile?.display_name || user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('homePage.logout')}
              </button>
            </>
          ) : (
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('homePage.exitGuestMode')}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {t('homePage.welcomeTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('homePage.welcomeSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry.id)}
                className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 text-left"
              >
                <div
                  className={`w-14 h-14 ${entry.color} ${entry.hoverColor} rounded-xl flex items-center justify-center mb-6 transition-colors`}
                >
                  <entry.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                  {entry.title}
                </h3>
                <p className="text-gray-500">{entry.description}</p>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-400 text-sm">
        {t('homePage.footerSlogan')}
      </footer>
    </div>
  );
}