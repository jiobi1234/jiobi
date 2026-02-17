'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import type { PlanItem } from '../../../lib/api-client';
import { getStringParam } from '../../../utils/typeGuards';
import { useToast } from '../common/Toast';

interface ScheduleItem {
  time: string;
  place: string;
  type: string;
  description?: string;
  stay_duration?: string;
  travel_time_next?: string;
  distance_next?: string;
  place_id?: string;
  travel_time_next_car?: string;
  travel_time_next_walk?: string;
}

interface DayPlan {
  day: number;
  schedule: ScheduleItem[];
}

interface PlanResultCardProps {
  title: string;
  days: DayPlan[];
  onSave?: (planData: {
    title: string;
    start_date: string;
    end_date: string;
    items: PlanItem[];
  }) => void;
  onEdit?: () => void;
  saving?: boolean;
}

const getTypeIcon = (type: string): string => {
  const typeMap: Record<string, string> = {
    '관광지': '🏛️',
    '음식점': '🍽️',
    '카페': '☕',
    '숙소': '🏨',
    '쇼핑': '🛍️',
    '문화시설': '🎭',
  };
  return typeMap[type] || '📍';
};

const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    '관광지': '#667eea',
    '음식점': '#f59e0b',
    '카페': '#8b4513',
    '숙소': '#22a6b3',
    '쇼핑': '#e91e63',
    '문화시설': '#9c27b0',
  };
  return colorMap[type] || '#666';
};

export default function PlanResultCard({ title, days, onSave, onEdit, saving }: PlanResultCardProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // 기본 첫 날 펼침
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const { showToast } = useToast();

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handlePlaceClick = (item: ScheduleItem) => {
    const placeId = item.place_id;
    if (!placeId) {
      showToast('info', '세부정보를 찾을 수 없습니다.');
      return;
    }
    const url = `/${locale}/hk/${encodeURIComponent(placeId)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="plan-result-card">
      <div className="plan-header">
        <div className="plan-title-section">
          <span className="celebration-icon">🎉</span>
          <h3 className="plan-title">{title}</h3>
        </div>
        <p className="plan-subtitle">완벽한 여행 계획이 완성되었어요!</p>
      </div>

      <div className="days-container">
        {days.map((dayPlan) => {
          const isExpanded = expandedDays.has(dayPlan.day);
          const scheduleCount = dayPlan.schedule.length;

          return (
            <div key={dayPlan.day} className="day-section">
              <button
                className={`day-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleDay(dayPlan.day)}
                aria-expanded={isExpanded}
              >
                <div className="day-header-left">
                  <span className="day-icon">📅</span>
                  <span className="day-label">Day {dayPlan.day}</span>
                  <span className="day-count">{scheduleCount}개 장소</span>
                </div>
                <span className="day-toggle">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="day-content">
                  {dayPlan.schedule.map((item, idx) => {
                    const isLast = idx === dayPlan.schedule.length - 1;
                    const hasTravelInfo =
                      (item.travel_time_next || item.travel_time_next_car || item.travel_time_next_walk) &&
                      !isLast;

                    return (
                  <div key={idx} className="schedule-item-wrapper">
                    <div
                      className="schedule-card"
                      onClick={() => handlePlaceClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlaceClick(item);
                        }
                      }}
                    >
                          <div className="schedule-time">
                            <span className="time-icon">🕐</span>
                            <span className="time-text">{item.time}</span>
                          </div>
                          <div className="schedule-main">
                            <div className="schedule-place">
                              <span className="place-icon">{getTypeIcon(item.type)}</span>
                              <span className="place-name">{item.place}</span>
                              <span
                                className="place-type"
                                style={{ color: getTypeColor(item.type) }}
                              >
                                {item.type}
                              </span>
                            </div>
                            {item.stay_duration && (
                              <div className="schedule-duration">
                                <span className="duration-icon">⏱️</span>
                                <span className="duration-text">{item.stay_duration}</span>
                              </div>
                            )}
                            {item.description && (
                              <div className="schedule-description">
                                <span className="description-icon">💬</span>
                                <span className="description-text">{item.description}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {hasTravelInfo && (
                          <div className="travel-info">
                            <span className="travel-icon">🚗</span>
                            <span className="travel-text">
                              {item.travel_time_next_car
                                ? `차량: ${item.travel_time_next_car}`
                                : item.travel_time_next
                                ? item.travel_time_next
                                : ''}
                              {item.distance_next && ` · ${item.distance_next}`}
                              {item.travel_time_next_walk && (
                                <>
                                  <br />
                                  🚶 도보: {item.travel_time_next_walk}
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="plan-actions">
        {onSave && (
          <button
            className="action-button save-button"
            onClick={() => {
              // 날짜 계산 (현재 날짜 기준으로 시작)
              const today = new Date();
              const startDate = today.toISOString().split('T')[0];
              
              // days 배열의 길이를 기반으로 종료일 계산
              const endDate = new Date(today);
              endDate.setDate(endDate.getDate() + days.length - 1);
              const endDateStr = endDate.toISOString().split('T')[0];

              // PlanItem 배열 생성
              const items: PlanItem[] = [];
              days.forEach((dayPlan, dayIdx) => {
                const currentDate = new Date(today);
                currentDate.setDate(currentDate.getDate() + dayIdx);
                const dateStr = currentDate.toISOString().split('T')[0];

                dayPlan.schedule.forEach((item) => {
                  // 백엔드에서 place_id를 포함하므로 사용, 없으면 장소 이름으로 대체
                  const placeId = item.place_id || item.place;
                  items.push({
                    place_id: placeId,
                    date: dateStr,
                    start_time: item.time,
                    end_time: item.stay_duration ? calculateEndTime(item.time, item.stay_duration) : undefined,
                    // 자동 계획에서 생성된 원래 장소 이름을 notes에 저장 (수동 편집 페이지에서 제목으로 사용)
                    notes: item.place,
                  });
                });
              });

              onSave({
                title,
                start_date: startDate,
                end_date: endDateStr,
                items,
              });
            }}
            disabled={saving}
          >
            {saving ? '저장 중...' : '💾 저장하기'}
          </button>
        )}
        {onEdit && (
          <button className="action-button edit-button" onClick={onEdit}>
            ✏️ 수정하기
          </button>
        )}
      </div>

      <style jsx>{`
        .plan-result-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          margin: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }

        .plan-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f3f5;
        }

        .plan-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .celebration-icon {
          font-size: 2rem;
          animation: bounce 1s ease-in-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .plan-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .plan-subtitle {
          margin: 0;
          font-size: 0.95rem;
          color: #666;
          padding-left: 44px;
        }

        .days-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .day-section {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .day-section:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .day-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .day-header:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        .day-header.expanded {
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .day-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .day-icon {
          font-size: 1.2rem;
        }

        .day-label {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .day-count {
          font-size: 0.85rem;
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .day-toggle {
          font-size: 0.9rem;
          transition: transform 0.3s ease;
        }

        .day-content {
          padding: 16px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .schedule-item-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .schedule-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .schedule-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .schedule-time {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .time-icon {
          font-size: 1.1rem;
        }

        .time-text {
          font-weight: 600;
          font-size: 1rem;
          color: #0064ff;
        }

        .schedule-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .schedule-place {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .place-icon {
          font-size: 1.3rem;
        }

        .place-name {
          font-weight: 600;
          font-size: 1.1rem;
          color: #333;
          flex: 1;
        }

        .place-type {
          font-size: 0.85rem;
          font-weight: 500;
          background: rgba(0, 0, 0, 0.05);
          padding: 4px 10px;
          border-radius: 8px;
        }

        .schedule-duration {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #666;
        }

        .duration-icon {
          font-size: 0.9rem;
        }

        .schedule-description {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.9rem;
          color: #555;
          margin-top: 4px;
          line-height: 1.5;
        }

        .description-icon {
          font-size: 0.9rem;
          margin-top: 2px;
        }

        .description-text {
          flex: 1;
        }

        .travel-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #e9ecef;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #666;
          margin-left: 40px;
        }

        .travel-icon {
          font-size: 1rem;
        }

        .travel-text {
          flex: 1;
        }

        .plan-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 2px solid #f1f3f5;
        }

        .action-button {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .edit-button {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .edit-button:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .plan-result-card {
            padding: 20px;
          }

          .plan-title {
            font-size: 1.3rem;
          }

          .day-header {
            padding: 14px 16px;
          }

          .schedule-card {
            padding: 14px;
          }

          .plan-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

// 시간 계산 헬퍼 함수
function calculateEndTime(startTime: string, duration: string): string {
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMatch = duration.match(/(\d+)\s*시간\s*(\d+)\s*분/);
    
    let addHours = 0;
    let addMinutes = 0;
    
    if (durationMatch) {
      addHours = parseInt(durationMatch[1]);
      addMinutes = parseInt(durationMatch[2]);
    } else {
      const hourMatch = duration.match(/(\d+)\s*시간/);
      const minuteMatch = duration.match(/(\d+)\s*분/);
      if (hourMatch) addHours = parseInt(hourMatch[1]);
      if (minuteMatch) addMinutes = parseInt(minuteMatch[1]);
    }
    
    const totalMinutes = hours * 60 + minutes + addHours * 60 + addMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  } catch {
    return startTime;
  }
}
