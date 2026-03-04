'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';
import { PlanningStep } from '../../../../../components/hk/ai/PlanningProgress';
import PlanResultCard from '../../../../../components/hk/ai/PlanResultCard';
import { KakaoMapScript, KakaoMap } from '../../../../../components/hk/map';
import apiClient, { type PlanItem, type Plan } from '../../../../../lib/api-client';

interface ChatMessage {
    role: 'user' | 'assistant';
    content?: string;
    plan?: any;
}

export default function AIPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const { showToast } = useToast();

    const editMode = searchParams?.get('editMode') === 'true';
    const planId = searchParams?.get('planId') || '';

    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: editMode 
            ? '기존 여행 계획을 수정해드리겠습니다. 어떤 부분을 수정하고 싶으신가요?'
            : '안녕하세요! 여행 계획을 도와드릴 AI 가이드입니다. 여행하고 싶은 지역은 어디인가요?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'region' | 'duration' | 'themes' | 'companions' | 'planning'>('region');
    const [planningStep, setPlanningStep] = useState<PlanningStep | null>(null);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>(undefined);
    const [finalPlan, setFinalPlan] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(editMode);
    const [editingRequest, setEditingRequest] = useState<string>('');
    const [existingPlan, setExistingPlan] = useState<any>(null);
    const [activeMapDay, setActiveMapDay] = useState<number>(1);
    const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
    const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
    const [hoverPath, setHoverPath] = useState<{ lat: number; lng: number }[] | null>(null);
    const [routeLoadingDay, setRouteLoadingDay] = useState<number | null>(null);
    // 백엔드에서 좌표를 못 찾은 장소 → 프론트에서 검색으로 보완
    const [enrichedCoords, setEnrichedCoords] = useState<Record<string, { lat: number; lng: number }>>({});

    // Temporary state to store collected data
    const [planData, setPlanData] = useState({
        region: '',
        duration: '',
        themes: '',
        companions: ''
    });

    // 기존 계획 로딩 (수정 모드일 때)
    useEffect(() => {
        if (editMode && planId) {
            const loadExistingPlan = async () => {
                try {
                    const plan: Plan = await apiClient.hk.getPlan(planId);
                    setExistingPlan(plan);
                    
                    // 기존 계획 정보를 planData에 설정
                    const startDate = (plan as any).start_date || '';
                    const endDate = (plan as any).end_date || '';
                    
                    if (startDate && endDate) {
                        const s = new Date(startDate);
                        const e = new Date(endDate);
                        const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                        const duration = `${diff}박 ${diff + 1}일`;
                        
                        setPlanData(prev => ({
                            ...prev,
                            duration: duration,
                            // 지역 정보는 계획에서 추출하거나 기본값 사용
                            region: prev.region || '기존 지역',
                        }));
                    }
                } catch (error) {
                    console.error('기존 계획 로딩 실패:', error);
                    showToast('error', '기존 계획을 불러오는 중 오류가 발생했습니다.');
                }
            };
            loadExistingPlan();
        }
    }, [editMode, planId, showToast]);

    // 좌표 없는 장소 → 장소명+지역으로 검색하여 좌표 보완
    useEffect(() => {
        if (!finalPlan?.days || !planData.region) return;
        const toFetch: { key: string; place: string }[] = [];
        finalPlan.days.forEach((day: any) => {
            (day.schedule || []).forEach((item: any, idx: number) => {
                const latRaw = item.latitude ?? item.lat ?? item.mapy;
                const lngRaw = item.longitude ?? item.lng ?? item.mapx;
                if (latRaw == null || lngRaw == null) {
                    const key = `${day.day}-${idx}-${item.place}`;
                    if (!enrichedCoords[key]) toFetch.push({ key, place: item.place });
                }
            });
        });
        if (toFetch.length === 0) return;
        let cancelled = false;
        const run = async () => {
            for (const { key, place } of toFetch) {
                if (cancelled) return;
                try {
                    const region = planData.region || '';
                    // 검색 키워드는 장소명만 사용 (region 합치지 않음)
                    const res = await apiClient.hk.searchPlaces(place, 1, 1, region || undefined);
                    const places = res?.places ?? [];
                    if (places.length > 0 && places[0].latitude != null && places[0].longitude != null) {
                        setEnrichedCoords(prev => ({
                            ...prev,
                            [key]: { lat: places[0].latitude!, lng: places[0].longitude! },
                        }));
                    }
                } catch {
                    // 무시
                }
            }
        };
        run();
        return () => { cancelled = true; };
    }, [finalPlan, planData.region]);

    // 로그인 후 복귀: 임시 저장된 계획 복원 → 화면에 계획 + 저장 버튼 표시
    useEffect(() => {
        const shouldRestore = searchParams?.get('restoreDraft') === '1' && !editMode;
        if (!shouldRestore) return;
        try {
            const raw = sessionStorage.getItem('hk_draft_plan');
            if (!raw) return;
            const draft = JSON.parse(raw) as { planData?: unknown; finalPlan?: unknown };
            if (draft.finalPlan) {
                setFinalPlan(draft.finalPlan);
                setMessages(prev => {
                    if (prev.some(m => m.plan)) return prev;
                    return [...prev, { role: 'assistant', plan: draft.finalPlan }];
                });
                showToast('success', '로그인되었습니다. 아래 "저장하기" 버튼으로 계획을 저장해 주세요.');
            }
        } catch (e) {
            console.error('임시 계획 복원 실패:', e);
        }
    }, [searchParams, editMode, showToast]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            // 수정 모드일 때
            if (isEditingMode) {
                await handleEditRequest(userMsg);
                return;
            }

            // Simple state machine for demo
            let nextStep = step;
            let aiResponse = "";
            let newPlanData = { ...planData };

            if (step === 'region') {
                newPlanData.region = userMsg;
                nextStep = 'duration';
                aiResponse = `좋아요, ${userMsg} 여행이군요! 여행 기간은 어떻게 되시나요? (예: 1박 2일)`;
            } else if (step === 'duration') {
                newPlanData.duration = userMsg;
                nextStep = 'themes';
                aiResponse = "알겠습니다. 이번 여행의 테마나 선호하는 스타일이 있나요? (예: 힐링, 맛집탐방, 역사)";
            } else if (step === 'themes') {
                newPlanData.themes = userMsg;
                nextStep = 'companions';
                aiResponse = "마지막으로, 누구와 함께 가시나요? (예: 연인, 가족, 친구, 혼자)";
            } else if (step === 'companions') {
                newPlanData.companions = userMsg;
                nextStep = 'planning';
                aiResponse = "모든 정보를 확인했습니다. 최고의 여행 계획을 짜고 있습니다... 잠시만 기다려주세요! 🤖✨";

                // Trigger planning immediately after this message
                setPlanData(newPlanData);
                setStep(nextStep);
                setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

                // Call Backend API
                await generatePlan(newPlanData);
                return;
            }

            setPlanData(newPlanData);
            setStep(nextStep);
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

        } catch (error) {
            console.error(error);
            showToast('error', '오류가 발생했습니다.');
        } finally {
            if (step !== 'companions') { // Don't turn off loading if we entered planning phase
                setIsLoading(false);
            }
        }
    };

    const generatePlan = async (data: any) => {
        const startTime = Date.now();
        const totalEstimatedTime = 120; // 총 예상 시간 2분 (120초)
        let timeElapsed = 0;

        // 시간 업데이트 인터벌
        const timeInterval = setInterval(() => {
            timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, totalEstimatedTime - timeElapsed);
            setEstimatedTimeRemaining(remaining);
        }, 1000);

        try {
            // 1. Select Places - 여행지 검색 단계 (인기 장소 카드는 사용하지 않음)
            setPlanningStep('selecting');
            setEstimatedTimeRemaining(totalEstimatedTime);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '여행지 후보를 열심히 검색하고 있어요... 🔍',
                },
            ]);

            // Convert comma-separated themes string to array
            const requestData = {
                ...data,
                themes: data.themes.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            };

            const selectRes = await fetch('http://localhost:8000/api/v1/gemini/places/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!selectRes.ok) {
                const errorText = await selectRes.text();
                console.error('Place selection error:', errorText);
                throw new Error(`Place selection failed: ${errorText}`);
            }
            const selectionData = await selectRes.json();

            // 2. Filtering - 장소 후보 수집/정리 단계
            setPlanningStep('filtering');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `여행지 후보 ${selectionData.candidates.length}곳을 찾았습니다! 지역 내 숨은 명소와 핫플레이스를 정리하고 있어요... ✨`
            }]);

            // 2.5. Validating - Google 평점/리뷰 기반 품질 검증 단계
            setPlanningStep('validating');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Google 평점과 최신 리뷰를 대조해 장소의 품질을 엄격하게 검증하고 있어요... ✅',
            }]);

            // 3. Optimize Route - 동선 최적화 단계
            setPlanningStep('optimizing');
            const optimizeRes = await fetch(
                `http://localhost:8000/api/v1/gemini/places/optimize?duration=${encodeURIComponent(
                    data.duration,
                )}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(selectionData),
                },
            );

            if (!optimizeRes.ok) {
                // 422: 품질 기준을 모두 만족하지 못한 경우 → 사용자 친화적으로 안내
                if (optimizeRes.status === 422) {
                    let detail = '';
                    try {
                        const errJson = await optimizeRes.json();
                        detail = typeof errJson?.detail === 'string' ? errJson.detail : '';
                    } catch {
                        // 텍스트만 있는 경우 대비
                        const errText = await optimizeRes.text();
                        detail = errText;
                    }

                    console.warn('Optimization quality gate 422:', detail);
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content:
                                '지금 설정된 Google 평점 기준으로는 추천할 수 있는 장소를 찾기 어려웠어요.\n\n' +
                                '· 기준 예시: 평점 3.0점 이상, 리뷰 30개 이상\n' +
                                '· 지역명을 조금 넓게 쓰거나 (예: \"강원도 강릉\" 대신 \"강릉\"),\n' +
                                '  다른 테마(힐링, 자연, 맛집 등)를 함께 적어주시면 더 많은 후보를 찾을 수 있어요.\n\n' +
                                (detail ? `서버 메시지: ${detail}` : ''),
                        },
                    ]);
                    setFinalPlan(null);
                    return;
                }

                const errorText = await optimizeRes.text();
                console.error('Optimization error:', errorText);
                throw new Error(`Optimization failed: ${errorText}`);
            }
            const finalPlan = await optimizeRes.json();

            // 4. Finalizing - 일정 구성 단계
            setPlanningStep('finalizing');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `최적의 동선을 계산했습니다! 이제 완벽한 일정을 구성하고 있어요... 📅`
            }]);

            // 품질 기준이 완화된 경우, 사용자에게 한 번 안내
            if (finalPlan.quality_level === 'relaxed' && typeof finalPlan.quality_message === 'string') {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: finalPlan.quality_message as string,
                    },
                ]);
            }

            // Save final plan to state
            setFinalPlan(finalPlan);
            
            // Success 메시지와 함께 계획 카드 메시지를 채팅 흐름에 추가
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `🎉 완벽한 여행 계획이 완성되었어요!`
                },
                {
                    role: 'assistant',
                    plan: finalPlan
                }
            ]);

        } catch (e) {
            console.error('Plan generation error:', e);
            const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류';
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `죄송합니다, 계획 생성 중 오류가 발생했습니다.\n\n오류 내용: ${errorMessage}\n\n다시 시도해주세요.` 
            }]);
            setFinalPlan(null);
        } finally {
            clearInterval(timeInterval);
            setPlanningStep(null);
            setEstimatedTimeRemaining(undefined);
            setIsLoading(false);
        }
    };

    const handleSavePlan = async (planData: {
        title: string;
        start_date: string;
        end_date: string;
        items: PlanItem[];
    }) => {
        // 비로그인: ① 브라우저 임시 저장소에 계획 저장 → ② 로그인 페이지로 이동 → ③ 로그인 후 돌아오면 복원
        if (!apiClient.auth.isAuthenticated()) {
            try {
                const draft = { planData, finalPlan };
                sessionStorage.setItem('hk_draft_plan', JSON.stringify(draft));
            } catch (e) {
                console.error('임시 저장 실패:', e);
                showToast('error', '임시 저장에 실패했습니다.');
                return;
            }
            showToast('info', '저장하려면 로그인이 필요합니다. 로그인 후 계획을 저장할 수 있어요.');
            const returnPath = `/${locale}/hk/plan/ai?restoreDraft=1`;
            // router.push가 동작하지 않는 경우가 있어 페이지 이동으로 처리
            window.location.href = `/${locale}/hk/login?returnUrl=${encodeURIComponent(returnPath)}`;
            return;
        }

        if (saving) return;

        try {
            sessionStorage.setItem('hk_pending_save', JSON.stringify({ planData }));
            window.location.href = `/${locale}/hk/loading?type=plan-save`;
        } catch (e) {
            console.error('저장 준비 실패:', e);
            showToast('error', '저장 준비에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    const handleEditClick = () => {
        setIsEditingMode(true);
        setEditingRequest('');
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '어떤 부분을 수정하고 싶으신가요? 예를 들어:\n- 특정 장소를 다른 장소로 변경\n- 시간대 조정\n- 장소 추가/제거\n- 전체적인 스타일 변경\n\n원하시는 수정 사항을 자유롭게 말씀해주세요! ✏️'
        }]);
    };

    const handleEditRequest = async (userRequest: string) => {
        const planToUse = finalPlan || existingPlan;
        if (!planToUse) {
            showToast('error', '계획 정보를 찾을 수 없습니다.');
            return;
        }

        try {
            // 수정 모드 전용 진행 상태 표시
            setPlanningStep('optimizing');
            setEstimatedTimeRemaining(120);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        '수정 요청을 분석해서 기존 일정을 기준으로 다시 최적화하고 있어요...\n' +
                        `요청 내용: "${userRequest}"`,
                },
            ]);

            // 기존 계획을 candidates 형태로 변환
            let existingCandidates;
            if (planToUse.days) {
                // AI 생성 계획 형식
                existingCandidates = planToUse.days.flatMap((day: any) =>
                    day.schedule.map((item: any) => ({
                        name: item.place,
                        type: item.type,
                        reason: item.description || `${item.type} 방문`
                    }))
                );
            } else if (planToUse.items) {
                // 수동 생성 계획 형식 - items를 candidates로 변환
                existingCandidates = await Promise.all(
                    (planToUse.items as PlanItem[]).map(async (item) => {
                        try {
                            const placeDetail = await apiClient.hk.getPlaceDetail(item.place_id);
                            return {
                                name: placeDetail.title || placeDetail.place_name || item.place_id,
                                type: placeDetail.category || '관광지',
                                reason: '기존 계획에 포함된 장소'
                            };
                        } catch {
                            return {
                                name: item.place_id,
                                type: '관광지',
                                reason: '기존 계획에 포함된 장소'
                            };
                        }
                    })
                );
            } else {
                existingCandidates = [];
            }

            // 수정 요청을 포함한 최적화 API 호출
            const requestBody = {
                region: planData.region || '기존 지역',
                candidates: existingCandidates,
                existingPlan: planToUse  // 수정 모드일 때 기존 계획 포함
            };

            const optimizeRes = await fetch(`http://localhost:8000/api/v1/gemini/places/optimize?duration=${encodeURIComponent(planData.duration)}&editRequest=${encodeURIComponent(userRequest)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!optimizeRes.ok) {
                const errorText = await optimizeRes.text();
                console.error('Plan edit error:', errorText);
                throw new Error(`Plan edit failed: ${errorText}`);
            }

            const updatedPlan = await optimizeRes.json();
            // 최신 계획으로 상태 업데이트
            setFinalPlan(updatedPlan);
            setIsEditingMode(false);
            setEditingRequest('');

            // 수정 완료 메시지와 함께 수정된 계획 카드를 채팅 흐름에 추가
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `✅ 수정이 완료되었어요! 변경된 계획을 확인해보세요.`
                },
                {
                    role: 'assistant',
                    plan: updatedPlan
                }
            ]);

        } catch (e) {
            console.error('Plan edit error:', e);
            const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `죄송합니다, 계획 수정 중 오류가 발생했습니다.\n\n오류 내용: ${errorMessage}\n\n다시 시도해주세요.`
            }]);
        } finally {
            setPlanningStep(null);
            setEstimatedTimeRemaining(undefined);
            setIsLoading(false);
        }
    };

    // AI 계획을 지도용 마커로 변환 (선택된 Day만, 마커 클릭 시 세부정보 팝업)
    const aiMapMarkers = useMemo(() => {
        if (!finalPlan || !finalPlan.days) return [];
        const day = finalPlan.days.find((d: any) => d.day === activeMapDay);
        if (!day || !day.schedule) return [];
        const markers: {
            lat: number;
            lng: number;
            title?: string;
            description?: string;
            number?: number;
            onClick?: () => void;
        }[] = [];

        try {
            (day.schedule || []).forEach((item: any, idx: number) => {
                let lat: number;
                let lng: number;
                const latRaw = item.latitude ?? item.lat ?? item.mapy;
                const lngRaw = item.longitude ?? item.lng ?? item.mapx;
                if (latRaw != null && lngRaw != null) {
                    lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
                    lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
                } else {
                    const key = `${day.day}-${idx}-${item.place}`;
                    const enriched = enrichedCoords[key];
                    if (!enriched) return;
                    lat = enriched.lat;
                    lng = enriched.lng;
                }
                if (Number.isNaN(lat) || Number.isNaN(lng)) return;

                markers.push({
                    lat,
                    lng,
                    title: item.place,
                    description: item.description,
                    number: idx + 1,
                    onClick: () =>
                        setSelectedSpot({
                            day: day.day,
                            ...item,
                        }),
                });
            });
        } catch {
            return [];
        }

        return markers;
    }, [finalPlan, enrichedCoords, activeMapDay]);

    // Day 버튼 클릭 시 해당 Day 지도 표시 (경로선은 아래 useEffect에서 로드)
    const handleShowMapForDay = (dayNumber: number) => {
        setActiveMapDay(dayNumber);
    };

    // 선택된 Day의 경로선 로드 (2개 이상 장소일 때만)
    useEffect(() => {
        if (!finalPlan?.days || !enrichedCoords) return;
        const day = finalPlan.days.find((d: any) => d.day === activeMapDay);
        if (!day?.schedule || day.schedule.length < 2) {
            setRoutePath(null);
            return;
        }

        let cancelled = false;
        const points = day.schedule
            .map((item: any, idx: number) => {
                let lat: number;
                let lng: number;
                const latRaw = item.latitude ?? item.lat ?? item.mapy;
                const lngRaw = item.longitude ?? item.lng ?? item.mapx;
                if (latRaw != null && lngRaw != null) {
                    lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
                    lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
                } else {
                    const key = `${day.day}-${idx}-${item.place}`;
                    const enriched = enrichedCoords[key];
                    if (!enriched) return null;
                    lat = enriched.lat;
                    lng = enriched.lng;
                }
                if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
                return {
                    place_id: item.place_id,
                    name: item.place,
                    latitude: lat,
                    longitude: lng,
                };
            })
            .filter((p: any) => p !== null);

        if (points.length < 2) {
            setRoutePath(null);
            return;
        }

        setRouteLoadingDay(activeMapDay);
        setRoutePath(null);
        apiClient.hk
            .getRoute(points)
            .then((route) => {
                if (cancelled) return;
                setRoutePath(
                    (route.path || []).map((v) => ({ lat: v.latitude, lng: v.longitude }))
                );
            })
            .catch((err) => {
                if (!cancelled) console.error('경로 로드 오류:', err);
            })
            .finally(() => {
                if (!cancelled) setRouteLoadingDay(null);
            });

        return () => {
            cancelled = true;
        };
    }, [finalPlan, activeMapDay, enrichedCoords]);

    const aiMapCenter = useMemo(() => {
        if (routePath && routePath.length > 0) {
            const lats = routePath.map((p) => p.lat);
            const lngs = routePath.map((p) => p.lng);
            return {
                lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            };
        }
        if (aiMapMarkers.length > 0) {
            return { lat: aiMapMarkers[0].lat, lng: aiMapMarkers[0].lng };
        }
        return { lat: 37.5665, lng: 126.978 };
    }, [routePath, aiMapMarkers]);

    return (
        <HKLayout>
            <div className="ai-chat-container">
                <div className="chat-window">
                    {messages.map((msg, idx) => {
                        const activePlan = msg.plan
                            ? (finalPlan && finalPlan.days ? finalPlan : msg.plan)
                            : null;

                        return (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className={`bubble ${activePlan ? 'plan-result-bubble' : ''}`}>
                                    {activePlan ? (
                                        <PlanResultCard
                                            title={activePlan.title}
                                            days={activePlan.days}
                                            onSave={handleSavePlan}
                                            onEdit={handleEditClick}
                                            saving={saving}
                                            recommendedAccommodations={activePlan.recommended_accommodations}
                                            onSelectAccommodation={(day, acc) => {
                                                if (!finalPlan?.days) return;
                                                setFinalPlan((prev: any) => {
                                                    if (!prev?.days) return prev;
                                                    const next = { ...prev, days: [...prev.days] };
                                                    const dayIndex = next.days.findIndex((d: any) => d.day === day);
                                                    if (dayIndex === -1) return prev;
                                                    const dayPlan = { ...next.days[dayIndex] };
                                                    const schedule = [...dayPlan.schedule];
                                                    // 마지막 숙소 아이템 찾기
                                                    let lastIdx = -1;
                                                    for (let i = schedule.length - 1; i >= 0; i -= 1) {
                                                        if ((schedule[i].type || '').includes('숙소')) {
                                                            lastIdx = i;
                                                            break;
                                                        }
                                                    }
                                                    const targetIdx =
                                                        lastIdx >= 0 ? lastIdx : Math.max(schedule.length - 1, 0);
                                                    const base = schedule[targetIdx];
                                                    const updated = {
                                                        ...base,
                                                        place: acc.name,
                                                        place_id: acc.place_id || base.place_id,
                                                    // 숙소 카드에서 선택한 주소를 우선 반영해,
                                                    // 일정표에 보이는 숙소 주소도 함께 변경되도록 한다.
                                                    description:
                                                        acc.address ||
                                                        base.description ||
                                                        '하루 일정을 마친 뒤 휴식',
                                                    };
                                                    if (acc.latitude != null && acc.longitude != null) {
                                                        updated.mapy = String(acc.latitude);
                                                        updated.mapx = String(acc.longitude);
                                                    }
                                                    schedule[targetIdx] = updated;
                                                    dayPlan.schedule = schedule;
                                                    next.days[dayIndex] = dayPlan;
                                                    return next;
                                                });
                                            }}
                                            onHoverAccommodation={(day, acc) => {
                                                if (!acc || !finalPlan?.days) {
                                                    setHoverPath(null);
                                                    return;
                                                }
                                                const dayPlan = finalPlan.days.find((d: any) => d.day === day);
                                                if (!dayPlan || !dayPlan.schedule?.length) {
                                                    setHoverPath(null);
                                                    return;
                                                }
                                                // 오늘 마지막 좌표를 가진 일정 찾기
                                                let lastItem: any | null = null;
                                                for (let i = dayPlan.schedule.length - 1; i >= 0; i -= 1) {
                                                    const it = dayPlan.schedule[i];
                                                    const latRaw = it.latitude ?? it.lat ?? it.mapy;
                                                    const lngRaw = it.longitude ?? it.lng ?? it.mapx;
                                                    if (latRaw != null && lngRaw != null) {
                                                        lastItem = it;
                                                        break;
                                                    }
                                                }
                                                if (!lastItem || acc.latitude == null || acc.longitude == null) {
                                                    setHoverPath(null);
                                                    return;
                                                }
                                                const latEnd = typeof (lastItem.latitude ?? lastItem.mapy) === 'string'
                                                    ? parseFloat(lastItem.latitude ?? lastItem.mapy)
                                                    : Number(lastItem.latitude ?? lastItem.mapy);
                                                const lngEnd = typeof (lastItem.longitude ?? lastItem.mapx) === 'string'
                                                    ? parseFloat(lastItem.longitude ?? lastItem.mapx)
                                                    : Number(lastItem.longitude ?? lastItem.mapx);
                                                if (Number.isNaN(latEnd) || Number.isNaN(lngEnd)) {
                                                    setHoverPath(null);
                                                    return;
                                                }
                                                setHoverPath([
                                                    { lat: latEnd, lng: lngEnd },
                                                    { lat: acc.latitude, lng: acc.longitude },
                                                ]);
                                            }}
                                        />
                                    ) : (
                                    <>
                                        {msg.content && msg.content.startsWith('여행지 후보를 열심히 검색하고 있어요') ? (
                                            <div className="ai-loading-message">
                                                <span>여행지 후보를 열심히 검색하고 있어요</span>
                                                <span className="dots">
                                                    <span>.</span>
                                                    <span>.</span>
                                                    <span>.</span>
                                                </span>
                                                <span> 🔍</span>
                                            </div>
                                        ) : (
                                            msg.content?.split('\n').map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))
                                        )}
                                    </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* AI 최종 계획이 생성된 후, 채팅 흐름 안에서 지도 표시 */}
                    {finalPlan && (
                        <div className="message assistant">
                            <div className="bubble plan-result-bubble">
                                <div className="ai-map-in-chat">
                                    {finalPlan.days && (
                                        <div className="ai-route-day-buttons">
                                            {finalPlan.days.map((day: any) => (
                                                <button
                                                    key={day.day}
                                                    type="button"
                                                    className={`ai-route-day-button${
                                                        activeMapDay === day.day ? ' active' : ''
                                                    }${routeLoadingDay === day.day ? ' loading' : ''}`}
                                                    onClick={() => handleShowMapForDay(day.day)}
                                                >
                                                    {routeLoadingDay === day.day ? '계산 중...' : `Day ${day.day}`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="ai-map-wrap">
                                        {routeLoadingDay !== null && (
                                            <div className="ai-map-loading">경로를 계산하고 있어요...</div>
                                        )}
                                        <KakaoMapScript />
                                        <KakaoMap
                                            center={aiMapCenter}
                                            level={6}
                                            markers={aiMapMarkers}
                                            path={hoverPath || routePath || undefined}
                                            fitToView
                                            className="ai-map"
                                            style={{ height: 'min(480px, 55vh)', width: '100%' }}
                                        />
                                        {selectedSpot && (
                                            <>
                                                <div
                                                    className="ai-spot-card-backdrop"
                                                    onClick={() => setSelectedSpot(null)}
                                                    aria-hidden
                                                />
                                                <div
                                                    className="ai-spot-card"
                                                    onClick={(e) => e.stopPropagation()}
                                                    role="dialog"
                                                    aria-label="장소 세부정보"
                                                >
                                                    <button
                                                    type="button"
                                                    className="ai-spot-card-close"
                                                    onClick={() => setSelectedSpot(null)}
                                                    aria-label="닫기"
                                                >
                                                    ×
                                                </button>
                                                <div className="ai-spot-card-title">{selectedSpot.place}</div>
                                                {selectedSpot.description && (
                                                    <div className="ai-spot-card-desc">{selectedSpot.description}</div>
                                                )}
                                                <div className="ai-spot-card-meta">
                                                    {selectedSpot.time || ''}
                                                    {(selectedSpot.time && selectedSpot.stay_duration) ? ' · ' : ''}
                                                    {selectedSpot.stay_duration || ''}
                                                    {selectedSpot.type ? ` · ${selectedSpot.type}` : ''}
                                                </div>
                                                {selectedSpot.place_id ? (
                                                    <button
                                                        type="button"
                                                        className="ai-spot-card-link"
                                                        onClick={() => window.open(`/${locale}/hk/${selectedSpot.place_id}`, '_blank')}
                                                    >
                                                        장소 상세 보기
                                                    </button>
                                                ) : null}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && !planningStep && (
                        <div className="message assistant">
                            <div className="bubble typing">...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isEditingMode ? "수정 사항을 입력해주세요..." : "메시지를 입력하세요..."}
                        // 계획 생성/수정 중이거나, 계획이 완성되었지만 아직 수정 모드를 켜지 않은 경우 비활성화
                        disabled={
                            isLoading ||
                            !!planningStep ||          // AI가 계획을 생성/최적화하는 중
                            (!isEditingMode && !!finalPlan) // 계획이 완성됐지만 '수정하기'를 누르기 전
                        }
                    />
                    <button
                        onClick={handleSend}
                        disabled={
                            isLoading ||
                            !!planningStep ||
                            (!isEditingMode && !!finalPlan)
                        }
                    >
                        전송
                    </button>
                </div>
            </div>

            <style jsx>{`
        .ai-chat-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-window {
          flex: 1;
          background: #f8f9fa;
          border-radius: 20px;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .message {
          display: flex;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .bubble {
          max-width: 70%;
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 1rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message.user .bubble {
          background: #0064ff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.assistant .bubble {
          background: white;
          color: #333;
          border: 1px solid #ddd;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .plan-result-bubble {
          max-width: 100% !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        .message.assistant:has(.ai-map-in-chat) {
          width: 100%;
        }

        .message.assistant:has(.ai-map-in-chat) .bubble {
          width: 100%;
        }

        .ai-map-in-chat {
          margin-top: 8px;
          width: 100%;
          min-width: 0;
        }

        .ai-map-in-chat .ai-map {
          width: 100% !important;
          min-width: 0;
        }

        .ai-loading-message {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .ai-loading-message .dots {
          display: inline-flex;
          margin-left: 2px;
        }

        .ai-loading-message .dots span {
          opacity: 0;
          animation: dotBlink 1.2s infinite;
        }

        .ai-loading-message .dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-loading-message .dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dotBlink {
          0%, 20% { opacity: 0; }
          40%, 100% { opacity: 1; }
        }

        .input-area {
          display: flex;
          gap: 10px;
        }

        input {
          flex: 1;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 30px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.3s;
        }

        input:focus {
          border-color: #0064ff;
        }

        button {
          background: #0064ff;
          color: white;
          border: none;
          padding: 0 30px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        button:hover {
          background: #0056e6;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .ai-map-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .ai-map-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .ai-marker-toggle-button {
          border: 1px solid #d0d7de;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.8rem;
          background: #ffffff;
          color: #2c3e50;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s;
        }

        .ai-marker-toggle-button:hover {
          background: #f3f4f6;
          border-color: #1890ff;
        }

        .ai-route-day-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .ai-route-day-button {
          border: 1px solid #d0d7de;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.85rem;
          background: #ffffff;
          color: #2c3e50;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.1s;
        }

        .ai-route-day-button:hover {
          background: #f3f4f6;
          border-color: #1890ff;
        }

        .ai-route-day-button.loading {
          background: #e6f4ff;
          border-color: #1890ff;
          color: #1890ff;
          cursor: default;
        }

        .ai-route-day-button.active {
          background: #1890ff;
          border-color: #1890ff;
          color: #fff;
        }

        .ai-map-wrap {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }

        .ai-map-loading {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          z-index: 10;
        }

        .ai-map {
          border-radius: 12px;
          overflow: hidden;
        }

        .ai-spot-card-backdrop {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: transparent;
          cursor: default;
        }

        .ai-spot-card {
          position: absolute;
          left: 50%;
          top: 20px;
          transform: translateX(-50%);
          z-index: 10;
          width: calc(100% - 32px);
          max-width: 420px;
          padding: 20px 24px;
          padding-top: 36px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          cursor: default;
          text-align: center;
        }

        .ai-spot-card-close {
          position: absolute;
          top: 8px;
          right: 12px;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          background: transparent;
          color: #888;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.2s, background 0.2s;
        }

        .ai-spot-card-close:hover {
          color: #333;
          background: #f0f0f0;
        }

        .ai-spot-card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .ai-spot-card-desc {
          font-size: 0.95rem;
          color: #555;
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .ai-spot-card-meta {
          font-size: 0.85rem;
          color: #888;
          margin-bottom: 12px;
        }

        .ai-spot-card-link {
          display: inline-block;
          padding: 8px 16px;
          background: #1890ff;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-spot-card-link:hover {
          background: #0d7de0;
        }

        .ai-route-summary {
          margin-top: 8px;
          font-size: 0.85rem;
          color: #495057;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ai-kakao-iframe-wrapper {
          margin-top: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

        .ai-kakao-iframe {
          display: block;
        }

        .ai-map-selected {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .ai-map-selected-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .ai-map-selected-time {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 4px;
        }

        .ai-map-selected-type {
          font-size: 0.82rem;
          color: #495057;
        }
      `}</style>
        </HKLayout>
    );
}
