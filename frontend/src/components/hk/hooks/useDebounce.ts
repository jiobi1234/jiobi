/**
 * 디바운스 훅
 * 입력값이 변경된 후 일정 시간이 지나면 값을 반환
 * 검색 입력 등에 사용하여 과도한 API 호출 방지
 */

import { useState, useEffect } from 'react';

/**
 * 디바운스 훅
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초, 기본값: 500ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 클린업: 값이 변경되면 이전 타이머 취소
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

