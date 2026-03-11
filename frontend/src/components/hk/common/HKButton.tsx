'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface HKButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function HKButton({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: HKButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed';

  const variantClass =
    variant === 'outline'
      ? 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
      : variant === 'ghost'
      ? 'border-transparent text-sky-600 hover:bg-slate-100'
      : 'border-sky-600 bg-sky-600 text-white hover:bg-sky-700';

  const sizeClass =
    size === 'sm'
      ? 'px-4 py-1.5 text-sm'
      : size === 'lg'
      ? 'px-6 py-2.5 text-base'
      : 'px-5 py-2 text-sm';

  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClassName = [base, variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </button>
  );
}

