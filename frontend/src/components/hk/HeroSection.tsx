'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../../utils/typeGuards';
import HKButton from './common/HKButton';
import apiClient from '../../lib/api-client';
import { useToast } from './common/Toast';

export default function HeroSection() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('hk');
  const { showToast } = useToast();

  const handlePlanClick = () => {
    // 로그인 여부 확인
    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 계획을 만들 수 있습니다.');
      router.push(`/${locale}/hk/login`);
      return;
    }
    
    // 로그인되어 있으면 계획 선택 페이지로 이동
    router.push(`/${locale}/hk/plan/select/`);
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('heroTitle') }} />
          <HKButton 
            variant="solid"
            size="lg"
            onClick={handlePlanClick}
          >
            {t('createPlan')}
          </HKButton>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 30px;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </>
  );
}

