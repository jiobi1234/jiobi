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
import '../../../../styles/hk/signup.css';

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
    <>
      <div className="hk-signup-container">
        <div className="hk-signup-image-section"></div>

        <div className="hk-signup-form-section">
          <div className="hk-signup-form-container">
            <div className="hk-signup-form-header">
              <Link href={`/${locale}/hk/login`} className="hk-signup-back-text">{t('goBack')}</Link>
              <h1 className="hk-signup-form-title">{t('title')}</h1>
              <div></div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {(error || Object.keys(errors).length > 0) && (
                <div className="hk-signup-messages">
                  {error && <div className="hk-signup-alert hk-signup-alert-error">{error}</div>}
                  {errors.username && <div className="hk-signup-alert hk-signup-alert-error">{errors.username}</div>}
                  {errors.email && <div className="hk-signup-alert hk-signup-alert-error">{errors.email}</div>}
                  {errors.password && <div className="hk-signup-alert hk-signup-alert-error">{errors.password}</div>}
                  {errors.confirmPassword && <div className="hk-signup-alert hk-signup-alert-error">{errors.confirmPassword}</div>}
                </div>
              )}
              
              <div className="hk-signup-form-group">
                <label className="hk-signup-form-label" htmlFor="username">{t('usernameLabel')}</label>
                <input 
                  type="text" 
                  className="hk-signup-form-input" 
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
              
              <div className="hk-signup-form-group">
                <label className="hk-signup-form-label" htmlFor="email">{t('emailLabel')}</label>
                <input 
                  type="email" 
                  className="hk-signup-form-input" 
                  id="email" 
                  name="email" 
                  placeholder={t('emailPlaceholder')} 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setFieldTouched('email', true);
                    }
                  }}
                  onBlur={() => setFieldTouched('email', true)}
                  required 
                />
              </div>
              
              <div className="hk-signup-form-group">
                <label className="hk-signup-form-label" htmlFor="password">{t('passwordLabel')}</label>
                <div className="hk-signup-password-input-container">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="hk-signup-form-input" 
                    id="password" 
                    name="password" 
                    placeholder={t('passwordPlaceholder')} 
                    autoComplete="new-password" 
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
                  <button 
                    type="button" 
                    className="hk-signup-password-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              <div className="hk-signup-form-group">
                <label className="hk-signup-form-label" htmlFor="confirm_password">{t('confirmPasswordLabel')}</label>
                <div className="hk-signup-password-input-container">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    className="hk-signup-form-input" 
                    id="confirm_password" 
                    name="confirm_password" 
                    placeholder={t('confirmPasswordPlaceholder')} 
                    autoComplete="new-password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setFieldTouched('confirmPassword', true);
                      }
                    }}
                    onBlur={() => setFieldTouched('confirmPassword', true)}
                    required 
                  />
                  <button 
                    type="button" 
                    className="hk-signup-password-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {passwordMatch !== null && (
                  <div className={`hk-signup-password-match-message ${passwordMatch ? 'match' : 'no-match'}`}>
                    {passwordMatch ? t('passwordMatch') : t('passwordNoMatch')}
                  </div>
                )}
              </div>
              
              <div className="hk-signup-terms-section">
                <div className="hk-signup-terms-title">{t('termsTitle')}</div>
                <div className="hk-signup-terms-item">
                  <input 
                    type="checkbox" 
                    className="hk-signup-terms-checkbox" 
                    id="all_agree" 
                    checked={allAgree}
                    onChange={(e) => setAllAgree(e.target.checked)}
                    required 
                  />
                  <label htmlFor="all_agree" className="hk-signup-terms-text">{t('allAgree')}</label>
                </div>
                <div className="hk-signup-terms-item">
                  <input 
                    type="checkbox" 
                    className="hk-signup-terms-checkbox" 
                    id="privacy_agree" 
                    checked={privacyAgree}
                    onChange={(e) => setPrivacyAgree(e.target.checked)}
                    required 
                  />
                  <label htmlFor="privacy_agree" className="hk-signup-terms-text">{t('privacyAgree')}</label>
                  <Link href={`/${locale}/hk/privacy`} className="hk-signup-terms-link">{t('viewDetails')}</Link>
                </div>
                <div className="hk-signup-terms-item">
                  <input 
                    type="checkbox" 
                    className="hk-signup-terms-checkbox" 
                    id="service_agree" 
                    checked={serviceAgree}
                    onChange={(e) => setServiceAgree(e.target.checked)}
                    required 
                  />
                  <label htmlFor="service_agree" className="hk-signup-terms-text">{t('serviceAgree')}</label>
                  <Link href="#" className="hk-signup-terms-link">{t('viewDetails')}</Link>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="hk-signup-button"
                disabled={isSubmitDisabled || loading}
              >
                {loading ? t('buttonLoading') : t('button')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
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

