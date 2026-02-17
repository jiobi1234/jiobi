'use client';

import type { Theme } from '../../lib/api-client/types';

interface ThemeListProps {
  themes: Theme[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit: (theme: Theme) => void;
  onDelete: (themeId: string) => void;
}

/**
 * 테마 목록 컴포넌트
 */
export default function ThemeList({
  themes,
  loading,
  error,
  onRefresh,
  onEdit,
  onDelete,
}: ThemeListProps) {
  return (
    <div className="theme-list-section">
      <div className="section-header">
        <h2 className="section-title">테마 목록</h2>
        <button
          type="button"
          className="btn-refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {loading && (
        <div className="themes-loading">테마 목록을 불러오는 중...</div>
      )}

      {error && (
        <div className="themes-error">{error}</div>
      )}

      {!loading && !error && themes.length === 0 && (
        <div className="themes-empty">등록된 테마가 없습니다.</div>
      )}

      {!loading && !error && themes.length > 0 && (
        <div className="themes-table-container">
          <table className="themes-table">
            <thead>
              <tr>
                <th>테마 이름 (한국어)</th>
                <th>테마 이름 (영어)</th>
                <th>장소 개수</th>
                <th>생성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => {
                const createdDate = theme.created_at 
                  ? new Date(theme.created_at).toLocaleDateString('ko-KR')
                  : '날짜 없음';
                
                return (
                  <tr key={theme.id} className="theme-row">
                    <td className="theme-name-ko">{theme.name_ko}</td>
                    <td className="theme-name-en">{theme.name_en}</td>
                    <td className="theme-places-count">{theme.places.length}개</td>
                    <td className="theme-date">{createdDate}</td>
                    <td className="theme-actions">
                      <button
                        type="button"
                        className="btn-theme-edit"
                        onClick={() => onEdit(theme)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn-theme-delete"
                        onClick={() => onDelete(theme.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

