'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { useToast } from '../../../../components/hk/common/Toast';
import apiClient from '../../../../lib/api-client';
import { logError } from '../../../../utils/logger';
import { useApiError } from '../../../../hooks/common/useApiError';
import { useFormValidation, emailPattern } from '../../../../hooks/common/useFormValidation';
import { getStringParam } from '../../../../utils/typeGuards';

/**
 * 회원가입 페이지 컨텐츠 컴포넌트
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
function SignupPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.auth.signup');
  const { showToast } = useToast();
  const { error, handleError, clearError } = useApiError();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [allAgree, setAllAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [serviceAgree, setServiceAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    errors,
    validateForm,
    setFieldTouched,
    clearErrors: clearValidationErrors,
  } = useFormValidation<{ username: string; email: string; password: string; confirmPassword: string }>({
    username: { required: true, minLength: 3, message: t('validation.usernameMinLength') },
    email: { required: true, pattern: emailPattern, message: t('validation.emailInvalid') },
    password: { required: true, minLength: 8, message: t('validation.passwordMinLength') },
    confirmPassword: {
      required: true,
      custom: (value) => {
        if (value !== password) {
          return t('validation.confirmPasswordMismatch');
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    if (allAgree) {
      setPrivacyAgree(true);
      setServiceAgree(true);
    }
  }, [allAgree]);

  useEffect(() => {
    if (privacyAgree && serviceAgree) {
      setAllAgree(true);
    } else {
      setAllAgree(false);
    }
  }, [privacyAgree, serviceAgree]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    clearValidationErrors();

    const isValid = validateForm({
      username,
      email,
      password,
      confirmPassword,
    });

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast('error', firstError);
      }
      return;
    }

    if (!privacyAgree || !serviceAgree) {
      showToast('error', t('termsRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.auth.signup({
        username,
        email,
        password,
        confirm_password: confirmPassword,
        first_name: '',
        last_name: ''
      });

      if (response.access_token) {
        showToast('success', t('success'));
        setTimeout(() => {
          router.push(`/${locale}/hk/login`);
        }, 1500);
      } else {
        showToast('error', t('error'));
      }
    } catch (err) {
      logError('회원가입 오류', err, 'SignupPage');
      handleError(err);
      showToast('error', error || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !username || !email || !password || !confirmPassword || 
    password !== confirmPassword || !privacyAgree || !serviceAgree;

  return (
    <div className="min-h-screen flex justify-center items-center p-5 bg-slate-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl p-8 md:p-10 shadow-md">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/${locale}/hk/login`}
            className="text-slate-600 hover:text-slate-800 no-underline"
          >
            {t('goBack')}
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex-1 text-center">{t('title')}</h1>
          <div className="w-[60px]" aria-hidden />
        </div>

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
              {errors.email && (
                <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                  {errors.email}
                </div>
              )}
              {errors.password && (
                <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                  {errors.password}
                </div>
              )}
              {errors.confirmPassword && (
                <div className="py-3 px-4 rounded-xl mb-2.5 font-medium bg-red-100 text-red-800 border border-red-200">
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          )}

          <div className="mb-6 flex items-center gap-5">
            <label className="text-slate-800 font-medium min-w-[100px] md:min-w-[120px]" htmlFor="username">
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
              className="flex-1 py-2.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="mb-6 flex items-center gap-5">
            <label className="text-slate-800 font-medium min-w-[100px] md:min-w-[120px]" htmlFor="email">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setFieldTouched('email', true);
              }}
              onBlur={() => setFieldTouched('email', true)}
              className="flex-1 py-2.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="mb-6 flex items-center gap-5">
            <label className="text-slate-800 font-medium min-w-[100px] md:min-w-[120px]" htmlFor="password">
              {t('passwordLabel')}
            </label>
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setFieldTouched('password', true);
                }}
                onBlur={() => setFieldTouched('password', true)}
                className="w-full py-2.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-sky-400 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-5">
            <label className="text-slate-800 font-medium min-w-[100px] md:min-w-[120px]" htmlFor="confirm_password">
              {t('confirmPasswordLabel')}
            </label>
            <div className="flex-1 relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setFieldTouched('confirmPassword', true);
                }}
                onBlur={() => setFieldTouched('confirmPassword', true)}
                className="w-full py-2.5 border-0 border-b-2 border-slate-200 bg-transparent text-slate-800 focus:outline-none focus:border-sky-400 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {passwordMatch !== null && (
              <p
                className={`mt-1.5 text-xs font-medium ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}
              >
                {passwordMatch ? t('passwordMatch') : t('passwordNoMatch')}
              </p>
            )}
          </div>

          <div className="my-5 p-4 bg-slate-50 rounded-xl">
            <div className="font-semibold text-slate-800 mb-2.5">{t('termsTitle')}</div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="all_agree"
                checked={allAgree}
                onChange={(e) => setAllAgree(e.target.checked)}
                className="w-4 h-4 accent-sky-500"
                required
              />
              <label htmlFor="all_agree" className="text-sm text-slate-600 flex-1">{t('allAgree')}</label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="privacy_agree"
                checked={privacyAgree}
                onChange={(e) => setPrivacyAgree(e.target.checked)}
                className="w-4 h-4 accent-sky-500"
                required
              />
              <label htmlFor="privacy_agree" className="text-sm text-slate-600 flex-1">{t('privacyAgree')}</label>
              <Link href={`/${locale}/hk/privacy`} className="text-sky-600 text-xs hover:underline">
                {t('viewDetails')}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="service_agree"
                checked={serviceAgree}
                onChange={(e) => setServiceAgree(e.target.checked)}
                className="w-4 h-4 accent-sky-500"
                required
              />
              <label htmlFor="service_agree" className="text-sm text-slate-600 flex-1">{t('serviceAgree')}</label>
              <Link href="#" className="text-sky-600 text-xs hover:underline">
                {t('viewDetails')}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-white text-slate-800 border-2 border-sky-400 rounded-2xl font-semibold hover:bg-sky-400 hover:text-white transition disabled:bg-slate-300 disabled:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 mt-5"
            disabled={isSubmitDisabled || loading}
          >
            {loading ? t('buttonLoading') : t('button')}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * 회원가입 페이지 (Wrapper)
 * HKLayout을 제공하여 ToastProvider 사용 가능하도록 함
 */
export default function SignupPage() {
  return (
    <HKLayout>
      <SignupPageContent />
    </HKLayout>
  );
}

