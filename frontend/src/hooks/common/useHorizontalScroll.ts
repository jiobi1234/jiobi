import { useEffect, RefObject, useMemo } from 'react';

/**
 * HTMLDivElement 타입 가드
 */
function isHTMLDivElement(element: HTMLElement | null): element is HTMLDivElement {
  return element !== null && element instanceof HTMLDivElement;
}

export function useHorizontalScroll(refs: RefObject<HTMLDivElement>[]) {
  // refs 배열을 메모이제이션하여 불필요한 재실행 방지
  const memoizedRefs = useMemo(() => refs, [refs]);

  useEffect(() => {
    const scrollContainers = memoizedRefs
      .map(ref => ref.current)
      .filter(isHTMLDivElement);
    
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement | null;
        if (target && isHTMLDivElement(target)) {
          target.scrollLeft += e.deltaY;
        }
      }
    };

    scrollContainers.forEach(container => {
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
      }
    });

    return () => {
      scrollContainers.forEach(container => {
        if (container) {
          container.removeEventListener('wheel', handleWheel);
        }
      });
    };
  }, [memoizedRefs]);
}

