import { Suspense } from 'react';
import HKLayout from '../../../../../components/hk/HKLayout';
import LoadingState from '../../../../../components/hk/LoadingState';
import PlanDetailContent from './PlanDetailContent';

export default function PlanDetailPage() {
  return (
    <HKLayout>
      <Suspense fallback={<LoadingState />}>
        <PlanDetailContent />
      </Suspense>
    </HKLayout>
  );
}
