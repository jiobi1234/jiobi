import { Suspense } from 'react';
import HKLayout from '../../../../../components/hk/HKLayout';
import LoadingState from '../../../../../components/hk/LoadingState';
import PlanDetailContent from './PlanDetailContent';

export const dynamicParams = true;

export async function generateStaticParams() {
  // output: 'export' 시 prerenderRoutes가 비면 "missing"으로 간주되므로 최소 1개 반환
  return [{ id: '0' }];
}

export default function PlanDetailPage() {
  return (
    <HKLayout>
      <Suspense fallback={<LoadingState />}>
        <PlanDetailContent />
      </Suspense>
    </HKLayout>
  );
}
