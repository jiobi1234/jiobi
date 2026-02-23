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
                <div className="hk-loading-page">
                    <p>이동 중...</p>
                </div>
            </HKLayout>
        );
    }

    return (
        <HKLayout>
            <div className="hk-loading-page">
                {status === 'loading' && (
                    <>
                        <div className="hk-loading-message">
                            <span className="hk-loading-spinner" aria-hidden />
                            <p>여행 계획을 안전하게 저장하고 있습니다.</p>
                            <p className="hk-loading-sub">잠시만 기다려 주세요...</p>
                        </div>
                        <div className="hk-loading-ad">
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
                    <div className="hk-loading-message success">
                        <p className="hk-loading-emoji">✅</p>
                        <p>저장되었습니다.</p>
                        <p className="hk-loading-sub">잠시 후 내 여행으로 이동합니다.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="hk-loading-message error">
                        <p className="hk-loading-emoji">⚠️</p>
                        <p className="hk-loading-error-title">저장에 실패했습니다</p>
                        <p className="hk-loading-error-detail">{errorMessage}</p>
                        <div className="hk-loading-actions">
                            <button type="button" className="hk-loading-btn primary" onClick={handleRetry}>
                                다시 시도
                            </button>
                            <button type="button" className="hk-loading-btn secondary" onClick={handleBackToPlan}>
                                계획으로 돌아가기
                            </button>
                        </div>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="hk-loading-message">
                        <span className="hk-loading-spinner" aria-hidden />
                        <p>준비 중...</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hk-loading-page {
                    min-height: 60vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    text-align: center;
                }
                .hk-loading-message {
                    margin-bottom: 24px;
                }
                .hk-loading-message p {
                    margin: 8px 0;
                    font-size: 1.1rem;
                    color: #333;
                }
                .hk-loading-sub {
                    font-size: 0.95rem !important;
                    color: #666 !important;
                }
                .hk-loading-spinner {
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e0e0e0;
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: hk-spin 0.8s linear infinite;
                }
                @keyframes hk-spin {
                    to { transform: rotate(360deg); }
                }
                .hk-loading-ad {
                    min-height: 100px;
                    max-width: 600px;
                    width: 100%;
                    margin: 24px auto;
                }
                .hk-loading-message.success .hk-loading-emoji {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 8px;
                }
                .hk-loading-message.error .hk-loading-emoji {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 8px;
                }
                .hk-loading-error-title {
                    font-weight: 700;
                    color: #c00 !important;
                }
                .hk-loading-error-detail {
                    font-size: 0.95rem !important;
                    color: #666 !important;
                    max-width: 360px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .hk-loading-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 24px;
                }
                .hk-loading-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                }
                .hk-loading-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                }
                .hk-loading-btn.secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .hk-loading-btn:hover {
                    opacity: 0.9;
                }
            `}</style>
        </HKLayout>
    );
}
