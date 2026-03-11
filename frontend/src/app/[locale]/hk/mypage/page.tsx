'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import apiClient from '../../../../lib/api-client';
import { getStringParam } from '../../../../utils/typeGuards';

export default function MyPage() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.mypage');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = apiClient.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        return;
      }

      // 사용자 정보 가져오기
      try {
        const user = await apiClient.auth.getCurrentUser();
        setUsername(user.username);
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        // 토큰이 만료되었을 수 있으므로 비로그인 상태로 전환
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [locale, router]);

  const handleLogout = () => {
    apiClient.auth.logout();
    setIsAuthenticated(false);
    router.push(`/${locale}/hk`);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    router.push(`/${lang}/hk/mypage`);
  };

  if (!isAuthenticated) {
    return (
      <HKLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-md flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 m-0">
              {t('loginRequired', { defaultMessage: '로그인이 필요한 기능입니다.' })}
            </h2>
          </div>
        </div>
      </HKLayout>
    );
  }

  return (
    <HKLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="shrink-0 text-slate-500">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 m-0 text-center sm:text-left">
            {username ? `${username}${t('welcome')}` : t('welcome')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
              {t('settingsTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/hk/mypage/edit`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('editAccount')}
              </Link>
              <Link
                href={`/${locale}/hk/privacy`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('privacy')}
              </Link>
              <Link
                href={`/${locale}/hk/wishlist`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('wishlist')}
              </Link>
              <button
                type="button"
                className="text-left text-slate-800 py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition cursor-pointer bg-transparent border-0 w-full"
                onClick={handleLogout}
              >
                {t('logout')}
              </button>
              <Link
                href={`/${locale}/hk/mypage/delete`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('deleteAccount')}
              </Link>
              <div className="flex items-center justify-between pt-2 mt-1">
                <label className="text-slate-800 font-medium">{t('languageSetting')}</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm cursor-pointer hover:border-sky-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-slate-800 font-medium">{t('notificationSetting')}</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationEnabled}
                  className={`w-12 h-7 rounded-full relative cursor-pointer transition ${notificationEnabled ? 'bg-sky-500' : 'bg-slate-300'}`}
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition left-1 ${notificationEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
              {t('emergencyTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/hk/emergency/hospitals`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('nearbyHospitals')}
              </Link>
              <Link
                href={`/${locale}/hk/emergency/embassy`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('embassyInfo')}
              </Link>
              <Link
                href={`/${locale}/hk/emergency/phones`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('emergencyPhones')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
              {t('paymentTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/hk/guide/payment`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('paymentGuide')}
              </Link>
              <Link
                href={`/${locale}/util/exchange-rate`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('exchangeCalculator')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
              {t('supportTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/hk/faq`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('faq')}
              </Link>
              <Link
                href={`/${locale}/hk/contact`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('contact')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">
              {t('tipsTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/hk/guide/transport`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('transportTips')}
              </Link>
              <Link
                href={`/${locale}/hk/tips/restaurant`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('restaurantTips')}
              </Link>
              <Link
                href={`/${locale}/hk/tips/accommodation`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('accommodationTips')}
              </Link>
              <Link
                href={`/${locale}/hk/tips/other`}
                className="text-slate-800 no-underline py-2 border-b border-transparent hover:text-sky-600 hover:border-sky-500 hover:pl-1 transition"
              >
                {t('otherTips')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HKLayout>
  );
}
