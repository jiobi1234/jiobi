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
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md sm:max-w-lg">
        <div className="mb-4 flex items-center gap-2">
          <HKBackButton />
          <span className="text-xs font-medium text-slate-500">로그인</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
              JIOBI TRAVEL
            </div>
            <h1 className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">
              계정으로 로그인
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              맞춤 여행 계획을 저장하고 언제든 다시 불러올 수 있어요.
            </p>
          </div>

          <div className="px-6 py-5 sm:px-7 sm:py-6">
            <form onSubmit={handleSubmit}>
              {(error || Object.keys(errors).length > 0) && (
                <div className="mb-4 space-y-2">
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-800">
                      {error}
                    </div>
                  )}
                  {errors.username && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-800">
                      {errors.username}
                    </div>
                  )}
                  {errors.password && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-800">
                      {errors.password}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700" htmlFor="username">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700" htmlFor="password">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-medium text-slate-500 hover:text-slate-900"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPassword ? '숨기기' : '보기'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-400"
                disabled={loading}
              >
                {loading ? t('buttonLoading') : t('button')}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>아직 계정이 없나요?</span>
              <Link
                href={`/${locale}/hk/signup`}
                className="font-medium text-sky-600 hover:text-sky-700"
              >
                {t('signupLink')}
              </Link>
            </div>

            <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                  G
                </span>
                {t('googleButton')}
              </button>
            </div>
          </div>
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

