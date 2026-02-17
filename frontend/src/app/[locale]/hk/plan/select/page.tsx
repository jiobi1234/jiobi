'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';

export default function PlanSelectPage() {
  const router = useRouter();
  const locale = useLocale();
  const { showToast } = useToast();

  const selectPlanType = (type: string) => {
    if (type === 'auto') {
      // Force hard navigation to prevent ChunkLoadError in dev mode
      window.location.href = `/${locale}/hk/plan/ai`;
    } else if (type === 'manual') {
      router.push(`/${locale}/hk/plan/create`);
    }
  };

  return (
    <HKLayout>
      <div className="plan-select-container">
        <div className="plan-select-header">
          <h1 className="plan-select-title">어떤 방식으로 여행 계획을 세울까요?</h1>
        </div>

        <div className="plan-options">
          <div className="plan-option" onClick={() => selectPlanType('auto')}>
            <div className="plan-option-icon">🤖</div>
            <h2 className="plan-option-title">AI 자동 계획 생성</h2>
            <p className="plan-option-description">
              관심사만 입력하면 AI가 맞춤 계획을 만들어드려요!
            </p>
            <div className="plan-option-hashtags">
              <span className="hashtag">#빠르고_쉽게</span>
              <span className="hashtag">#추천_기반</span>
              <span className="hashtag">#시간_절약</span>
            </div>
            <button className="start-button">시작하기</button>
          </div>

          <div className="plan-option" onClick={() => selectPlanType('manual')}>
            <div className="plan-option-icon">✏️</div>
            <h2 className="plan-option-title">수동 맞춤 계획 생성</h2>
            <p className="plan-option-description">
              장소부터 동선, 시간까지 모든 요소를 직접 선택하고 나만의 여행을 만들어보세요.
            </p>
            <div className="plan-option-hashtags">
              <span className="hashtag">#내_맘대로</span>
              <span className="hashtag">#디테일</span>
              <span className="hashtag">#자유로운_설계</span>
            </div>
            <button className="start-button">시작하기</button>
          </div>
        </div>

        <div className="back-button">
          <Link href={`/${locale}/hk`} className="back-btn">← 메인으로 돌아가기</Link>
        </div>
      </div>

      <style jsx>{`
        .plan-select-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .plan-select-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .plan-select-title {
          font-size: 2.2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0;
          line-height: 1.3;
        }

        .plan-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }

        .plan-option {
          background: white;
          border-radius: 16px;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .plan-option:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: #0064ff;
        }

        .plan-option-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 2.5rem;
        }

        .plan-option-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .plan-option-description {
          font-size: 0.95rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 24px;
          min-height: 60px;
        }

        .plan-option-hashtags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 30px;
        }

        .hashtag {
          background: #e3f2fd;
          color: #1976d2;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .start-button {
          background: #0064ff;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          max-width: 200px;
        }

        .start-button:hover {
          background: #0056e6;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 100, 255, 0.3);
        }

        .back-button {
          text-align: center;
          margin-top: 40px;
        }

        .back-btn {
          background: transparent;
          color: #666;
          border: 2px solid #ddd;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .back-btn:hover {
          background: #f8f9fa;
          border-color: #999;
          color: #333;
        }

        @media (max-width: 768px) {
          .plan-select-container {
            padding: 40px 15px;
          }

          .plan-select-title {
            font-size: 1.8rem;
          }

          .plan-options {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .plan-option {
            padding: 30px 20px;
          }

          .plan-option-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
          }

          .plan-option-title {
            font-size: 1.2rem;
          }

          .plan-option-description {
            min-height: auto;
          }
        }
      `}</style>
    </HKLayout>
  );
}

