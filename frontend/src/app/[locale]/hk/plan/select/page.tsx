'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';

export default function PlanSelectPage() {
  const router = useRouter();
  const locale = useLocale();
  const { showToast } = useToast();

  const selectPlanType = (type: string) => {
    if (type === 'auto') {
      // Force hard navigation to prevent ChunkLoadError in dev mode
      window.location.href = `/${locale}/hk/plan/ai`;
    } else if (type === 'manual') {
      router.push(`/${locale}/hk/plan/create`);
    }
  };

  return (
    <HKLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-800 leading-snug m-0">
            어떤 방식으로 여행 계획을 세울까요?
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          <div
            className="bg-white rounded-2xl p-8 sm:p-10 text-center shadow-md hover:shadow-lg hover:-translate-y-1 hover:border-sky-500 border-2 border-transparent transition cursor-pointer"
            onClick={() => selectPlanType('auto')}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center bg-slate-100 rounded-2xl text-3xl sm:text-4xl">
              🤖
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 leading-snug">AI 자동 계획 생성</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 min-h-[3.75rem] sm:min-h-[60px]">
              관심사만 입력하면 AI가 맞춤 계획을 만들어드려요!
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#빠르고_쉽게</span>
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#추천_기반</span>
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#시간_절약</span>
            </div>
            <button type="button" className="w-full max-w-[200px] py-3.5 px-8 bg-sky-600 text-white border-0 rounded-2xl text-base font-semibold cursor-pointer hover:bg-sky-700 hover:-translate-y-0.5 hover:shadow-lg transition">
              시작하기
            </button>
          </div>

          <div
            className="bg-white rounded-2xl p-8 sm:p-10 text-center shadow-md hover:shadow-lg hover:-translate-y-1 hover:border-sky-500 border-2 border-transparent transition cursor-pointer"
            onClick={() => selectPlanType('manual')}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center bg-slate-100 rounded-2xl text-3xl sm:text-4xl">
              ✏️
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 leading-snug">수동 맞춤 계획 생성</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 min-h-0 sm:min-h-[60px]">
              장소부터 동선, 시간까지 모든 요소를 직접 선택하고 나만의 여행을 만들어보세요.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#내_맘대로</span>
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#디테일</span>
              <span className="bg-sky-100 text-sky-700 py-1.5 px-3 rounded-xl text-sm font-medium">#자유로운_설계</span>
            </div>
            <button type="button" className="w-full max-w-[200px] py-3.5 px-8 bg-sky-600 text-white border-0 rounded-2xl text-base font-semibold cursor-pointer hover:bg-sky-700 hover:-translate-y-0.5 hover:shadow-lg transition">
              시작하기
            </button>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/hk`}
            className="inline-block py-3 px-6 bg-transparent text-slate-500 border-2 border-slate-200 rounded-2xl text-sm font-medium no-underline hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition"
          >
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </HKLayout>
  );
}

