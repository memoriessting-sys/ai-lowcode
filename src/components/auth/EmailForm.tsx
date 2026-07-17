// src/components/auth/EmailForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type Step = 'email' | 'verify' | 'password' | 'forgot' | 'forgotVerify' | 'resetPassword';

export const EmailForm: React.FC = () => {
  const { t } = useTranslation('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 重发验证码（注册流程中重发）
  const resendVerifyCode = async () => {
    setError(null);
    setLoading(true);

    // 使用 resend 来重发 signUp 的确认邮件
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Too Many Requests') || error.status === 429) {
        setCountdown(60);
        setError(t('errors.rateLimit'));
      } else {
        setError(t('errors.resendFailed'));
      }
    } else {
      setCountdown(60);
      setSuccess(t('errors.codeSent'));
    }
  };

  // 发送验证码
  const sendVerifyCode = async () => {
    setError(null);

    if (!email) {
      setError(t('errors.emailRequired'));
      return;
    }

    setLoading(true);

    // 注册流程：先用 signUp 创建用户（Supabase 会发送确认邮件/OTP）
    // signUp 会正确设置 email_confirmed_at，确保后续 signInWithPassword 可用
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'TempPass_' + Date.now() + '_Aa1', // 临时密码，验证后会被更新
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Too Many Requests') || error.status === 429) {
        setCountdown(60);
        setError(t('errors.rateLimit'));
      } else if (error.message.includes('Invalid email')) {
        setError(t('errors.emailInvalid'));
      } else if (error.message.includes('already registered')) {
        // 邮箱已注册，提示用户去登录
        setError(t('errors.emailRegistered'));
      } else {
        setError(t('errors.codeSendFailed'));
      }
    } else if (data.user && !data.session) {
      // Supabase 开启了 "Confirm email"，用户需要验证邮箱
      // Supabase 会自动发送确认邮件（包含 OTP 或链接）
      setStep('verify');
      setCountdown(60);
      setSuccess(t('errors.codeSent'));
    } else if (data.session) {
      // Supabase 未开启 "Confirm email"，用户已自动登录
      // 直接进入设置密码步骤
      setStep('password');
      setSuccess(t('errors.codeVerified'));
    } else {
      setError(t('errors.registerError'));
    }
  };

  // 验证验证码
  const verifyCodeHandler = async () => {
    setError(null);

    if (!verifyCode) {
      setError(t('errors.codeRequired'));
      return;
    }

    setLoading(true);

    // Supabase OTP 验证（signUp 发送的确认邮件中的 OTP）
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: verifyCode,
      type: 'signup', // signUp 发送的 OTP 类型是 'signup'
    });

    setLoading(false);

    if (error) {
      // 人性化错误提示
      if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
        setError(t('errors.codeInvalid'));
      } else {
        setError(t('errors.verifyFailed'));
      }
    } else if (data.session) {
      // OTP 验证成功，Supabase 已设置 email_confirmed_at
      setStep('password');
      setSuccess(t('errors.codeVerified'));
    } else {
      setError(t('errors.noSession'));
    }
  };

  // 设置密码完成注册
  const setPasswordHandler = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLower || !hasUpper || !hasNumber) {
      setError(t('errors.passwordComplexity'));
      return;
    }

    setLoading(true);

    // 更新用户密码
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      // 人性化错误提示
      if (error.message.includes('Invalid login credentials')) {
        setError(t('errors.sessionExpired'));
      } else if (error.message.includes('same password') || error.message.includes('Password should be different')) {
        setError(t('errors.samePassword'));
      } else {
        setError(t('errors.setPasswordFailed'));
      }
    } else {
      setSuccess(t('errors.registerSuccess'));
      // 使用 signInWithEmail 用新密码建立正式 session，而不是依赖 OTP 临时 session
      const loginResult = await signInWithEmail(email, password);
      if (loginResult.error) {
        // 如果自动登录失败，刷新页面让用户手动登录
        window.location.href = '/';
      } else {
        // 登录成功，刷新页面
        window.location.reload();
      }
    }
  };

  // 登录提交
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.error) {
      // 人性化错误提示
      if (result.error.includes('Invalid login credentials')) {
        setError(t('errors.wrongCredentials'));
      } else if (result.error.includes('Email not confirmed')) {
        setError(t('errors.emailUnverified'));
      } else {
        setError(t('errors.loginFailed'));
      }
    }
  };

  // 返回上一步
  const goBack = () => {
    setStep('email');
    setVerifyCode('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  // 忘记密码 - 发送验证码
  const handleForgotSendCode = async () => {
    setError(null);

    if (!email) {
      setError(t('errors.emailRequired'));
      return;
    }

    setLoading(true);
    // 使用 signInWithOtp 发送6位验证码到邮箱
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Too Many Requests') || error.status === 429) {
        setCountdown(60);
        setError(t('errors.rateLimit'));
      } else if (error.message.includes('Invalid email')) {
        setError(t('errors.emailInvalid'));
      } else if (error.message.includes('not found') || error.message.includes('not registered') || error.message.includes('Signup')) {
        setError(t('errors.emailNotRegistered'));
      } else {
        setError(t('errors.codeSendFailed'));
      }
    } else {
      setStep('forgotVerify');
      setCountdown(60);
      setSuccess(t('errors.codeSent'));
    }
  };

  // 忘记密码 - 验证验证码
  const handleForgotVerify = async () => {
    setError(null);

    if (!verifyCode) {
      setError(t('errors.codeRequired'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: verifyCode,
      type: 'magiclink', // signInWithOtp 发送的 OTP 类型是 'magiclink'
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
        setError(t('errors.codeInvalid'));
      } else {
        setError(t('errors.verifyFailed'));
      }
    } else if (data.session) {
      setStep('resetPassword');
      setSuccess(t('errors.codeVerifiedReset'));
    } else {
      setError(t('errors.noSession'));
    }
  };

  // 忘记密码 - 设置新密码
  const handleResetPassword = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLower || !hasUpper || !hasNumber) {
      setError(t('errors.passwordComplexity'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('same password') || error.message.includes('Password should be different')) {
        setError(t('errors.samePasswordShort'));
      } else if (error.message.includes('Invalid login credentials')) {
        setError(t('errors.sessionExpiredReset'));
      } else {
        setError(t('errors.setPasswordFailed'));
      }
    } else {
      // 密码重置成功，先登出 OTP 临时 session，然后引导用户重新登录
      try {
        await supabase.auth.signOut();
      } catch {
        // 忽略 signOut 错误
      }
      setSuccess(t('errors.resetSuccess'));
      // 回到登录表单，而不是 reload
      setStep('email');
      setPassword('');
      setConfirmPassword('');
      setVerifyCode('');
    }
  };

  // 切换登录/注册
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setStep('email');
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
    setVerifyCode('');
  };

  // 注册流程
  if (!isLogin) {
    return (
      <div className="space-y-4">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`w-12 h-1 ${step !== 'email' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step === 'verify' ? 'bg-blue-500 text-white' : step === 'password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`w-12 h-1 ${step === 'password' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step === 'password' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
        </div>

        {/* 步骤 1: 输入邮箱 */}
        {step === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email.emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={sendVerifyCode}
              disabled={loading || countdown > 0}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('email.sending') : countdown > 0 ? t('email.waitResend', { count: countdown }) : t('email.sendCode')}
            </button>
          </>
        )}

        {/* 步骤 2: 输入验证码 */}
        {step === 'verify' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email.codeLabel')}
              </label>
              <p className="text-xs text-gray-500 mb-2">{t('email.codeSentTo', { email })}</p>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="button"
              onClick={verifyCodeHandler}
              disabled={loading || verifyCode.length !== 6}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('email.verifying') : t('email.verify')}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('email.back')}
              </button>
              <button
                type="button"
                onClick={resendVerifyCode}
                disabled={loading || countdown > 0}
                className="px-4 py-3 text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
              >
                {countdown > 0 ? `${countdown}s` : t('email.resend')}
              </button>
            </div>
          </>
        )}

        {/* 步骤 3: 设置密码 */}
        {step === 'password' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email.passwordLabel')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('email.passwordMinPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('email.confirmPasswordPlaceholder')}
              />
            </div>

            <p className="text-xs text-gray-500">
              {t('email.passwordHint')}
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="button"
              onClick={setPasswordHandler}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('email.processing') : t('email.register')}
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-600">
          {t('email.hasAccount')}
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-500 hover:underline ml-1"
          >
            {t('email.loginBtn')}
          </button>
        </p>
      </div>
    );
  }

  // 登录表单 - 忘记密码步骤1: 输入邮箱
  if (isLogin && step === 'forgot') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{t('email.forgotHint')}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email.emailLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleForgotSendCode}
          disabled={loading || countdown > 0}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('email.sending') : countdown > 0 ? t('email.waitResend', { count: countdown }) : t('email.sendCode')}
        </button>

        <button
          type="button"
          onClick={() => { setStep('email'); setError(null); setSuccess(null); }}
          className="text-blue-500 hover:underline text-sm"
        >
          {t('email.backToLogin')}
        </button>
      </div>
    );
  }

  // 登录表单 - 忘记密码步骤2: 输入验证码
  if (isLogin && step === 'forgotVerify') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-500 mb-2">{t('email.codeSentTo', { email })}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email.codeLabel')}
          </label>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="button"
          onClick={handleForgotVerify}
          disabled={loading || verifyCode.length !== 6}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('email.verifying') : t('email.verify')}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setStep('forgot'); setVerifyCode(''); setError(null); setSuccess(null); }}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('email.back')}
          </button>
          <button
            type="button"
            onClick={handleForgotSendCode}
            disabled={loading || countdown > 0}
            className="px-4 py-3 text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
          >
            {countdown > 0 ? `${countdown}s` : t('email.resend')}
          </button>
        </div>
      </div>
    );
  }

  // 登录表单 - 忘记密码步骤3: 设置新密码
  if (isLogin && step === 'resetPassword') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email.newPasswordLabel')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('email.passwordMinPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email.confirmPasswordLabel')}
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('email.confirmPasswordPlaceholder')}
          />
        </div>

        <p className="text-xs text-gray-500">
          {t('email.passwordHint')}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('email.processing') : t('email.resetPassword')}
        </button>
      </div>
    );
  }

  // 登录表单
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('email.emailLabel')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email.passwordLabel')}
          </label>
          <button
            type="button"
            onClick={() => { setStep('forgot'); setError(null); setSuccess(null); }}
            className="text-sm text-blue-500 hover:underline"
          >
            {t('email.forgotPassword')}
          </button>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('email.passwordPlaceholder')}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? t('email.loggingIn') : t('email.loginBtn')}
      </button>

      <p className="text-center text-sm text-gray-600">
        {t('email.noAccount')}
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-500 hover:underline ml-1"
        >
          {t('email.signUp')}
        </button>
      </p>
    </form>
  );
};
