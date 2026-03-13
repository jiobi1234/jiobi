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
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-5 md:px-6 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">테마 목록</h2>
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-slate-500">테마 목록을 불러오는 중...</div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!loading && !error && themes.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          등록된 테마가 없습니다.
        </div>
      )}

      {!loading && !error && themes.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">테마 이름 (한국어)</th>
                <th className="px-3 py-2">테마 이름 (영어)</th>
                <th className="px-3 py-2">장소 개수</th>
                <th className="px-3 py-2">생성일</th>
                <th className="px-3 py-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => {
                const createdDate = theme.created_at
                  ? new Date(theme.created_at).toLocaleDateString('ko-KR')
                  : '날짜 없음';

                return (
                  <tr key={theme.id} className="align-top">
                    <td className="px-3 py-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="font-medium text-slate-900">{theme.name_ko}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                        {theme.name_en}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{theme.places.length}개</td>
                    <td className="px-3 py-2 text-slate-700">{createdDate}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => onEdit(theme)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          onClick={() => onDelete(theme.id)}
                        >
                          삭제
                        </button>
                      </div>
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

