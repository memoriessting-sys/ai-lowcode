// src/components/layout/Navbar.tsx

import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  History,
  LogOut,
  ChevronDown,
  Heart,
  MessageCircle,
  Globe,
  FileText,
  Megaphone,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

// 编辑器类型
export type EditorType = "web" | "general";

// 全局编辑器类型状态
export let currentEditorType: EditorType = "general";

export const setEditorType = (type: EditorType) => {
  currentEditorType = type;
  window.dispatchEvent(new CustomEvent("editor-type-change", { detail: type }));
};

export const getEditorType = () => currentEditorType;

interface NavbarProps {
  onShowLogin: () => void;
}

export function Navbar({ onShowLogin }: NavbarProps) {
  const { user, profile, isGuest, signOut } = useAuthStore();
  const { t } = useTranslation('common');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editorDropdownOpen, setEditorDropdownOpen] = useState(false);
  const [editorType, setEditorTypeState] = useState<EditorType>("general");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 获取 URL 参数
  const searchParams = new URLSearchParams(location.search);
  const urlEditorType = searchParams.get("type") as EditorType | null;

  // 从 URL 同步编辑器类型
  useEffect(() => {
    if (urlEditorType === "web" || urlEditorType === "general") {
      setEditorTypeState(urlEditorType);
      currentEditorType = urlEditorType;
    }
  }, [urlEditorType]);

  const isHome = location.pathname === "/" && !searchParams.get("view");
  const isTemplates = location.pathname === "/templates";
  const isEditor =
    location.pathname === "/" && searchParams.get("view") === "editor";
  const isHistory = location.pathname === "/history";

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        editorDropdownRef.current &&
        !editorDropdownRef.current.contains(event.target as Node)
      ) {
        setEditorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 切换编辑器类型（保留函数供将来使用）
  const handleEditorTypeChange = (type: EditorType) => {
    setEditorTypeState(type);
    currentEditorType = type;
    setEditorDropdownOpen(false);
    window.dispatchEvent(
      new CustomEvent("editor-type-change", { detail: type }),
    );
  };

  // 防止未使用警告
  void handleEditorTypeChange;

  // 进入编辑器
  const handleEnterEditor = (type: EditorType) => {
    setEditorTypeState(type);
    currentEditorType = type;
    navigate(`/?view=editor&type=${type}`);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo1.png" alt={t('nav.logoAlt', '灵页LingYe')} className="h-40" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isHome
                  ? "text-blue-500 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/templates"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isTemplates
                  ? "text-blue-500 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t('nav.templates')}
            </Link>

            {/* 自定义下拉菜单 */}
            <div className="relative" ref={editorDropdownRef}>
              <button
                onClick={() => setEditorDropdownOpen(!editorDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isEditor
                    ? "text-blue-500 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t('nav.custom')}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${editorDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {editorDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button
                    onClick={() => handleEnterEditor("web")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:bg-gray-50 ${
                      editorType === "web"
                        ? "text-blue-500 bg-blue-50"
                        : "text-gray-700"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{t('nav.webEditor')}</div>
                      <div className="text-xs text-gray-400">{t('nav.exportHtml')}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleEnterEditor("general")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:bg-gray-50 ${
                      editorType === "general"
                        ? "text-blue-500 bg-blue-50"
                        : "text-gray-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{t('nav.generalEditor')}</div>
                      <div className="text-xs text-gray-400">{t('nav.exportPdf')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/history"
              onClick={(e) => {
                if (!user || isGuest) {
                  e.preventDefault();
                  onShowLogin();
                }
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isHistory
                  ? "text-blue-500 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t('nav.history')}
            </Link>
          </nav>

          {/* Right Area: Donate, Feedback, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Donate Button */}
            <Link
              to="/announcements"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              {t('nav.announcements')}
            </Link>
            <Link
              to="/donate"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.donate')}</span>
            </Link>

            {/* Feedback Button */}
            <Link
              to="/feedback"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.feedback')}</span>
            </Link>

            <LanguageSwitcher />

            {user && !isGuest ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 max-w-[80px] truncate hidden sm:inline">
                    {profile?.display_name || user.email}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <Link
                      to="/history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <History className="w-4 h-4" />
                      {t('nav.history')}
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onShowLogin}
                className="px-3 sm:px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('auth.login')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
