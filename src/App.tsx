// src/App.tsx

import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import i18n from "./locales/i18n";
import { Canvas } from "./components/canvas";
import { PropertyPanel, AlignToolbar } from "./components/editor";
import { ChatPanel } from "./components/chat";
import { ElementLibrary } from "./components/library";
import { Navbar } from "./components/layout";
import { useEditorStore } from "./store/editorStore";
import { usePageStore } from "./store/pageStore";
import { useAuthStore } from "./store/authStore";
import { supabase } from "./lib/supabase";
import { initPostHog, trackStep, identifyUser, identifyGuest, UserStep } from "./lib/posthog";

// Lazy-loaded modal and route components (not needed on initial render)
const AuthCallback = lazy(() =>
  import("./components/auth/AuthCallback").then((m) => ({ default: m.AuthCallback }))
);
const ShareView = lazy(() =>
  import("./components/share").then((m) => ({ default: m.ShareView }))
);
const LandingPage = lazy(() =>
  import("./components/home").then((m) => ({ default: m.LandingPage }))
);
const TemplateMarket = lazy(() =>
  import("./components/home").then((m) => ({ default: m.TemplateMarket }))
);
const HistoryPage = lazy(() =>
  import("./components/home").then((m) => ({ default: m.HistoryPage }))
);
const DonatePage = lazy(() =>
  import("./components/home").then((m) => ({ default: m.DonatePage }))
);
const FeedbackPage = lazy(() =>
  import("./components/home").then((m) => ({ default: m.FeedbackPage }))
);
const AnnouncementsPage = lazy(() =>
  import("./components/home").then((m) => ({ default: m.AnnouncementsPage }))
);
const AnnouncementModal = lazy(() =>
  import("./components/home").then((m) => ({ default: m.AnnouncementModal }))
);
const LoginModal = lazy(() =>
  import("./components/home").then((m) => ({ default: m.LoginModal }))
);
const NewPageModal = lazy(() =>
  import("./components/editor").then((m) => ({ default: m.NewPageModal }))
);

const SuspenseFallback = (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="text-white text-sm">{i18n.t('common:status.loading')}</div>
  </div>
);

function AppContent() {
  const { selectedId, selectedIds, duplicateElement, removeElement, elements, page } =
    useEditorStore();
  const { getActivePage, saveCurrentPage } = usePageStore();
  const { loading, fetchProfile, fetchUsage } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 初始化 PostHog
  useEffect(() => {
    initPostHog();
  }, []);

  // 自动保存：当 elements 或 page 变化时保存（跳过从历史记录加载时）
  useEffect(() => {
    // 如果正在从历史记录加载，跳过自动保存
    if (useEditorStore.getState().isLoadingFromHistory) {
      return;
    }
    const timer = setTimeout(() => {
      saveCurrentPage();
    }, 500);
    return () => clearTimeout(timer);
  }, [elements, page, saveCurrentPage]);

  // 初始化认证状态
  useEffect(() => {
    if (location.pathname === '/auth/callback') return;

    let isInitialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' && isInitialized) {
          await fetchProfile();
          await fetchUsage();
          trackStep(UserStep.LOGIN_SUCCESS);
        } else if (event === 'SIGNED_OUT') {
          // signOut 方法已经处理了状态清理，这里只做安全兜底
          // 不设置 loading=true，避免无限 spinner
          const state = useAuthStore.getState();
          if (state.user) {
            useAuthStore.getState().setUser(null);
            useAuthStore.getState().setProfile(null);
            useAuthStore.getState().setUsage(null);
          }
          useAuthStore.getState().setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && isInitialized) {
          // Token 刷新后重新获取 profile
          await fetchProfile();
        }
      }
    );

    fetchProfile().then(() => {
      fetchUsage();
      isInitialized = true;

      const state = useAuthStore.getState();
      if (state.user) {
        identifyUser(state.user.id, {
          email: state.user.email,
          name: state.user.displayName,
        });
      } else if (state.isGuest) {
        const guestData = localStorage.getItem('ai-lowcode-guest');
        if (guestData) {
          const { guestId } = JSON.parse(guestData);
          if (guestId) identifyGuest(guestId);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname, fetchProfile, fetchUsage]);

  // 初始化：加载持久化的页面
  useEffect(() => {
    if (location.pathname === '/auth/callback') return;
    if (location.pathname !== '/') return;

    // 检查是否是从模板加载的（通过 URL 参数判断）
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('from') === 'template') return;

    const activePage = getActivePage();
    if (activePage) {
      useEditorStore.getState().loadSchema(activePage.schema);
    }
  }, [location.pathname, location.search, getActivePage]);

  // 页面卸载前保存当前状态
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentPage();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCurrentPage]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isEditing) return;

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
      if (e.ctrlKey && e.key === "c" && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        selectedIds.forEach((id) => removeElement(id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectedIds, duplicateElement, removeElement]);

  const handleEnterEditor = () => {
    setShowNewPageModal(true);
  };

  const handleEnterTemplates = () => {
    navigate('/templates');
  };

  const handleEnterHistory = () => {
    navigate('/history');
  };

  const handleCreatePage = (options: { orientation: 'landscape' | 'portrait'; name: string }) => {
    // 设置页面尺寸
    const width = options.orientation === 'portrait' ? 794 : 1123; // A4 像素尺寸 (96 DPI)
    const height = options.orientation === 'portrait' ? 1123 : 794;

    useEditorStore.getState().setPage({
      id: `page_${Date.now()}`,
      width,
      height,
      background: '#ffffff',
    });

    // 清空元素
    useEditorStore.getState().clearElements();

    // 设置页面名称
    usePageStore.getState().renamePage(usePageStore.getState().activePageId, options.name);

    // 导航到编辑器
    navigate('/?view=editor');
  };

  // OAuth 回调页面
  if (location.pathname === '/auth/callback') {
    return <Suspense fallback={SuspenseFallback}><AuthCallback /></Suspense>;
  }

  // 分享页面
  const shareMatch = location.pathname.match(/^\/share\/([a-f0-9-]+)/);
  if (shareMatch) {
    return <Suspense fallback={SuspenseFallback}><ShareView shareId={shareMatch[1]} /></Suspense>;
  }

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // 模板市场页面
  if (location.pathname === '/templates') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <TemplateMarket
          onBack={() => navigate('/')}
          onUseTemplate={() => navigate('/?view=editor&type=general&from=template')}
        />
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 历史记录页面
  if (location.pathname === '/history') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <HistoryPage
          onBack={() => navigate('/')}
          onLoadPage={() => navigate('/?view=editor')}
        />
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 打赏页面
  if (location.pathname === '/donate') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <DonatePage />
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 反馈页面
  if (location.pathname === '/feedback') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <FeedbackPage />
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 公告页面
  if (location.pathname === '/announcements') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <AnnouncementsPage />
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 首页 - 根据参数决定显示内容
  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get('view');

  // 编辑器视图
  if (view === 'editor') {
    trackStep(UserStep.VIEW_EDITOR);
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Navbar onShowLogin={() => setShowLoginModal(true)} />
        <AlignToolbar />
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[320px] flex-shrink-0 border-r">
            <ChatPanel />
          </div>

          <div className="flex-1 overflow-hidden">
            <Canvas />
          </div>

          <div className="w-[260px] flex-shrink-0 border-l">
            {selectedId ? <PropertyPanel /> : <ElementLibrary />}
          </div>
        </div>

        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // 首页 Landing Page
  trackStep(UserStep.LANDING_PAGE);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onShowLogin={() => setShowLoginModal(true)} />
      <LandingPage
        onEnterEditor={handleEnterEditor}
        onEnterTemplates={handleEnterTemplates}
        onEnterHistory={handleEnterHistory}
        onShowLogin={() => setShowLoginModal(true)}
      />
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
      {showNewPageModal && (
        <NewPageModal
          onClose={() => setShowNewPageModal(false)}
          onCreate={handleCreatePage}
        />
      )}
      {showNewPageModal && (
        <NewPageModal
          onClose={() => setShowNewPageModal(false)}
          onCreate={handleCreatePage}
        />
      )}
      <Suspense fallback={null}>
        <AnnouncementModal />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
