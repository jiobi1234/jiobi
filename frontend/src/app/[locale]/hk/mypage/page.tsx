'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import apiClient from '../../../../lib/api-client';
import { getStringParam } from '../../../../utils/typeGuards';
import '../../../../styles/hk/mypage.css';

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
        <div className="hk-mypage-container">
          <div className="hk-mypage-welcome">
            <h2 className="hk-mypage-welcome-text">
              {t('loginRequired', { defaultMessage: '로그인이 필요한 기능입니다.' })}
            </h2>
          </div>
        </div>
      </HKLayout>
    );
  }

  return (
    <HKLayout>
      <div className="hk-mypage-container">
        {/* 환영 섹션 */}
        <div className="hk-mypage-welcome">
          <div className="hk-mypage-avatar">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#666"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#666"/>
            </svg>
          </div>
          <h2 className="hk-mypage-welcome-text">{username ? `${username}${t('welcome')}` : t('welcome')}</h2>
        </div>

        {/* 카드 그리드 */}
        <div className="hk-mypage-cards-grid">
          {/* 설정 카드 */}
          <div className="hk-mypage-card">
            <h3 className="hk-mypage-card-title">{t('settingsTitle')}</h3>
            <div className="hk-mypage-card-content">
              <Link href={`/${locale}/hk/mypage/edit`} className="hk-mypage-card-link">
                {t('editAccount')}
              </Link>
              <Link href={`/${locale}/hk/privacy`} className="hk-mypage-card-link">
                {t('privacy')}
              </Link>
              <Link href={`/${locale}/hk/wishlist`} className="hk-mypage-card-link">
                {t('wishlist')}
              </Link>
              <div className="hk-mypage-card-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                {t('logout')}
              </div>
              <Link href={`/${locale}/hk/mypage/delete`} className="hk-mypage-card-link">
                {t('deleteAccount')}
              </Link>
              
              <div className="hk-mypage-setting-item">
                <label className="hk-mypage-setting-label">{t('languageSetting')}</label>
                <select 
                  className="hk-mypage-language-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="hk-mypage-setting-item">
                <label className="hk-mypage-setting-label">{t('notificationSetting')}</label>
                <div 
                  className={`hk-mypage-toggle ${notificationEnabled ? 'hk-mypage-toggle-active' : ''}`}
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                >
                  <div className="hk-mypage-toggle-slider"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 긴급 카드 */}
          <div className="hk-mypage-card">
            <h3 className="hk-mypage-card-title">{t('emergencyTitle')}</h3>
            <div className="hk-mypage-card-content">
              <Link href={`/${locale}/hk/emergency/hospitals`} className="hk-mypage-card-link">
                {t('nearbyHospitals')}
              </Link>
              <Link href={`/${locale}/hk/emergency/embassy`} className="hk-mypage-card-link">
                {t('embassyInfo')}
              </Link>
              <Link href={`/${locale}/hk/emergency/phones`} className="hk-mypage-card-link">
                {t('emergencyPhones')}
              </Link>
            </div>
          </div>

          {/* 결제/환전 카드 */}
          <div className="hk-mypage-card">
            <h3 className="hk-mypage-card-title">{t('paymentTitle')}</h3>
            <div className="hk-mypage-card-content">
              <Link href={`/${locale}/hk/guide/payment`} className="hk-mypage-card-link">
                {t('paymentGuide')}
              </Link>
              <Link href={`/${locale}/util/exchange-rate`} className="hk-mypage-card-link">
                {t('exchangeCalculator')}
              </Link>
            </div>
          </div>

          {/* 기타지원 카드 */}
          <div className="hk-mypage-card">
            <h3 className="hk-mypage-card-title">{t('supportTitle')}</h3>
            <div className="hk-mypage-card-content">
              <Link href={`/${locale}/hk/faq`} className="hk-mypage-card-link">
                {t('faq')}
              </Link>
              <Link href={`/${locale}/hk/contact`} className="hk-mypage-card-link">
                {t('contact')}
              </Link>
            </div>
          </div>

          {/* 현지 팁 카드 */}
          <div className="hk-mypage-card">
            <h3 className="hk-mypage-card-title">{t('tipsTitle')}</h3>
            <div className="hk-mypage-card-content">
              <Link href={`/${locale}/hk/guide/transport`} className="hk-mypage-card-link">
                {t('transportTips')}
              </Link>
              <Link href={`/${locale}/hk/tips/restaurant`} className="hk-mypage-card-link">
                {t('restaurantTips')}
              </Link>
              <Link href={`/${locale}/hk/tips/accommodation`} className="hk-mypage-card-link">
                {t('accommodationTips')}
              </Link>
              <Link href={`/${locale}/hk/tips/other`} className="hk-mypage-card-link">
                {t('otherTips')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HKLayout>
  );
}
