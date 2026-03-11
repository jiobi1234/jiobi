'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { useToast } from '../../../../components/hk/common/Toast';
import apiClient from '../../../../lib/api-client';
import { API_CONFIG } from '../../../../lib/api-client/config';
import { logError } from '../../../../utils/logger';
import { useApiError } from '../../../../hooks/common/useApiError';
import { useFormValidation } from '../../../../hooks/common/useFormValidation';
import HKBackButton from '../../../../components/hk/common/HKBackButton';
import { getStringParam } from '../../../../utils/typeGuards';

/**
 * 로그인 페이지 컨텐츠 컴포넌트
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
function LoginPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.auth.login');
  const { showToast } = useToast();
  const { error, handleError, clearError } = useApiError();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 로그인 후 돌아갈 경로 (예: 계획 저장 유도 시 /plan/ai?restoreDraft=1)
  const returnUrl = searchParams?.get('returnUrl') ?? null;
  const safeReturnUrl = returnUrl && returnUrl.startsWith(`/${locale}/hk`) ? returnUrl : null;

  const {
    errors,
    validateForm,
    setFieldTouched,
    clearErrors: clearValidationErrors,
  } = useFormValidation<{ username: string; password: string }>({
    username: { required: true, message: t('validation.usernameRequired') },
    password: { required: true, minLength: 1, message: t('validation.passwordRequired') },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    clearValidationErrors();

    const isValid = validateForm({ username, password });
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast('error', firstError);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.auth.login({
        username,
        password,
        remember_me: false
      });

      if (response.access_token) {
        showToast('success', t('success'));
        // 토큰 반영 후 목적지로 이동. router.push는 클라이언트 네비게이션 시 인증 상태가 반영되지 않아
        // 다시 로그인 페이지로 튕기는 현상이 있을 수 있으므로, 전체 이동으로 확실히 처리
        const destination = safeReturnUrl ?? `/${locale}/hk`;
        setTimeout(() => {
          window.location.href = destination;
        }, 800);
      } else {
        showToast('error', t('error'));
      }
    } catch (err) {
      logError('로그인 오류', err, 'LoginPage');
      handleError(err);
      showToast('error', error || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const destination = safeReturnUrl ?? `/${locale}/hk`;
    // 백엔드 Google OAuth 엔드포인트로 이동 (완료 후 destination으로 리다이렉트)
    // - 개발: http://localhost:8000/api/v1/auth/...
    // - 운영: http://jiobi.kr/api/v1/auth/...
    const loginUrl = `${API_CONFIG.baseURL}/api/v1/auth/google/login?next=${encodeURIComponent(
      destination
    )}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div
        className="hidden min-[481px]:flex flex-[0_0_60%] min-[481px]:max-md:flex-[0_0_40%] md:flex-[0_0_60%] bg-cover bg-center items-start p-5"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')",
        }}
      >
        <HKBackButton />
      </div>

      <div className="flex flex-1 flex-col justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 sm:p-10">
          <div className="text-3xl font-bold text-slate-800 text-center mb-8">JIOBI</div>

          <form onSubmit={handleSubmit}>
            {(error || Object.keys(errors).length > 0) && (
              <div className="mb-5">
                {error && (
                  <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                    {error}
                  </div>
                )}
                {errors.username && (
                  <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                    {errors.username}
                  </div>
                )}
                {errors.password && (
                  <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                    {errors.password}
                  </div>
                )}
              </div>
            )}

            <div className="mb-6 flex items-center gap-4">
              <label className="text-slate-800 font-medium min-w-[80px]" htmlFor="username">
                {t('usernameLabel')}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder={t('usernamePlaceholder')}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setFieldTouched('username', true);
                }}
                onBlur={() => setFieldTouched('username', true)}
                className="flex-1 py-3.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-slate-800"
                required
              />
            </div>

            <div className="mb-6 flex items-center gap-4">
              <label className="text-slate-800 font-medium min-w-[80px]" htmlFor="password">
                {t('passwordLabel')}
              </label>
              <div className="flex-1 relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setFieldTouched('password', true);
                  }}
                  onBlur={() => setFieldTouched('password', true)}
                  className="w-full py-3.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-slate-800 pr-20"
                  required
                />
                <button
                  type="button"
                  className="absolute right-0 py-1.5 pl-2.5 text-slate-500 text-sm hover:text-slate-900"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-white text-slate-800 border border-slate-800 rounded-xl font-medium hover:bg-slate-800 hover:text-white transition mb-5 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('buttonLoading') : t('button')}
            </button>
          </form>

          <div className="text-center mb-8">
            <Link
              href={`/${locale}/hk/signup`}
              className="text-slate-800 no-underline hover:underline"
            >
              {t('signupLink')}
            </Link>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white text-slate-800 border-0 rounded-xl font-medium flex items-center justify-center gap-2.5 hover:bg-slate-100 transition"
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
              G
            </span>
            {t('googleButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 로그인 페이지 (Wrapper)
 * HKLayout을 제공하여 ToastProvider 사용 가능하도록 함
 */
export default function LoginPage() {
  return (
    <HKLayout>
      <LoginPageContent />
    </HKLayout>
  );
}

