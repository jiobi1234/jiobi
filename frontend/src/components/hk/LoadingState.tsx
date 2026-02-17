'use client';

export default function LoadingState() {
  return (
    <>
      <div className="loading-placeholder" role="status" aria-live="polite" aria-label="로딩 중">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>새로운 정보를 불러오는 중...</span>
      </div>

      <style jsx>{`
        .loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          height: 200px;
          color: #666;
          font-size: 1.1rem;
          background: #f8f9fa;
          border-radius: 15px;
          margin: 20px 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top: 4px solid #0064ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

