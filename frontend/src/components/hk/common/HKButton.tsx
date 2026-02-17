'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface HKButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * HK 앱 전용 표준 버튼 컴포넌트
 * 
 * @param variant - 버튼 스타일: 'solid' (기본), 'outline', 'ghost'
 * @param size - 버튼 크기: 'sm', 'md' (기본), 'lg'
 * @param fullWidth - 전체 너비 사용 여부
 * @param children - 버튼 내용
 */
export default function HKButton({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: HKButtonProps) {
  const baseStyles = 'hk-button';
  const variantClass = `hk-button--${variant}`;
  const sizeClass = `hk-button--${size}`;
  const widthClass = fullWidth ? 'hk-button--full' : '';
  const disabledClass = disabled ? 'hk-button--disabled' : '';
  
  const combinedClassName = [
    baseStyles,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        className={combinedClassName}
        disabled={disabled}
        aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {children}
      </button>

      <style jsx>{`
        .hk-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          cursor: pointer;
          transition: var(--hk-transition);
          border: none;
          outline: none;
          font-family: inherit;
        }

        /* Solid Variant (기본) */
        .hk-button--solid {
          background: var(--hk-primary);
          color: white;
        }

        .hk-button--solid:hover:not(.hk-button--disabled) {
          background: var(--hk-primary-hover);
          transform: translateY(-2px);
          box-shadow: var(--hk-shadow-primary);
        }

        .hk-button--solid:active:not(.hk-button--disabled) {
          background: var(--hk-primary-dark);
          transform: translateY(0);
        }

        /* Outline Variant */
        .hk-button--outline {
          background: transparent;
          color: var(--hk-primary);
          border: 2px solid var(--hk-primary);
        }

        .hk-button--outline:hover:not(.hk-button--disabled) {
          background: var(--hk-primary);
          color: white;
        }

        .hk-button--outline:active:not(.hk-button--disabled) {
          background: var(--hk-primary-dark);
          border-color: var(--hk-primary-dark);
        }

        /* Ghost Variant */
        .hk-button--ghost {
          background: transparent;
          color: var(--hk-primary);
          border: none;
        }

        .hk-button--ghost:hover:not(.hk-button--disabled) {
          background: var(--hk-primary-light);
        }

        .hk-button--ghost:active:not(.hk-button--disabled) {
          background: rgba(0, 102, 255, 0.2);
        }

        /* Size Variants */
        .hk-button--sm {
          padding: 8px 16px;
          font-size: 0.875rem;
          border-radius: var(--hk-radius-sm);
        }

        .hk-button--md {
          padding: 12px 24px;
          font-size: 1rem;
          border-radius: var(--hk-radius-lg);
        }

        .hk-button--lg {
          padding: 15px 30px;
          font-size: 1.1rem;
          border-radius: var(--hk-radius-xl);
        }

        /* Full Width */
        .hk-button--full {
          width: 100%;
        }

        /* Disabled State */
        .hk-button--disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Focus State */
        .hk-button:focus-visible {
          outline: 2px solid var(--hk-primary);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}

