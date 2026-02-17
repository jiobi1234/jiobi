'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../../../utils/typeGuards';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { API_CONFIG } from '../../../lib/api-client/config';

interface BlogInfo {
  title: string;
  url: string;
  categories: string[];
}

interface Post {
  title: string;
  url: string;
  summary: string;
  thumbnail: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_posts: number;
  per_page: number;
  has_previous: boolean;
  has_next: boolean;
  previous_page: number | null;
  next_page: number | null;
  page_range: number[];
}

export default function BlogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('blog');
  const [blogInfo, setBlogInfo] = useState<BlogInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    setSelectedCategory(categoryParam);
    fetchBlogData();
  }, [currentPage, categoryParam]);

  const fetchBlogData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 블로그 정보 가져오기
      const infoResponse = await fetch(`${API_CONFIG.apiPrefix}/blog/info`);
      if (!infoResponse.ok) {
        throw new Error(t('loadingError'));
      }
      const infoData = await infoResponse.json();
      setBlogInfo(infoData);

      // 포스트 목록 가져오기
      const postsUrl = `${API_CONFIG.apiPrefix}/blog/posts?page=${currentPage}&per_page=15${categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : ''}`;
      const postsResponse = await fetch(postsUrl);
      if (!postsResponse.ok) {
        throw new Error(t('postsError'));
      }
      const postsData = await postsResponse.json();
      setPosts(postsData.posts || []);
      setPagination(postsData.pagination || null);
      setSelectedCategory(postsData.selected_category || null);
    } catch (err) {
      console.error('블로그 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string | null) => {
    const params = new URLSearchParams();
    if (category) {
      params.set('category', category);
    }
    params.set('page', '1');
    router.push(`/${locale}/blog?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    params.set('page', page.toString());
    router.push(`/${locale}/blog?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {blogInfo?.title || t('title')}
          </h1>
        </header>

        {/* 네비게이션 및 뷰 옵션 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-medium text-gray-900">
            {selectedCategory ? (
              <>
                {selectedCategory} ({pagination?.total_posts || 0}) - {pagination?.current_page || 1}/{pagination?.total_pages || 1} {t('page')}
              </>
            ) : (
              <>
                {t('allPosts')} ({pagination?.total_posts || 0}) - {pagination?.current_page || 1}/{pagination?.total_pages || 1} {t('page')}
              </>
            )}
          </div>
        </div>

        {/* 카테고리 네비게이션 */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                !selectedCategory
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              >
                {t('allPosts')}
              </button>
            {blogInfo?.categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>

        {/* 포스트 목록 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">로딩 중...</h3>
              <p className="text-gray-600">블로그 포스트를 불러오는 중입니다.</p>
            </div>
          ) : error ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">오류</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedCategory ? '이 카테고리에 포스트가 없습니다' : '포스트를 불러올 수 없습니다'}
              </h3>
              <p className="text-gray-600">
                {selectedCategory ? '다른 카테고리를 선택해보세요.' : '잠시 후 다시 시도해주세요.'}
              </p>
            </div>
          ) : (
            posts.map((post, index) => (
              <article
                key={`${post.url}-${index}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start space-x-4">
                  {post.thumbnail && (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {post.title}
                      </a>
                    </h3>
                    {post.summary && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {post.summary.length > 200 ? `${post.summary.substring(0, 200)}...` : post.summary}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2" aria-label="페이지네이션">
              {/* 이전 페이지 */}
              {pagination.has_previous ? (
                <button
                  onClick={() => handlePageChange(pagination.previous_page!)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  이전
                </button>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed">
                  이전
                </span>
              )}

              {/* 페이지 번호들 */}
              {pagination.page_range.map((pageNum) => {
                const shouldShow = 
                  pageNum <= 5 ||
                  pageNum > pagination.total_pages - 5 ||
                  (pageNum >= pagination.current_page - 2 && pageNum <= pagination.current_page + 2);

                if (!shouldShow) {
                  if (pageNum === 6 && pagination.current_page > 7) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-sm font-medium text-gray-400">
                        ...
                      </span>
                    );
                  }
                  if (pageNum === pagination.total_pages - 5 && pagination.current_page < pagination.total_pages - 6) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-sm font-medium text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                if (pageNum === pagination.current_page) {
                  return (
                    <span
                      key={pageNum}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md"
                    >
                      {pageNum}
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* 다음 페이지 */}
              {pagination.has_next ? (
                <button
                  onClick={() => handlePageChange(pagination.next_page!)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  다음
                </button>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 rounded-md cursor-not-allowed">
                  다음
                </span>
              )}
            </nav>
          </div>
        )}
      </main>
      <Footer />

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          display: -moz-box;
          display: box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          -moz-box-orient: vertical;
          box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .max-w-4xl {
            max-width: 100%;
          }

          .px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .space-y-6 > * + * {
            margin-top: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

