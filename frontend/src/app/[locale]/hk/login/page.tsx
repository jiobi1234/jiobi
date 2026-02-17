'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { useToast } from '../../../../components/hk/common/Toast';
import apiClient from '../../../../lib/api-client';
import { logError } from '../../../../utils/logger';
import { useApiError } from '../../../../hooks/common/useApiError';
import { useFormValidation } from '../../../../hooks/common/useFormValidation';
import HKBackButton from '../../../../components/hk/common/HKBackButton';
import { getStringParam } from '../../../../utils/typeGuards';
import '../../../../styles/hk/login.css';

/**
 * 로그인 페이지 컨텐츠 컴포넌트
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
function LoginPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.auth.login');
  const { showToast } = useToast();
  const { error, handleError, clearError } = useApiError();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        setTimeout(() => {
          router.push(`/${locale}/hk`);
        }, 1000);
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
    showToast('info', t('googleComingSoon'));
  };

  return (
    <>
      <div className="hk-login-container">
        <div className="hk-login-image-section">
          <HKBackButton />
        </div>

        <div className="hk-login-form-section">
          <div className="hk-login-form-container">
            <div className="hk-login-logo">JIOBI</div>
            
            <form onSubmit={handleSubmit}>
              {(error || Object.keys(errors).length > 0) && (
                <div className="hk-login-messages">
                  {error && <div className="hk-login-alert hk-login-alert-error">{error}</div>}
                  {errors.username && <div className="hk-login-alert hk-login-alert-error">{errors.username}</div>}
                  {errors.password && <div className="hk-login-alert hk-login-alert-error">{errors.password}</div>}
                </div>
              )}
              
              <div className="hk-login-form-group">
                <label className="hk-login-form-label" htmlFor="username">{t('usernameLabel')}</label>
                <input 
                  type="text" 
                  className="hk-login-form-input" 
                  id="username" 
                  name="username" 
                  placeholder={t('usernamePlaceholder')} 
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) {
                      setFieldTouched('username', true);
                    }
                  }}
                  onBlur={() => setFieldTouched('username', true)}
                  required 
                />
              </div>
              
              <div className="hk-login-form-group">
                <label className="hk-login-form-label" htmlFor="password">{t('passwordLabel')}</label>
                <input 
                  type="password" 
                  className="hk-login-form-input" 
                  id="password" 
                  name="password" 
                  placeholder={t('passwordPlaceholder')} 
                  autoComplete="current-password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setFieldTouched('password', true);
                    }
                  }}
                  onBlur={() => setFieldTouched('password', true)}
                  required 
                />
              </div>
              
              <button type="submit" className="hk-login-button" disabled={loading}>
                {loading ? t('buttonLoading') : t('button')}
              </button>
            </form>
            
            <div className="hk-login-signup-link">
              <Link href={`/${locale}/hk/signup`}>{t('signupLink')}</Link>
            </div>
            
            <button className="hk-login-google-button" onClick={handleGoogleLogin}>
              <div className="hk-login-google-icon">G</div>
              {t('googleButton')}
            </button>
          </div>
        </div>
      </div>
    </>
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

