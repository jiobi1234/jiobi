'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function HKFooter() {
  const params = useParams();
  const locale = params?.locale as string || 'ko';

  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="company-name">JIOBI</div>
            <div className="company-info">회사정보</div>
          </div>
          
          <div className="footer-right">
            <div className="footer-top-row">
              <div className="footer-links">
                <Link href="#" className="footer-link">이용 약관</Link>
                <span className="footer-separator">|</span>
                <Link href={`/${locale}/hk/privacy`} className="footer-link">개인정보처리방침</Link>
                <span className="footer-separator">|</span>
                <Link href={`/${locale}/hk/contact`} className="footer-link">고객센터</Link>
              </div>
              <div className="language-selector">
                <select className="language-dropdown">
                  <option value="ko">한국어</option>
                </select>
              </div>
            </div>
            <div className="social-icons">
              <Link href="#" className="social-icon facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="social-icon instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                  <defs>
                    <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#833ab4',stopOpacity:1}} />
                      <stop offset="50%" style={{stopColor:'#fd1d1d',stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#fcb045',stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.059 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* 푸터 스타일 */
        .footer {
          background: #343a40;
          color: white;
          padding: 20px 0;
          margin-top: 40px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* 왼쪽: 회사명과 회사정보 */
        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .company-name {
          font-size: 18px;
          font-weight: bold;
          color: white;
        }

        .company-info {
          font-size: 14px;
          color: #ccc;
        }

        /* 오른쪽: 링크들, 언어선택, 소셜미디어 */
        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .footer-top-row {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .footer-link {
          color: white;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: #007bff;
        }

        .footer-separator {
          color: #666;
          font-size: 14px;
        }

        .language-selector {
          position: relative;
        }

        .language-dropdown {
          background: #555;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          appearance: none;
          padding-right: 30px;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: 16px;
        }

        .language-dropdown option {
          background: #555;
          color: white;
        }

        .social-icons {
          display: flex;
          gap: 10px;
        }

        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          transition: opacity 0.3s ease;
        }

        .social-icon:hover {
          opacity: 0.8;
        }

        .social-icon.facebook {
          background: #1877f2;
          color: white;
        }

        .social-icon.instagram {
          background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
          color: white;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .footer-right {
            order: 2;
            align-items: center;
          }
          
          .footer-top-row {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
}

