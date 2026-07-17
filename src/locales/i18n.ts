import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonZh from './zh/common.json';
import commonEn from './en/common.json';
import editorZh from './zh/editor.json';
import editorEn from './en/editor.json';
import authZh from './zh/auth.json';
import authEn from './en/auth.json';
import homeZh from './zh/home.json';
import homeEn from './en/home.json';
import shareZh from './zh/share.json';
import shareEn from './en/share.json';
import chatZh from './zh/chat.json';
import chatEn from './en/chat.json';
import aiZh from './zh/ai.json';
import aiEn from './en/ai.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: commonZh,
        editor: editorZh,
        auth: authZh,
        home: homeZh,
        share: shareZh,
        chat: chatZh,
        ai: aiZh,
      },
      en: {
        common: commonEn,
        editor: editorEn,
        auth: authEn,
        home: homeEn,
        share: shareEn,
        chat: chatEn,
        ai: aiEn,
      },
    },
    fallbackLng: 'zh',
    ns: ['common', 'editor', 'auth', 'home', 'share', 'chat', 'ai'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
