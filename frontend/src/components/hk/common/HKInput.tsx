'use client';

import { useId, InputHTMLAttributes, ReactNode } from 'react';

interface HKInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * HK 앱 전용 표준 입력창 컴포넌트
 * 
 * @param label - 입력창 레이블
 * @param error - 에러 메시지
 * @param helperText - 도움말 텍스트
 * @param leftIcon - 왼쪽 아이콘
 * @param rightIcon - 오른쪽 아이콘
 * @param fullWidth - 전체 너비 사용 여부
 */
export default function HKInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  id,
  ...props
}: HKInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = !!error;
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  const baseInputClass =
    'w-full rounded-2xl border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition ' +
    'placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60';

  const errorClass = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
    : 'border-slate-700';

  const iconPaddingClass = [
    hasLeftIcon && 'pl-10',
    hasRightIcon && 'pr-10',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClassName = [
    baseInputClass,
    errorClass,
    iconPaddingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['flex flex-col gap-1.5', fullWidth && 'w-full'].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 flex h-4 w-4 items-center justify-center text-slate-500">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={inputClassName}
          {...props}
        />

        {rightIcon && (
          <div className="pointer-events-none absolute right-3 flex h-4 w-4 items-center justify-center text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}

      {helperText && !error && (
        <span className="text-xs text-slate-400">{helperText}</span>
      )}
    </div>
  );
}

