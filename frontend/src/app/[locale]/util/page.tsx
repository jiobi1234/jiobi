'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { getStringParam } from '../../../utils/typeGuards';

export default function UtilMainPage() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('util');

  return (
    <>
      <Navbar />
      <div className="bg-[#E9ECEF] min-h-full w-full">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* 3x3 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 justify-items-center">
            
            {/* 시계 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/clock`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('clock')}</h3>
              </div>
            </div>

            {/* 계산기 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/calculator`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('calculator')}</h3>
              </div>
            </div>

            {/* 달력 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/calendar`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('calendar')}</h3>
              </div>
            </div>

            {/* 심박수 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/heartrate`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('heartrate')}</h3>
              </div>
            </div>

            {/* BMI 계산기 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/bmi-calculator`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('bmiCalculator')}</h3>
              </div>
            </div>

            {/* 도량형 계산기 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/doryang`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="6" cy="6" r="2" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor"/>
                    <circle cx="18" cy="18" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('doryang')}</h3>
              </div>
            </div>

            {/* 환율 계산기 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/exchange-rate`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('exchangeRate')}</h3>
              </div>
            </div>

            {/* 명상 호흡 */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" 
              style={{ width: '176.91px', height: '184px' }}
              onClick={() => router.push(`/${locale}/util/breathing`)}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#373e56]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/>
                    <path d="M12 8v4m0 4h.01M8 12h8" stroke="currentColor" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#495057]">{t('breathing')}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

