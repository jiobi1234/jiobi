'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface HKSearchContextType {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  resetSearch: () => void;
}

const HKSearchContext = createContext<HKSearchContextType | undefined>(undefined);

/**
 * 검색 전용 Context Provider
 * 검색어 상태만 관리하여 불필요한 리렌더링 방지
 */
export function HKSearchProvider({ children }: { children: ReactNode }) {
  const [searchKeyword, setSearchKeyword] = useState('');

  const resetSearch = useCallback(() => {
    setSearchKeyword('');
  }, []);

  const contextValue = useMemo(
    () => ({
      searchKeyword,
      setSearchKeyword,
      resetSearch,
    }),
    [searchKeyword, resetSearch]
  );

  return (
    <HKSearchContext.Provider value={contextValue}>
      {children}
    </HKSearchContext.Provider>
  );
}

export function useHKSearchContext() {
  const context = useContext(HKSearchContext);
  if (context === undefined) {
    throw new Error('useHKSearchContext must be used within a HKSearchProvider');
  }
  return context;
}

