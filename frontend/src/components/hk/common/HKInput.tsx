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

  const inputClassName = [
    'hk-input',
    hasError && 'hk-input--error',
    hasLeftIcon && 'hk-input--has-left-icon',
    hasRightIcon && 'hk-input--has-right-icon',
    fullWidth && 'hk-input--full',
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={`hk-input-wrapper ${fullWidth ? 'hk-input-wrapper--full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="hk-input-label">
            {label}
          </label>
        )}
        
        <div className="hk-input-container">
          {leftIcon && (
            <div className="hk-input-icon hk-input-icon--left">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            className={inputClassName}
            {...props}
          />
          
          {rightIcon && (
            <div className="hk-input-icon hk-input-icon--right">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <span className="hk-input-error">{error}</span>
        )}
        
        {helperText && !error && (
          <span className="hk-input-helper">{helperText}</span>
        )}
      </div>

      <style jsx>{`
        .hk-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--hk-spacing-sm);
        }

        .hk-input-wrapper--full {
          width: 100%;
        }

        .hk-input-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--hk-text-primary);
        }

        .hk-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hk-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          color: var(--hk-text-primary);
          background: var(--hk-bg-primary);
          border: 2px solid var(--hk-border-primary);
          border-radius: var(--hk-radius-lg);
          transition: var(--hk-transition);
          outline: none;
        }

        .hk-input::placeholder {
          color: var(--hk-text-tertiary);
        }

        .hk-input:hover:not(:disabled) {
          border-color: var(--hk-primary);
        }

        .hk-input:focus {
          border-color: var(--hk-primary);
          box-shadow: 0 0 0 3px var(--hk-primary-light);
        }

        .hk-input:disabled {
          background: var(--hk-bg-tertiary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .hk-input--error {
          border-color: var(--hk-error);
        }

        .hk-input--error:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        .hk-input--has-left-icon {
          padding-left: 40px;
        }

        .hk-input--has-right-icon {
          padding-right: 40px;
        }

        .hk-input-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--hk-text-secondary);
          pointer-events: none;
        }

        .hk-input-icon--left {
          left: 12px;
        }

        .hk-input-icon--right {
          right: 12px;
        }

        .hk-input-error {
          font-size: 0.875rem;
          color: var(--hk-error);
        }

        .hk-input-helper {
          font-size: 0.875rem;
          color: var(--hk-text-secondary);
        }
      `}</style>
    </>
  );
}

