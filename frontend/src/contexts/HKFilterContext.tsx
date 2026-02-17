'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface HKFilterContextType {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  resetFilter: () => void;
}

const HKFilterContext = createContext<HKFilterContextType | undefined>(undefined);

/**
 * 필터 전용 Context Provider
 * 카테고리 필터링 상태만 관리하여 불필요한 리렌더링 방지
 */
export function HKFilterProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState('restaurant');

  const resetFilter = useCallback(() => {
    setSelectedCategory('restaurant');
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedCategory,
      setSelectedCategory,
      resetFilter,
    }),
    [selectedCategory, resetFilter]
  );

  return (
    <HKFilterContext.Provider value={contextValue}>
      {children}
    </HKFilterContext.Provider>
  );
}

export function useHKFilterContext() {
  const context = useContext(HKFilterContext);
  if (context === undefined) {
    throw new Error('useHKFilterContext must be used within a HKFilterProvider');
  }
  return context;
}

