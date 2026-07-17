// src/components/home/LandingPage.tsx

import { Sparkles, Zap, Download, ChevronDown, FileText, Image, Globe, Layout, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

interface LandingPageProps {
  onEnterEditor: () => void;
  onEnterTemplates: () => void;
  onEnterHistory: () => void;
  onShowLogin: () => void;
}

export function LandingPage({ onEnterEditor, onEnterTemplates, onShowLogin }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const { user, isGuest } = useAuthStore();
  const { t } = useTranslation(['home', 'common']);

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // 用户已登录（非游客）
  const isLoggedIn = user && !isGuest;

  const features = [
    {
      icon: Sparkles,
      title: t('home:landing.features.aiGenerate'),
      description: t('home:landing.features.aiGenerateDesc'),
    },
    {
      icon: Zap,
      title: t('home:landing.features.visualEdit'),
      description: t('home:landing.features.visualEditDesc'),
    },
    {
      icon: Download,
      title: t('home:landing.features.multiExport'),
      description: t('home:landing.features.multiExportDesc'),
    },
  ];

  // 应用场景
  const scenarios = [
    {
      icon: FileText,
      title: t('home:landing.scenarios.resume'),
      description: t('home:landing.scenarios.resumeDesc'),
      color: 'bg-blue-500',
    },
    {
      icon: Image,
      title: t('home:landing.scenarios.poster'),
      description: t('home:landing.scenarios.posterDesc'),
      color: 'bg-purple-500',
    },
    {
      icon: Globe,
      title: t('home:landing.scenarios.webpage'),
      description: t('home:landing.scenarios.webpageDesc'),
      color: 'bg-green-500',
    },
  ];

  // 水滴动画进度 (0-1)
  // 0-0.15: 登录框凝结成水滴（在右侧）
  // 0.15-0.4: 水滴移动到中心并下落
  // 0.4-0.7: 水滴落地渗透，展开成页面
  // 0.7-1: 页面完全展开，显示三步内容
  const dropletProgress = Math.min(scrollY / (heroHeight * 0.8), 1);

  // 三步内容渐显进度（在水滴展开时渐显）
  const stepsShowProgress = Math.min(Math.max((dropletProgress - 0.85) / 0.15, 0), 1);

  // 三步内容渐隐进度（继续滚动时渐隐）
  const stepsFadeStart = heroHeight * 1.3;
  const stepsFadeProgress = Math.min(Math.max((scrollY - stepsFadeStart) / (heroHeight * 0.3), 0), 1);
  const stepsOpacity = Math.max(stepsShowProgress - stepsFadeProgress, 0);

  // 截图旋转进度 - 当产品预览区域滚动到页面中心时开始
  const screenshotsSectionStart = heroHeight * 1.8;
  const screenshotsProgress = Math.min(Math.max((scrollY - screenshotsSectionStart) / (heroHeight * 1.5), 0), 1);

  // 计算水滴位置和形状
  const getDropletStyle = () => {
    const rightX = '75%'; // 右侧位置

    if (dropletProgress < 0.05) {
      // 初始：登录框在右侧正常显示
      return {
        width: '400px',
        height: '380px',
        borderRadius: '16px',
        top: '50%',
        left: rightX,
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        position: 'fixed' as const,
      };
    } else if (dropletProgress < 0.15) {
      // 凝结成水滴（仍在右侧）
      const shrinkProgress = (dropletProgress - 0.05) / 0.1;
      return {
        width: `${400 - shrinkProgress * 350}px`,
        height: `${380 - shrinkProgress * 150}px`,
        borderRadius: `${16 - shrinkProgress * 16}px ${16 - shrinkProgress * 16}px ${16 + shrinkProgress * 34}px ${16 + shrinkProgress * 34}px`,
        top: '50%',
        left: rightX,
        transform: `translate(-50%, -50%) scale(${1 - shrinkProgress * 0.3})`,
        opacity: 1,
        position: 'fixed' as const,
      };
    } else if (dropletProgress < 0.4) {
      // 水滴移动到中心并下落
      const moveProgress = (dropletProgress - 0.15) / 0.25;
      const currentLeft = 75 - moveProgress * 25; // 从75%移动到50%
      const fallOffset = moveProgress * 20; // 下落效果
      return {
        width: '50px',
        height: '70px',
        borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
        top: `calc(50% + ${fallOffset}px)`,
        left: `${currentLeft}%`,
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        position: 'fixed' as const,
      };
    } else if (dropletProgress < 0.7) {
      // 水滴落地渗透效果
      const landProgress = (dropletProgress - 0.4) / 0.3;
      const fallOffset = landProgress < 0.2 ? landProgress * 50 : 10;
      const spreadStart = landProgress > 0.2 ? (landProgress - 0.2) / 0.8 : 0;
      return {
        width: `${50 + spreadStart * 300}px`,
        height: `${70 - spreadStart * 30 + (landProgress < 0.2 ? fallOffset : 10 - spreadStart * 10)}px`,
        borderRadius: spreadStart < 0.5
          ? `${50 - spreadStart * 50}% 50% 50% 50% / ${30 - spreadStart * 30}% 30% 70% 70%`
          : `${25 - spreadStart * 25}%`,
        top: landProgress < 0.2
          ? `calc(50% + ${fallOffset}px)`
          : `calc(50% + ${10 - spreadStart * 10}px)`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        position: 'fixed' as const,
      };
    } else if (dropletProgress < 1) {
      // 水滴渗透成页面（全屏蓝色背景）- 仍在动画中
      const spreadProgress = (dropletProgress - 0.7) / 0.3;
      return {
        width: `${350 + spreadProgress * (window.innerWidth - 350)}px`,
        height: `${40 + spreadProgress * (window.innerHeight - 40)}px`,
        borderRadius: spreadProgress < 0.5 ? `${25 - spreadProgress * 50}%` : '0',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        position: 'fixed' as const,
      };
    } else {
      // 完全展开后，变成全屏页面，跟随滚动
      return {
        width: '100vw',
        height: '100vh',
        borderRadius: '0',
        top: '0',
        left: '0',
        transform: 'none',
        opacity: 1,
        position: 'absolute' as const,
      };
    }
  };

  const dropletStyle = getDropletStyle();

  // 三步动画：渐显
  const getStepOpacity = (delay: number) => {
    if (stepsShowProgress < delay) return 0;
    if (stepsShowProgress < delay + 0.3) return (stepsShowProgress - delay) / 0.3;
    return 1;
  };

  return (
    <div className="relative bg-gray-50">
      {/* ===== 阶段1: Hero + 水滴动画 ===== */}
      <section className="h-screen sticky top-0 overflow-hidden bg-gradient-to-b from-gray-50 to-blue-50">
        {/* 左侧产品介绍 - 固定 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-center px-8 transition-opacity duration-500"
          style={{ opacity: dropletProgress < 0.3 ? 1 : 0 }}
        >
          <div className="text-center lg:text-left max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {t('home:landing.heroTitle')}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('home:landing.heroSubtitle')}
              <span className="text-blue-600 font-medium">{t('home:landing.heroType1')}</span>、
              <span className="text-purple-600 font-medium">{t('home:landing.heroType2')}</span>、
              <span className="text-green-600 font-medium">{t('home:landing.heroType3')}</span>
              {t('home:landing.heroTypeEnd')}
            </p>
            <div className="grid grid-cols-3 gap-6 mt-12">
              {features.map((feature, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center lg:mx-0 mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 水滴/登录框 */}
        <div
          className="bg-gradient-to-b from-blue-400 to-blue-600 transition-all duration-500 ease-out shadow-lg overflow-hidden"
          style={{
            ...dropletStyle,
            zIndex: 20,
          }}
        >
          {/* 登录框内容 - 只在水滴未凝结时显示 */}
          {dropletProgress < 0.05 && (
            <div className="w-full h-full flex flex-col items-center justify-center p-10 text-white">
              {isLoggedIn ? (
                // 已登录用户显示
                <>
                  <h2 className="text-3xl font-bold mb-3">{t('home:landing.startCreating')}</h2>
                  <p className="text-blue-100 mb-8 text-lg">{t('home:landing.startCreatingHint')}</p>
                  <button
                    onClick={onEnterTemplates}
                    className="w-full max-w-xs px-4 py-4 text-base font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors mb-4 flex items-center justify-center gap-2"
                  >
                    <Layout className="w-5 h-5" />
                    {t('home:landing.chooseTemplate')}
                  </button>
                  <button
                    onClick={onEnterEditor}
                    className="w-full max-w-xs px-4 py-4 text-base font-medium text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Palette className="w-5 h-5" />
                    {t('home:landing.customCreate')}
                  </button>
                </>
              ) : (
                // 未登录用户显示
                <>
                  <h2 className="text-3xl font-bold mb-3">{t('home:landing.getStarted')}</h2>
                  <p className="text-blue-100 mb-8 text-lg">{t('home:landing.getStartedHint')}</p>
                  <button
                    onClick={onShowLogin}
                    className="w-full max-w-xs px-4 py-4 text-base font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors mb-4"
                  >
                    {t('home:landing.loginRegister')}
                  </button>
                  <button
                    onClick={onEnterEditor}
                    className="w-full max-w-xs px-4 py-4 text-base font-medium text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {t('home:landing.guestMode')}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 三步内容 - 在水滴展开后显示，flex居中 */}
          {dropletProgress >= 0.85 && (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-8 text-white transition-opacity duration-500"
              style={{ opacity: stepsOpacity }}
            >
              <h2
                className="text-2xl sm:text-3xl font-bold mb-4 transition-opacity duration-500"
                style={{ opacity: getStepOpacity(0) }}
              >
                {t('home:landing.stepsTitle')}
              </h2>
              <p
                className="text-blue-100 mb-8 text-center max-w-2xl transition-opacity duration-500"
                style={{ opacity: getStepOpacity(0.1) }}
              >
                {t('home:landing.stepsSubtitle')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                {[
                  { step: '01', title: t('home:landing.step1'), desc: t('home:landing.step1Desc'), delay: 0.2 },
                  { step: '02', title: t('home:landing.step2'), desc: t('home:landing.step2Desc'), delay: 0.35 },
                  { step: '03', title: t('home:landing.step3'), desc: t('home:landing.step3Desc'), delay: 0.5 },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-500"
                    style={{
                      opacity: getStepOpacity(item.delay),
                      transform: getStepOpacity(item.delay) > 0 ? 'translateY(0)' : 'translateY(20px)',
                    }}
                  >
                    <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-blue-100 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 滚动提示 */}
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
          style={{ opacity: dropletProgress < 0.05 ? 1 : 0 }}
        >
          <ChevronDown className="w-8 h-8 text-gray-400 animate-bounce" />
        </div>
      </section>

      {/* 滚动空间 - 阶段1 */}
      <div className="h-[80vh]" />

      {/* ===== 阶段2: 应用场景 ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {t('home:landing.scenariosTitle')}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t('home:landing.scenariosSubtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 ${scenario.color} rounded-xl flex items-center justify-center mb-6`}>
                  <scenario.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {scenario.title}
                </h3>
                <p className="text-gray-600">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 阶段3: 产品截图（3D旋转） ===== */}
      <section className="h-screen sticky top-0 overflow-hidden bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            {t('home:landing.previewTitle')}
          </h2>

          {/* 截图容器 - 3D 旋转效果 */}
          <div className="relative h-[500px] flex items-center justify-center" style={{ perspective: '1000px' }}>
            {/* 编辑器截图 */}
            <div
              className="absolute w-full max-w-2xl transition-all duration-1000 ease-out"
              style={{
                transform: screenshotsProgress < 0.15
                  ? 'rotateY(-90deg) translateX(-50%) scale(0.8)'
                  : screenshotsProgress < 0.45
                  ? 'rotateY(0deg) translateX(0) scale(1)'
                  : screenshotsProgress < 0.55
                  ? 'rotateY(0deg) translateX(0) scale(1)'
                  : 'rotateY(90deg) translateX(50%) scale(0.8)',
                opacity: screenshotsProgress >= 0.15 && screenshotsProgress < 0.55 ? 1 : 0,
                zIndex: screenshotsProgress >= 0.15 && screenshotsProgress < 0.45 ? 30 : 10,
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                <img src="/bj.png" alt={t('home:landing.editorAlt')} className="rounded-lg w-full" />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold text-gray-800">{t('home:landing.editorTitle')}</h3>
                  <p className="text-gray-600 mt-2">{t('home:landing.editorDesc')}</p>
                </div>
              </div>
            </div>

            {/* 模板市场截图 */}
            <div
              className="absolute w-full max-w-2xl transition-all duration-1000 ease-out"
              style={{
                transform: screenshotsProgress < 0.35
                  ? 'rotateY(90deg) translateX(50%) scale(0.8)'
                  : screenshotsProgress < 0.65
                  ? 'rotateY(0deg) translateX(0) scale(1)'
                  : screenshotsProgress < 0.75
                  ? 'rotateY(0deg) translateX(0) scale(1)'
                  : 'rotateY(-90deg) translateX(-50%) scale(0.8)',
                opacity: screenshotsProgress >= 0.35 && screenshotsProgress < 0.75 ? 1 : 0,
                zIndex: screenshotsProgress >= 0.35 && screenshotsProgress < 0.65 ? 30 : 10,
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                <img src="/mb.png" alt={t('home:landing.marketAlt')} className="rounded-lg w-full" />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold text-gray-800">{t('home:landing.marketTitle')}</h3>
                  <p className="text-gray-600 mt-2">{t('home:landing.marketDesc')}</p>
                </div>
              </div>
            </div>

            {/* 导出效果截图 */}
            <div
              className="absolute w-full max-w-2xl transition-all duration-1000 ease-out"
              style={{
                transform: screenshotsProgress < 0.65
                  ? 'rotateY(-90deg) translateX(-50%) scale(0.8)'
                  : 'rotateY(0deg) translateX(0) scale(1)',
                opacity: screenshotsProgress >= 0.65 ? 1 : 0,
                zIndex: screenshotsProgress >= 0.65 ? 30 : 10,
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                <img src="/save.png" alt={t('home:landing.exportAlt')} className="rounded-lg w-full" />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold text-gray-800">{t('home:landing.exportTitle')}</h3>
                  <p className="text-gray-600 mt-2">{t('home:landing.exportDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 滚动空间 - 阶段3 */}
      <div className="h-screen" />

      </div>
  );
}
