'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../../utils/typeGuards';
import HKButton from './common/HKButton';

export default function HeroSection() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('hk');

  const handlePlanClick = (type: 'ai' | 'manual') => {
    // 계획 만들기는 로그인 없이 진입 가능. 저장 시점에 로그인 유도.
    if (type === 'ai') {
      window.location.href = `/${locale}/hk/plan/ai`;
    } else {
      router.push(`/${locale}/hk/plan/create`);
    }
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('heroTitle') }} />
          <div className="hero-buttons">
            <HKButton
              variant="solid"
              size="lg"
              onClick={() => handlePlanClick('ai')}
            >
              {t('createPlanAi')}
            </HKButton>
            <HKButton
              variant="outline"
              size="lg"
              onClick={() => handlePlanClick('manual')}
            >
              {t('createPlanManual')}
            </HKButton>
          </div>
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

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          align-items: center;
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

