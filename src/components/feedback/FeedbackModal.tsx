// src/components/feedback/FeedbackModal.tsx

import React from "react";
import { X, Bug, Mail, MessageCircle, Github } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { t } = useTranslation('home');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('feedbackModal.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            {t('feedbackModal.intro')}
          </p>

          {/* Contact Options */}
          <div className="space-y-3">
            {/* GitHub */}
            <a
              href="https://github.com/memoriessting-sys/ai-lowcode/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                <Github className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">GitHub Issues</h3>
                <p className="text-sm text-gray-500">{t('feedbackModal.githubIssues')}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:memoriessting@outlook.com"
              className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Mail className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{t('feedbackModal.emailFeedback')}</h3>
                <p className="text-sm text-gray-500">{t('feedbackModal.emailAddress')}</p>
              </div>
            </a>

            {/* WeChat */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">QQ</h3>
                <p className="text-sm text-gray-500">
                  3307580388（{t('feedbackModal.qqNote')}）
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {t('feedbackModal.footerMotivation')} 🙏
          </div>
        </div>
      </div>
    </div>
  );
};
