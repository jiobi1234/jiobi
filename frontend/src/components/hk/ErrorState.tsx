'use client';

import { useTranslations } from 'next-intl';
import HKButton from './common/HKButton';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const t = useTranslations('hk');
  
  return (
    <>
      <div className="error-message" role="alert" aria-live="assertive">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <p>{error}</p>
        <HKButton 
          variant="solid"
          size="sm"
          onClick={onRetry}
          aria-label={t('retry')}
        >
          {t('retry')}
        </HKButton>
      </div>

      <style jsx>{`
        .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          height: 200px;
          color: #dc3545;
          font-size: 1rem;
          background: #fff5f5;
          border: 2px solid #fed7d7;
          border-radius: 15px;
          margin: 20px 0;
          padding: 20px;
          text-align: center;
        }

        .error-icon {
          font-size: 2.5rem;
        }

        .error-message p {
          margin: 0;
          color: #c53030;
          font-weight: 500;
        }
      `}</style>
    </>
  );
}

