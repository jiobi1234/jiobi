import HKLayout from '../../../../../components/hk/HKLayout';
import ThemePageContent from './ThemePageContent';

export const dynamicParams = false; // 정적 export를 위한 설정

export async function generateStaticParams() {
  // 최소한 하나의 기본값은 있어야 합니다
  return [
    { themeName: 'default' },
  ];
}

/**
 * 테마 페이지 (Wrapper)
 * HKLayout을 제공하여 ToastProvider 사용 가능하도록 함
 */
export default function ThemePage() {
  return (
    <HKLayout>
      <ThemePageContent />
    </HKLayout>
  );
}
