/**
 * API 요청 중복 방지 유틸리티
 * 동일한 요청이 진행 중이면 재사용하여 불필요한 네트워크 요청 방지
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly CACHE_DURATION = 1000; // 1초 동안 동일한 요청 캐시

  /**
   * 요청 키 생성
   */
  private getRequestKey(
    method: string,
    url: string,
    params?: Record<string, any>
  ): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * 중복 요청 방지된 요청 실행
   * @param key - 요청 키
   * @param requestFn - 실제 요청 함수
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const existing = this.pendingRequests.get(key);

    // 진행 중인 동일한 요청이 있고 캐시 시간 내라면 재사용
    if (existing && now - existing.timestamp < this.CACHE_DURATION) {
      return existing.promise;
    }

    // 새 요청 생성
    const promise = requestFn()
      .then((result) => {
        // 요청 완료 후 일정 시간 후 제거
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, this.CACHE_DURATION);
        return result;
      })
      .catch((error) => {
        // 에러 발생 시 즉시 제거
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * 특정 요청 취소
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * 모든 요청 취소
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * 진행 중인 요청 개수
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// 싱글톤 인스턴스
export const requestDeduplication = new RequestDeduplication();

/**
 * 요청 중복 방지 데코레이터
 */
export function withDeduplication<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = getKey
      ? getKey(...args)
      : `fn:${fn.name}:${JSON.stringify(args)}`;
    return requestDeduplication.deduplicate(key, () => fn(...args));
  }) as T;
}

