'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import apiClient from '../../../../lib/api-client';

const PENDING_SAVE_KEY = 'hk_pending_save';
const SUCCESS_DELAY_MS = 2500;

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function HKLoadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const [status, setStatus] = useState<Status>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const type = searchParams?.get('type') || '';

    useEffect(() => {
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    // 배너 광고 슬롯 (AdSense에서 발급한 슬롯 ID로 교체 필요)
    useEffect(() => {
        if (typeof window === 'undefined' || status !== 'loading') return;
        const t = setTimeout(() => {
            try {
                (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                (window as any).adsbygoogle.push({});
            } catch (e) {
                console.warn('AdSense push error:', e);
            }
        }, 100);
        return () => clearTimeout(t);
    }, [status]);

    // type=plan-save: sessionStorage에서 계획 읽어서 API 호출
    useEffect(() => {
        if (type !== 'plan-save') {
            router.replace(`/${locale}/hk`);
            return;
        }

        const raw = typeof window !== 'undefined' ? sessionStorage.getItem(PENDING_SAVE_KEY) : null;
        if (!raw) {
            router.replace(`/${locale}/hk/plan/ai`);
            return;
        }

        let payload: { planData: { title: string; start_date: string; end_date: string; items: any[] }; returnPath?: string };
        try {
            payload = JSON.parse(raw);
        } catch {
            setStatus('error');
            setErrorMessage('저장할 데이터를 읽을 수 없습니다.');
            return;
        }

        const { planData } = payload;
        if (!planData?.title || !planData?.items?.length) {
            setStatus('error');
            setErrorMessage('저장할 계획 정보가 올바르지 않습니다.');
            return;
        }

        setStatus('loading');

        apiClient.hk
            .createPlan(planData)
            .then(() => {
                sessionStorage.removeItem(PENDING_SAVE_KEY);
                setStatus('success');
                successTimerRef.current = setTimeout(() => {
                    window.location.href = `/${locale}/hk/mytravel`;
                }, SUCCESS_DELAY_MS);
            })
            .catch((err) => {
                console.error('계획 저장 실패:', err);
                setStatus('error');
                setErrorMessage('저장에 실패했습니다. 네트워크나 로그인 상태를 확인해 주세요.');
            });
    }, [type, locale, router]);

    const handleRetry = () => {
        setStatus('loading');
        setErrorMessage('');
        const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
        if (!raw) {
            setStatus('error');
            setErrorMessage('저장할 데이터가 없습니다. 계획 페이지에서 다시 시도해 주세요.');
            return;
        }
        try {
            const { planData } = JSON.parse(raw);
            apiClient.hk
                .createPlan(planData)
                .then(() => {
                    sessionStorage.removeItem(PENDING_SAVE_KEY);
                    setStatus('success');
                    setTimeout(() => {
                        window.location.href = `/${locale}/hk/mytravel`;
                    }, SUCCESS_DELAY_MS);
                })
                .catch((err) => {
                    console.error('계획 저장 재시도 실패:', err);
                    setStatus('error');
                    setErrorMessage('저장에 실패했습니다. 네트워크나 로그인 상태를 확인해 주세요.');
                });
        } catch {
            setStatus('error');
            setErrorMessage('저장할 데이터를 읽을 수 없습니다.');
        }
    };

    const handleBackToPlan = () => {
        window.location.href = `/${locale}/hk/plan/ai`;
    };

    if (type !== 'plan-save') {
        return (
            <HKLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-slate-700">이동 중...</p>
                </div>
            </HKLayout>
        );
    }

    return (
        <HKLayout>
            <div className="min-h-[60vh] flex flex-col items-center justify-center py-6 text-center px-6">
                {status === 'loading' && (
                    <>
                        <div className="mb-6">
                            <span
                                className="inline-block w-10 h-10 border-[3px] border-slate-200 border-t-violet-500 rounded-full animate-spin"
                                aria-hidden
                            />
                            <p className="my-2 text-lg text-slate-800">여행 계획을 안전하게 저장하고 있습니다.</p>
                            <p className="my-2 text-[0.95rem] text-slate-500">잠시만 기다려 주세요...</p>
                        </div>
                        <div className="min-h-[100px] max-w-[600px] w-full my-6">
                            <ins
                                className="adsbygoogle"
                                style={{ display: 'block' }}
                                data-ad-client="ca-pub-6857449583126977"
                                data-ad-slot="1234567890"
                                data-ad-format="auto"
                                data-full-width-responsive="true"
                            />
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <div className="mb-6">
                        <p className="text-4xl block mb-2">✅</p>
                        <p className="my-2 text-lg text-slate-800">저장되었습니다.</p>
                        <p className="my-2 text-[0.95rem] text-slate-500">잠시 후 내 여행으로 이동합니다.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-6">
                        <p className="text-4xl block mb-2">⚠️</p>
                        <p className="my-2 font-bold text-red-600">저장에 실패했습니다</p>
                        <p className="my-2 text-[0.95rem] text-slate-500 max-w-[360px] mx-auto">{errorMessage}</p>
                        <div className="flex gap-3 justify-center flex-wrap mt-6">
                            <button
                                type="button"
                                className="py-3 px-6 rounded-xl text-base font-semibold cursor-pointer border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white hover:opacity-90"
                                onClick={handleRetry}
                            >
                                다시 시도
                            </button>
                            <button
                                type="button"
                                className="py-3 px-6 rounded-xl text-base font-semibold cursor-pointer border-0 bg-slate-200 text-slate-800 hover:opacity-90"
                                onClick={handleBackToPlan}
                            >
                                계획으로 돌아가기
                            </button>
                        </div>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="mb-6">
                        <span
                            className="inline-block w-10 h-10 border-[3px] border-slate-200 border-t-violet-500 rounded-full animate-spin"
                            aria-hidden
                        />
                        <p className="my-2 text-lg text-slate-800">준비 중...</p>
                    </div>
                )}
            </div>
        </HKLayout>
    );
}
