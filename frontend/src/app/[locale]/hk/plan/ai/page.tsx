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
    const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
    const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
    const [routeSummary, setRouteSummary] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
    const [routeLoadingDay, setRouteLoadingDay] = useState<number | null>(null);
    const [kakaoRouteUrl, setKakaoRouteUrl] = useState<string | null>(null);
    const [showMarkerInfo, setShowMarkerInfo] = useState<boolean>(true);

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

            // 2. Filtering - 장소 선별 단계
            setPlanningStep('filtering');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `여행지 후보 ${selectionData.candidates.length}곳을 찾았습니다! 이제 AI가 최적의 장소를 선별하고 있어요... ✨`
            }]);

            // 3. Optimize Route - 동선 최적화 단계
            setPlanningStep('optimizing');
            const optimizeRes = await fetch(`http://localhost:8000/api/v1/gemini/places/optimize?duration=${encodeURIComponent(data.duration)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectionData)
            });

            if (!optimizeRes.ok) {
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
        // 로그인 여부 확인
        if (!apiClient.auth.isAuthenticated()) {
            showToast('info', '로그인 후 계획을 저장할 수 있습니다.');
            return;
        }

        if (saving) return;

        setSaving(true);
        try {
            await apiClient.hk.createPlan(planData);
            showToast('success', '여행 계획이 저장되었습니다!');
            // 저장 후 내 여행 페이지로 이동
            router.push(`/${locale}/hk/mytravel`);
        } catch (error) {
            console.error('계획 저장 중 오류:', error);
            showToast('error', '계획 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setSaving(false);
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
            setPlanningStep('optimizing');
            setEstimatedTimeRemaining(120);

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

    // AI 계획을 지도용 마커로 변환
    const aiMapMarkers = useMemo(() => {
        if (!finalPlan || !finalPlan.days) return [];
        const markers: {
            lat: number;
            lng: number;
            title?: string;
            description?: string;
            onClick?: () => void;
            day?: number;
        }[] = [];

        try {
            finalPlan.days.forEach((day: any) => {
                (day.schedule || []).forEach((item: any, idx: number) => {
                    // 백엔드 ScheduleItem은 mapy(위도), mapx(경도)로 옴. latitude/longitude도 허용
                    const latRaw = item.latitude ?? item.lat ?? item.mapy;
                    const lngRaw = item.longitude ?? item.lng ?? item.mapx;
                    if (latRaw == null || lngRaw == null) return;
                    const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
                    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

                    const order = idx + 1;
                    const title = showMarkerInfo ? `Day ${day.day} · ${order}. ${item.place}` : undefined;
                    const description = showMarkerInfo
                        ? item.time
                            ? `${item.time}${item.stay_duration ? ` · ${item.stay_duration}` : ''}`
                            : item.stay_duration || ''
                        : undefined;

                    markers.push({
                        lat,
                        lng,
                        day: day.day,
                        title,
                        description,
                        onClick: () =>
                            setSelectedSpot({
                                day: day.day,
                                ...item,
                            }),
                    });
                });
            });
        } catch {
            return [];
        }

        return markers;
    }, [finalPlan, showMarkerInfo]);

    // Day별 길찾기 경로 요청
    const handleShowRouteForDay = async (dayNumber: number) => {
        if (!finalPlan || !finalPlan.days) return;
        const day = finalPlan.days.find((d: any) => d.day === dayNumber);
        if (!day || !day.schedule || day.schedule.length < 2) {
            showToast('info', '해당 Day에는 길찾기를 위한 최소 2개 이상의 장소가 필요합니다.');
            return;
        }

        try {
            setRouteLoadingDay(dayNumber);
            setRoutePath(null);
            setRouteSummary(null);
            setKakaoRouteUrl(null);

            const points = day.schedule
                .map((item: any) => {
                    const latRaw = item.latitude ?? item.lat ?? item.mapy;
                    const lngRaw = item.longitude ?? item.lng ?? item.mapx;
                    if (latRaw == null || lngRaw == null) return null;
                    const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
                    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
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
                showToast('info', '해당 Day의 장소 좌표를 찾을 수 없어 길찾기를 표시할 수 없습니다.');
                return;
            }

            // 카카오맵 웹 길찾기용 URL (출발/도착만 설정)
            const start = points[0];
            const end = points[points.length - 1];
            const kakaoUrl =
                `https://map.kakao.com/?sName=${encodeURIComponent(start.name || '')}` +
                `&sX=${encodeURIComponent(String(start.longitude))}` +
                `&sY=${encodeURIComponent(String(start.latitude))}` +
                `&eName=${encodeURIComponent(end.name || '')}` +
                `&eX=${encodeURIComponent(String(end.longitude))}` +
                `&eY=${encodeURIComponent(String(end.latitude))}`;

            const route = await apiClient.hk.getRoute(points);
            const path = (route.path || []).map((v) => ({
                lat: v.latitude,
                lng: v.longitude,
            }));

            setRoutePath(path);
            setRouteSummary({
                distanceMeters: route.summary?.distance_meters ?? 0,
                durationSeconds: route.summary?.duration_seconds ?? 0,
            });
        } catch (error) {
            console.error('길찾기 경로 조회 오류:', error);
            showToast('error', '길찾기 경로를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setRouteLoadingDay(null);
        }
    };

    const aiMapCenter = aiMapMarkers.length
        ? { lat: aiMapMarkers[0].lat, lng: aiMapMarkers[0].lng }
        : { lat: 37.5665, lng: 126.978 };

    return (
        <HKLayout>
            <div className="ai-chat-container">
                <div className="chat-window">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <div className={`bubble ${msg.plan ? 'plan-result-bubble' : ''}`}>
                                {msg.plan ? (
                                    <PlanResultCard
                                        title={msg.plan.title}
                                        days={msg.plan.days}
                                        onSave={handleSavePlan}
                                        onEdit={handleEditClick}
                                        saving={saving}
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
                    ))}

                    {/* AI 최종 계획이 생성된 후, 채팅 흐름 안에서 지도 표시 */}
                    {finalPlan && (
                        <div className="message assistant">
                            <div className="bubble plan-result-bubble">
                                <div className="ai-map-in-chat">
                                    <div className="ai-map-title-row">
                                        <div className="ai-map-title">
                                            지도에서 보기
                                        </div>
                                        <button
                                            type="button"
                                            className="ai-marker-toggle-button"
                                            onClick={() => setShowMarkerInfo((prev) => !prev)}
                                        >
                                            {showMarkerInfo ? '마커 설명 끄기' : '마커 설명 켜기'}
                                        </button>
                                    </div>
                                    {finalPlan.days && (
                                        <div className="ai-route-day-buttons">
                                            {finalPlan.days.map((day: any) => (
                                                <button
                                                    key={day.day}
                                                    type="button"
                                                    className={`ai-route-day-button${
                                                        routeLoadingDay === day.day ? ' loading' : ''
                                                    }`}
                                                    onClick={() => handleShowRouteForDay(day.day)}
                                                >
                                                    {routeLoadingDay === day.day ? '계산 중...' : `Day ${day.day} 길찾기`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <KakaoMapScript />
                                    <KakaoMap
                                        center={aiMapCenter}
                                        level={7}
                                        markers={aiMapMarkers}
                                        path={routePath || undefined}
                                        className="ai-map"
                                        style={{ height: 'min(400px, 50vh)', width: '100%' }}
                                    />
                                    {routeSummary && (
                                        <div className="ai-route-summary">
                                            <span>
                                                총 거리:{' '}
                                                {(routeSummary.distanceMeters / 1000).toFixed(1)} km
                                            </span>
                                            <span>
                                                예상 소요 시간:{' '}
                                                {Math.round(routeSummary.durationSeconds / 60)}분
                                            </span>
                                        </div>
                                    )}
                                    {kakaoRouteUrl && (
                                        <div className="ai-kakao-iframe-wrapper">
                                            <iframe
                                                title="카카오맵 길찾기"
                                                src={kakaoRouteUrl}
                                                className="ai-kakao-iframe"
                                                style={{ width: '100%', border: 'none' }}
                                                height={400}
                                                allow="fullscreen"
                                            />
                                        </div>
                                    )}
                                    {selectedSpot && (
                                        <div className="plan-map-selected">
                                            <div className="plan-map-selected-title">
                                                Day {selectedSpot.day} · {selectedSpot.place}
                                            </div>
                                            {selectedSpot.description && (
                                                <div className="plan-map-selected-address">{selectedSpot.description}</div>
                                            )}
                                            <div className="plan-map-selected-time">
                                                {selectedSpot.time || ''}
                                                {(selectedSpot.time && selectedSpot.stay_duration) ? ' · ' : ''}
                                                {selectedSpot.stay_duration || ''}
                                                {selectedSpot.type ? ` · ${selectedSpot.type}` : ''}
                                            </div>
                                            {selectedSpot.place_id ? (
                                                <button
                                                    type="button"
                                                    className="plan-map-selected-link"
                                                    onClick={() => window.open(`/${locale}/hk/${selectedSpot.place_id}`, '_blank')}
                                                >
                                                    장소 상세 보기
                                                </button>
                                            ) : null}
                                        </div>
                                    )}
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

        .ai-map {
          border-radius: 12px;
          overflow: hidden;
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
