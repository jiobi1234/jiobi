'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { getStringParam } from '../../../../utils/typeGuards';
import { useAdminAuth, useThemeManagement } from '../../../../hooks/admin';
import ThemeCreateForm from '../../../../components/admin/ThemeCreateForm';
import ThemeList from '../../../../components/admin/ThemeList';

export default function AdminPage() {
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // 인증 및 권한 확인
  const { isAuthenticated, isAdmin, username, loading } = useAdminAuth(locale);
  
  // 테마 관리
  const {
    themeNameKo,
    setThemeNameKo,
    themeNameEn,
    setThemeNameEn,
    places,
    editingThemeId,
    isSubmitting,
    message,
    setMessage,
    themes,
    themesLoading,
    themesError,
    fetchThemes,
    handleStartEdit,
    handleCancelEdit,
    handleSaveTheme,
    handleDeleteTheme,
    addPlace,
    removePlace,
  } = useThemeManagement();

  // 테마 목록 불러오기
  useEffect(() => {
    if (isAdmin) {
      fetchThemes();
    }
  }, [isAdmin, fetchThemes]);

  const handleStartEditWithTab = (theme: any) => {
    handleStartEdit(theme);
    setActiveTab('create');
  };

  if (loading) {
    return (
      <HKLayout>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-center py-16 text-lg text-slate-500">로딩 중...</div>
        </div>
      </HKLayout>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <HKLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-base text-slate-500 mb-4">환영합니다, {username}님</p>
          <div className="inline-flex p-1 bg-slate-100 rounded-full gap-1">
            <button
              type="button"
              className={`py-2 px-5 rounded-full text-sm font-medium transition ${activeTab === 'create' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-black/5'}`}
              onClick={() => setActiveTab('create')}
            >
              테마 만들기
            </button>
            <button
              type="button"
              className={`py-2 px-5 rounded-full text-sm font-medium transition ${activeTab === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-black/5'}`}
              onClick={() => setActiveTab('list')}
            >
              테마 목록
            </button>
          </div>
        </div>

        {/* 테마 만들기 섹션 */}
        {activeTab === 'create' && (
          <ThemeCreateForm
            themeNameKo={themeNameKo}
            setThemeNameKo={setThemeNameKo}
            themeNameEn={themeNameEn}
            setThemeNameEn={setThemeNameEn}
            places={places}
            editingThemeId={editingThemeId}
            isSubmitting={isSubmitting}
            message={message}
            onSave={handleSaveTheme}
            onCancel={handleCancelEdit}
            onAddPlace={addPlace}
            onRemovePlace={removePlace}
          />
        )}

        {/* 테마 목록 섹션 */}
        {activeTab === 'list' && (
          <ThemeList
            themes={themes}
            loading={themesLoading}
            error={themesError}
            onRefresh={fetchThemes}
            onEdit={handleStartEditWithTab}
            onDelete={handleDeleteTheme}
          />
        )}

        <div className="mt-8">
          <Link
            href={`/${locale}/hk`}
            className="inline-block py-3 px-5 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium no-underline hover:bg-slate-50 hover:border-slate-300"
          >
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </HKLayout>
  );
}

