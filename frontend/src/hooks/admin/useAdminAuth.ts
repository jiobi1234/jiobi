import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api-client';

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  loading: boolean;
}

/**
 * Admin 페이지 인증 및 권한 확인을 위한 커스텀 훅
 * 
 * @param locale - 현재 locale
 * @returns 인증 및 권한 관련 상태
 */
export function useAdminAuth(locale: string): UseAdminAuthReturn {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = apiClient.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        router.push(`/${locale}/hk/login`);
        setLoading(false);
        return;
      }

      // 사용자 정보 가져오기
      try {
        const user = await apiClient.auth.getCurrentUser();
        setUsername(user.username);
        
        // 관리자 확인
        if (!user.is_admin) {
          // 관리자가 아니면 메인 페이지로 리다이렉트
          router.push(`/${locale}/hk`);
          setLoading(false);
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        // 토큰이 만료되었을 수 있으므로 로그인 페이지로 리다이렉트
        router.push(`/${locale}/hk/login`);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [locale, router]);

  return {
    isAuthenticated,
    isAdmin,
    username,
    loading,
  };
}

