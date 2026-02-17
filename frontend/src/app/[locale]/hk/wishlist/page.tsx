'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import apiClient, { type WishlistItem } from '../../../../lib/api-client';
import '../../../../styles/hk/common.css';

export default function WishlistPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('hk.wishlist');
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (!apiClient.auth.isAuthenticated()) {
          setItems([]);
          setLoading(false);
          return;
        }
        const res = await apiClient.hk.getWishlist();
        setItems(res.items || []);
      } catch (error) {
        console.error('위시리스트 로딩 중 오류:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const handleRemove = async (item: WishlistItem) => {
    try {
      await apiClient.hk.removeFromWishlist(item.place_id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (error) {
      console.error('위시리스트 삭제 중 오류:', error);
      // TODO: 필요하면 토스트 알림 연동
    }
  };

  const handleGoToPlanCreate = () => {
    router.push(`/${locale}/hk/plan/create`);
  };

  return (
    <HKLayout>
      <div className="hk-wishlist-container">
        <div className="hk-wishlist-header">
          <h1 className="hk-wishlist-title">
            {t('title', { defaultMessage: '위시리스트' })}
          </h1>
          <p className="hk-wishlist-description">
            {t('description', {
              defaultMessage: '저장해 둔 장소들을 한눈에 보고, 여행 계획에 활용해 보세요.',
            })}
          </p>
          <button
            type="button"
            className="hk-wishlist-plan-button"
            onClick={handleGoToPlanCreate}
          >
            {t('goToPlanCreate', { defaultMessage: '새 여행 계획 만들기' })}
          </button>
        </div>

        {loading ? (
          <div className="hk-wishlist-empty">
            {t('loading', { defaultMessage: '위시리스트를 불러오는 중입니다...' })}
          </div>
        ) : items.length === 0 ? (
          <div className="hk-wishlist-empty">
            {t('empty', { defaultMessage: '위시리스트에 저장된 장소가 없습니다.' })}
          </div>
        ) : (
          <div className="hk-wishlist-list">
            {items.map((item) => (
              <div
                key={item.id}
                className="hk-wishlist-item"
                onClick={() => {
                  if (item.place_id) {
                    router.push(`/${locale}/hk/${item.place_id}`);
                  }
                }}
              >
                <div className="hk-wishlist-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="hk-wishlist-item-image-placeholder">📍</div>
                  )}
                </div>
                <div className="hk-wishlist-item-main">
                  <div className="hk-wishlist-item-title">{item.title}</div>
                  {item.address && (
                    <div className="hk-wishlist-item-address">{item.address}</div>
                  )}
                  <div className="hk-wishlist-item-meta">
                    <span className="hk-wishlist-item-date">
                      {item.created_at?.slice(0, 10).replace(/-/g, '.')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="hk-wishlist-delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .hk-wishlist-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }

        .hk-wishlist-header {
          margin-bottom: 24px;
        }

        .hk-wishlist-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #212529;
          margin-bottom: 8px;
        }

        .hk-wishlist-description {
          color: #495057;
          margin-bottom: 16px;
        }

        .hk-wishlist-plan-button {
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: #0064ff;
          color: white;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
        }

        .hk-wishlist-plan-button:hover {
          background: #0052cc;
          transform: translateY(-1px);
        }

        .hk-wishlist-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hk-wishlist-item {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.1s ease;
          gap: 12px;
        }

        .hk-wishlist-item:hover {
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .hk-wishlist-item-image {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          background: #f1f3f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .hk-wishlist-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hk-wishlist-item-image-placeholder {
          font-size: 24px;
          color: #adb5bd;
        }

        .hk-wishlist-item-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .hk-wishlist-item-title {
          font-weight: 600;
          color: #212529;
        }

        .hk-wishlist-item-address {
          font-size: 0.9rem;
          color: #868e96;
        }

        .hk-wishlist-item-meta {
          font-size: 0.8rem;
          color: #adb5bd;
        }

        .hk-wishlist-delete-button {
          border: none;
          background: #f1f3f5;
          color: #868e96;
          border-radius: 999px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
        }

        .hk-wishlist-delete-button:hover {
          background: #ff6b6b;
          color: #fff;
          transform: translateY(-1px);
        }

        .hk-wishlist-empty {
          padding: 40px 16px;
          text-align: center;
          color: #868e96;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 600px) {
          .hk-wishlist-item {
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </HKLayout>
  );
}

