/**
 * 폼 검증 커스텀 훅
 * 공통 폼 검증 로직을 재사용 가능한 훅으로 추출
 */

import { useState, useCallback, useMemo } from 'react';

export type ValidationRule<T = any> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
};

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export interface UseFormValidationReturn<T extends Record<string, any>> {
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  validateField: (field: keyof T, value: T[keyof T]) => string | null;
  validateForm: (values: T) => boolean;
  setFieldError: (field: keyof T, error: string | null) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}

/**
 * 폼 검증 훅
 * @param rules - 필드별 검증 규칙
 * @param options - 옵션 설정
 */
export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRules<T>,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  } = {}
): UseFormValidationReturn<T> {
  const { validateOnChange = true, validateOnBlur = true } = options;

  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * 단일 필드 검증
   */
  const validateField = useCallback(
    (field: keyof T, value: T[keyof T]): string | null => {
      const rule = rules[field];
      if (!rule) return null;

      // 필수 검증
      if (rule.required) {
        if (value === null || value === undefined || value === '') {
          return rule.message || `${String(field)}을(를) 입력해주세요.`;
        }
      }

      // 값이 없으면 다른 검증은 스킵 (required가 아닌 경우)
      if (value === null || value === undefined || value === '') {
        return null;
      }

      const valueStr = String(value);

      // 최소 길이 검증
      if (rule.minLength !== undefined && valueStr.length < rule.minLength) {
        return rule.message || `${String(field)}은(는) 최소 ${rule.minLength}자 이상이어야 합니다.`;
      }

      // 최대 길이 검증
      if (rule.maxLength !== undefined && valueStr.length > rule.maxLength) {
        return rule.message || `${String(field)}은(는) 최대 ${rule.maxLength}자까지 입력 가능합니다.`;
      }

      // 패턴 검증
      if (rule.pattern && !rule.pattern.test(valueStr)) {
        return rule.message || `${String(field)} 형식이 올바르지 않습니다.`;
      }

      // 커스텀 검증
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          return customError;
        }
      }

      return null;
    },
    [rules]
  );

  /**
   * 전체 폼 검증
   */
  const validateForm = useCallback(
    (values: T): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {};

      Object.keys(rules).forEach((field) => {
        const fieldKey = field as keyof T;
        const error = validateField(fieldKey, values[fieldKey]);
        if (error) {
          newErrors[fieldKey] = error;
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [rules, validateField]
  );

  /**
   * 필드 에러 설정
   */
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  /**
   * 필드 터치 상태 설정
   */
  const setFieldTouched = useCallback((field: keyof T, touchedValue: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: touchedValue }));
  }, []);

  /**
   * 모든 에러 초기화
   */
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /**
   * 특정 필드 에러 초기화
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setFieldError(field, null);
  }, [setFieldError]);

  /**
   * 폼 유효성 검사
   */
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateForm,
    setFieldError,
    setFieldTouched,
    clearErrors,
    clearFieldError,
  };
}

/**
 * 이메일 검증 유틸리티
 */
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 비밀번호 검증 유틸리티
 */
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * 전화번호 검증 유틸리티
 */
export const phonePattern = /^[0-9-]+$/;

