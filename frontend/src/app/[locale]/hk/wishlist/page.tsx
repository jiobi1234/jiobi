'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import apiClient, { type WishlistItem } from '../../../../lib/api-client';

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
      <div className="max-w-6xl mx-auto px-4 py-6 pb-10 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
            {t('title', { defaultMessage: '위시리스트' })}
          </h1>
          <p className="text-slate-600 mb-4">
            {t('description', {
              defaultMessage: '저장해 둔 장소들을 한눈에 보고, 여행 계획에 활용해 보세요.',
            })}
          </p>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 hover:-translate-y-0.5 transition"
            onClick={handleGoToPlanCreate}
          >
            {t('goToPlanCreate', { defaultMessage: '새 여행 계획 만들기' })}
          </button>
        </div>

        {loading ? (
          <div className="py-10 px-4 text-center text-slate-500 bg-white rounded-2xl shadow-sm">
            {t('loading', { defaultMessage: '위시리스트를 불러오는 중입니다...' })}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-500 bg-white rounded-2xl shadow-sm">
            {t('empty', { defaultMessage: '위시리스트에 저장된 장소가 없습니다.' })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center sm:items-center gap-3 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                onClick={() => {
                  if (item.place_id) {
                    router.push(`/${locale}/hk/${item.place_id}`);
                  }
                }}
              >
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-slate-400">📍</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="font-semibold text-slate-800 truncate">{item.title}</div>
                  {item.address && (
                    <div className="text-sm text-slate-500 truncate">{item.address}</div>
                  )}
                  <div className="text-xs text-slate-400">
                    {item.created_at?.slice(0, 10).replace(/-/g, '.')}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition shrink-0"
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
    </HKLayout>
  );
}

