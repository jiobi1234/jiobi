'use client';

import { useRouter } from 'next/navigation';
import HKButton from './HKButton';

interface HKBackButtonProps {
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

/**
 * HK 뒤로가기 버튼 컴포넌트
 * 여러 페이지에서 공통으로 사용되는 뒤로가기 버튼
 */
export default function HKBackButton({
  onClick,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  'aria-label': ariaLabel,
}: HKBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <HKButton
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel || '뒤로 가기'}
    >
      {children || '←'}
    </HKButton>
  );
}

