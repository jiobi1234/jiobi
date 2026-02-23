/**
 * plan/[id] 하위 모든 라우트(상세, 경로, 여행)에 공통 적용
 * output: 'export' 시 generateStaticParams 필수
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ id: '0' }];
}

export default function PlanIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
