'use client';

import HKButton from '../hk/common/HKButton';

interface ErrorBoundaryFallbackProps {
  error: Error | null;
  onReset: () => void;
  messages?: any; // 번역 메시지 (옵션)
}

/**
 * ErrorBoundary 폴백 UI 컴포넌트 (i18n 지원)
 */
export default function ErrorBoundaryFallback({ error, onReset, messages }: ErrorBoundaryFallbackProps) {
  // 번역 메시지가 있으면 사용, 없으면 기본값 사용
  const getTranslation = (key: string, defaultValue: string) => {
    if (messages?.errors?.errorBoundary?.[key]) {
      return messages.errors.errorBoundary[key];
    }
    return defaultValue;
  };

  const title = getTranslation('title', '문제가 발생했습니다');
  const message = getTranslation('message', '예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.');
  const details = getTranslation('details', '에러 상세 정보 (개발 모드)');
  const retry = getTranslation('retry', '다시 시도');
  const refresh = getTranslation('refresh', '페이지 새로고침');

  return (
    <>
      <div className="error-boundary">
        <div className="error-boundary-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">{title}</h2>
          <p className="error-message">{message}</p>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="error-details">
              <summary>{details}</summary>
              <pre className="error-stack">
                {error.toString()}
                {error.stack}
              </pre>
            </details>
          )}
          <div className="error-actions">
            <HKButton
              variant="solid"
              size="md"
              onClick={onReset}
            >
              {retry}
            </HKButton>
            <HKButton
              variant="outline"
              size="md"
              onClick={() => window.location.reload()}
            >
              {refresh}
            </HKButton>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-boundary {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 40px 20px;
        }

        .error-boundary-content {
          max-width: 600px;
          text-align: center;
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .error-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
        }

        .error-message {
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .error-details {
          text-align: left;
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .error-details summary {
          cursor: pointer;
          font-weight: 600;
          color: #666;
          margin-bottom: 10px;
        }

        .error-stack {
          font-size: 0.85rem;
          color: #dc3545;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .error-boundary-content {
            padding: 30px 20px;
          }

          .error-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

