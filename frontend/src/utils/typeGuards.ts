/**
 * 타입 가드 유틸리티 함수
 * 타입 단언 대신 타입 가드를 사용하여 타입 안정성 강화
 */

/**
 * 문자열 타입 가드
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 숫자 타입 가드
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 배열 타입 가드
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 객체 타입 가드
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 빈 문자열이 아닌 문자열인지 확인
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * URL 파라미터에서 문자열 추출 (타입 안전)
 */
export function getStringParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | null {
  const value = params[key];
  if (isString(value) && value.length > 0) {
    return value;
  }
  return null;
}

/**
 * URL 파라미터에서 숫자 추출 (타입 안전)
 */
export function getNumberParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): number | null {
  const value = params[key];
  if (isString(value)) {
    const num = Number(value);
    if (isNumber(num)) {
      return num;
    }
  }
  return null;
}

