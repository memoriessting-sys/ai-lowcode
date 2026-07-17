// src/components/home/FeedbackPage.tsx

import { ArrowLeft, Bug, MessageCircle, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export function FeedbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-500" />
            <h1 className="text-xl font-semibold text-gray-800">{t('feedback.title')}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600 mb-8 text-center">
            {t('feedback.intro')}
          </p>

          {/* Contact Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* GitHub */}
            <a
              href="https://github.com/memoriessting-sys/ai-lowcode/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                <Github className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-800">GitHub Issues</p>
                <p className="text-sm text-gray-500">{t('feedback.submitIssue')}</p>
              </div>
            </a>

            {/* Email */}
            {/* <a
              href="mailto:contact@example.com"
              className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Mail className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-800">邮件联系</p>
                <p className="text-sm text-gray-500">发送邮件反馈</p>
              </div>
            </a> */}

            {/* WeChat */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{t('feedback.qqGroup')}</p>
                <p className="text-sm text-gray-500">222603016</p>
              </div>
            </div>

            {/* Bug Report */}
            <a
              href="https://github.com/memoriessting-sys/ai-lowcode/issues/new?labels=bug"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <Bug className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{t('feedback.reportBug')}</p>
                <p className="text-sm text-gray-500">{t('feedback.reportBugDesc')}</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
