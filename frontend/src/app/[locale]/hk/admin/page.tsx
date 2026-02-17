'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { getStringParam } from '../../../../utils/typeGuards';
import { useAdminAuth, useThemeManagement } from '../../../../hooks/admin';
import ThemeCreateForm from '../../../../components/admin/ThemeCreateForm';
import ThemeList from '../../../../components/admin/ThemeList';
import '../../../../styles/hk/admin.css';

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
        <div className="admin-container">
          <div className="loading">로딩 중...</div>
        </div>
      </HKLayout>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <HKLayout>
      <div className="admin-container">
        {/* 헤더 섹션 */}
        <div className="admin-header">
          <div className="admin-header-top">
            <p className="admin-subtitle">환영합니다, {username}님</p>
          </div>
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              테마 만들기
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'list' ? 'active' : ''}`}
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

        {/* 하단 액션 */}
        <div className="admin-actions">
          <Link href={`/${locale}/hk`} className="admin-back-link">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </HKLayout>
  );
}

