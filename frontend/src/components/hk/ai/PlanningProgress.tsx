'use client';

import { useEffect, useState } from 'react';

export type PlanningStep = 'selecting' | 'filtering' | 'optimizing' | 'finalizing';

interface PlanningProgressProps {
  currentStep: PlanningStep;
  region?: string;
  estimatedTimeRemaining?: number; // 초 단위
}

interface StepInfo {
  id: PlanningStep;
  label: string;
  icon: string;
  message: string;
  progress: number;
}

const STEP_INFO: Record<PlanningStep, StepInfo> = {
  selecting: {
    id: 'selecting',
    label: '여행지 검색',
    icon: '🔍',
    message: '여행지 후보를 검색하고 있어요...',
    progress: 25,
  },
  filtering: {
    id: 'filtering',
    label: '장소 선별',
    icon: '✨',
    message: 'AI가 최적의 장소를 선별하고 있어요...',
    progress: 50,
  },
  optimizing: {
    id: 'optimizing',
    label: '동선 최적화',
    icon: '🚗',
    message: '최적의 동선을 계산하고 있어요...',
    progress: 75,
  },
  finalizing: {
    id: 'finalizing',
    label: '일정 구성',
    icon: '📅',
    message: '완벽한 일정을 구성하고 있어요...',
    progress: 100,
  },
};

export default function PlanningProgress({ currentStep, region, estimatedTimeRemaining }: PlanningProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState('');

  // 프로그레스 바 애니메이션
  useEffect(() => {
    const targetProgress = STEP_INFO[currentStep].progress;
    const duration = 500; // 0.5초 애니메이션
    const startProgress = animatedProgress;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startProgress + (targetProgress - startProgress) * progress;
      setAnimatedProgress(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentStep, animatedProgress]);

  // 시간 표시 업데이트
  useEffect(() => {
    if (estimatedTimeRemaining === undefined) return;

    const updateTime = () => {
      if (estimatedTimeRemaining <= 0) {
        setTimeDisplay('곧 완료됩니다!');
        return;
      }

      const minutes = Math.floor(estimatedTimeRemaining / 60);
      const seconds = estimatedTimeRemaining % 60;

      if (minutes > 0) {
        setTimeDisplay(`약 ${minutes}분 ${seconds}초 남았어요`);
      } else {
        setTimeDisplay(`약 ${seconds}초 남았어요`);
      }
    };

    updateTime();
    const interval = setInterval(() => {
      if (estimatedTimeRemaining > 0) {
        // 실제로는 부모 컴포넌트에서 시간을 관리해야 하지만, 여기서는 표시만
        updateTime();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedTimeRemaining]);

  const currentStepInfo = STEP_INFO[currentStep];
  const steps = Object.values(STEP_INFO);

  return (
    <div className="planning-progress-container">
      <div className="progress-header">
        <div className="ai-icon">{currentStepInfo.icon}</div>
        <div className="progress-title">
          <h3>AI가 계획을 짜고 있어요!</h3>
          <p className="progress-message">{currentStepInfo.message}</p>
        </div>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        <div className="progress-percentage">{Math.round(animatedProgress)}%</div>
      </div>

      {estimatedTimeRemaining !== undefined && (
        <div className="time-estimate">
          <span className="time-icon">⏱️</span>
          <span>{timeDisplay || '계산 중...'}</span>
        </div>
      )}

      <div className="steps-checklist">
        {steps.map((step) => {
          const isCompleted = steps.indexOf(step) < steps.indexOf(currentStepInfo);
          const isCurrent = step.id === currentStep;
          const isPending = steps.indexOf(step) > steps.indexOf(currentStepInfo);

          return (
            <div 
              key={step.id} 
              className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="step-icon">
                {isCompleted ? '✓' : isCurrent ? step.icon : '○'}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .planning-progress-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 24px;
          margin: 20px 0;
          color: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .progress-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .ai-icon {
          font-size: 2.5rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }

        .progress-title h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .progress-message {
          margin: 0;
          font-size: 0.95rem;
          opacity: 0.9;
        }

        .progress-bar-wrapper {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7bed9f 0%, #22a6b3 100%);
          border-radius: 10px;
          transition: width 0.5s ease-out;
          box-shadow: 0 0 10px rgba(123, 237, 159, 0.5);
        }

        .progress-percentage {
          text-align: right;
          font-size: 0.85rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .time-estimate {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          opacity: 0.95;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
        }

        .time-icon {
          font-size: 1.1rem;
        }

        .steps-checklist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .step-item.completed {
          background: rgba(123, 237, 159, 0.2);
        }

        .step-item.current {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.5);
          }
        }

        .step-item.pending {
          opacity: 0.6;
        }

        .step-icon {
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
        }

        .step-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .planning-progress-container {
            padding: 20px;
          }

          .progress-title h3 {
            font-size: 1.1rem;
          }

          .steps-checklist {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
