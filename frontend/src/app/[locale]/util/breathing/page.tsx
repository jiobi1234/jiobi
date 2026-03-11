'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/breathing.css';

type PresetType = 'custom' | '4-7-8' | 'box' | 'relax';
type ScreenType = 'settings' | 'session' | 'completion';

interface BreathingPattern {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

interface SavedPattern {
  id: number;
  name: string;
  inhale_duration: number;
  hold_duration: number;
  exhale_duration: number;
  hold2_duration: number;
  pattern_string: string;
  created_at: string;
}

export default function BreathingPage() {
  const [screen, setScreen] = useState<ScreenType>('settings');
  const [activePreset, setActivePreset] = useState<PresetType>('custom');
  const [activeDuration, setActiveDuration] = useState<string>('custom');
  
  const [currentInhale, setCurrentInhale] = useState(1);
  const [currentHold1, setCurrentHold1] = useState(0);
  const [currentExhale, setCurrentExhale] = useState(1);
  const [currentHold2, setCurrentHold2] = useState(0);
  
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(0);
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState(0);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: inhale, 1: hold1, 2: exhale, 3: hold2
  const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [completedCyclesCount, setCompletedCyclesCount] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [patternName, setPatternName] = useState('');
  
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const breathCircleRef = useRef<HTMLDivElement>(null);
  /** 세션 시작 시점 값 고정 (setInterval 클로저에서 state 대신 사용) */
  const sessionConfigRef = useRef<{ inhale: number; hold1: number; exhale: number; hold2: number; totalSeconds: number } | null>(null);
  const currentStepRef = useRef(0);
  const isPausedRef = useRef(false);
  /** 1초당 한 번만 감소하도록 스로틀 (중복 호출·Strict Mode 대비) */
  const lastTickMsRef = useRef(0);
  /** 단계 남은 시간 (Strict Mode 이중 호출 시 functional updater가 두 번 돌아가는 것 방지) */
  const stepTimeRemainingRef = useRef(0);
  /** 총 남은 시간 ref (setTotalTimeRemaining 콜백도 Strict Mode에서 두 번 호출되므로 ref로 1틱 1감소 보장) */
  const totalTimeRemainingRef = useRef(0);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // 오디오 refs
  const inhaleSoundRef = useRef<HTMLAudioElement | null>(null);
  const exhaleSoundRef = useRef<HTMLAudioElement | null>(null);
  const holdSoundRef = useRef<HTMLAudioElement | null>(null);
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);

  const presets: Record<PresetType, BreathingPattern> = {
    'custom': { inhale: 1, hold1: 0, exhale: 1, hold2: 0 },
    '4-7-8': { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    'box': { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    'relax': { inhale: 4, hold1: 0, exhale: 4, hold2: 0 }
  };

  useEffect(() => {
    loadSavedPatterns();

    // 탭 포커스/복귀 시 저장된 패턴 다시 로드 (다른 탭에서 저장했거나, 루트에서 진입 시 타이밍 이슈 대비)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadSavedPatterns();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    // 오디오 초기화
    inhaleSoundRef.current = new Audio('/audio/breathin.mp3');
    exhaleSoundRef.current = new Audio('/audio/breathout.mp3');
    holdSoundRef.current = new Audio('/audio/breathstop.mp3');
    alarmSoundRef.current = new Audio('/audio/games/alarm.mp3');
    
    // 오디오 사전 로드 (사용자 상호작용 후 재생 가능하도록)
    if (inhaleSoundRef.current) {
      inhaleSoundRef.current.volume = 1.0;
      inhaleSoundRef.current.preload = 'auto';
    }
    if (exhaleSoundRef.current) {
      exhaleSoundRef.current.volume = 1.0;
      exhaleSoundRef.current.preload = 'auto';
    }
    if (holdSoundRef.current) {
      holdSoundRef.current.volume = 1.0;
      holdSoundRef.current.preload = 'auto';
    }
    if (alarmSoundRef.current) {
      alarmSoundRef.current.volume = 1.0;
      alarmSoundRef.current.preload = 'auto';
    }
  }, []);

  useEffect(() => {
    if (activePreset !== 'custom' && presets[activePreset]) {
      const preset = presets[activePreset];
      setCurrentInhale(preset.inhale);
      setCurrentHold1(preset.hold1);
      setCurrentExhale(preset.exhale);
      setCurrentHold2(preset.hold2);
    }
  }, [activePreset]);

  // 언마운트 시 타이머 정리 (Strict Mode·페이지 이탈 시 중복 인터벌 방지)
  useEffect(() => {
    return () => {
      if (sessionStartTimeoutRef.current) {
        clearTimeout(sessionStartTimeoutRef.current);
        sessionStartTimeoutRef.current = null;
      }
      if (sessionIntervalRef.current) {
        clearTimeout(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
      sessionConfigRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeDuration !== 'custom' && !isNaN(parseInt(activeDuration))) {
      setSelectedDurationMinutes(parseInt(activeDuration));
      setSelectedDurationSeconds(0);
    }
  }, [activeDuration]);

  // 시간 선택기 드래그, 휠, 편집 기능
  useEffect(() => {
    if (screen !== 'settings') return;

    const setupTimePickerInteractions = (
      selectorClass: string,
      getValue: () => number,
      setValue: (val: number) => void,
      min: number,
      max: number
    ) => {
      const selector = document.querySelector(`.${selectorClass}`);
      if (!selector) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) { // Scroll up
          setValue(getValue() >= max ? min : getValue() + 1);
        } else { // Scroll down
          setValue(getValue() <= min ? max : getValue() - 1);
        }
      };

      let isDragging = false;
      let startY = 0;
      let draggedElement: HTMLElement | null = null;

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('time-option') || target.closest(`.${selectorClass}`)) {
          isDragging = true;
          startY = e.clientY;
          draggedElement = target.closest(`.${selectorClass}`) as HTMLElement;
          if (draggedElement) {
            draggedElement.style.cursor = 'grabbing';
          }
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !draggedElement) return;
        
        const currentY = e.clientY;
        const deltaY = startY - currentY;

        if (Math.abs(deltaY) > 20) { // Threshold for drag
          if (deltaY > 0) { // Drag up
            setValue(getValue() >= max ? min : getValue() + 1);
          } else { // Drag down
            setValue(getValue() <= min ? max : getValue() - 1);
          }
          startY = currentY; // Reset startY to prevent rapid scrolling
        }
      };

      const handleMouseUp = () => {
        isDragging = false;
        if (draggedElement) {
          draggedElement.style.cursor = 'grab';
          draggedElement = null;
        }
      };

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('time-option') && target.classList.contains('current')) {
          // Enable direct input for the current value
          const input = document.createElement('input');
          input.type = 'number';
          input.value = getValue().toString();
          input.className = 'w-16 text-center text-3xl font-bold border-2 border-blue-500 rounded px-1';
          input.min = min.toString();
          input.max = max.toString();

          const originalText = target.textContent || '';
          target.textContent = '';
          target.appendChild(input);
          input.focus();
          input.select();

          const finishEdit = () => {
            let newValue = parseInt(input.value);
            if (isNaN(newValue)) {
              newValue = getValue();
            }
            newValue = Math.max(min, Math.min(max, newValue));
            setValue(newValue);
            target.textContent = newValue.toString();
            input.remove();
          };

          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              finishEdit();
            }
          });
          input.addEventListener('blur', finishEdit);
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              target.textContent = originalText;
              input.remove();
            }
          });
        } else if (target.classList.contains('time-option')) {
          const clickedValue = parseInt(target.dataset.value || '0');
          setValue(clickedValue);
        }
      };

      selector.addEventListener('wheel', handleWheel);
      selector.addEventListener('mousedown', handleMouseDown);
      selector.addEventListener('click', handleClick);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        selector.removeEventListener('wheel', handleWheel);
        selector.removeEventListener('mousedown', handleMouseDown);
        selector.removeEventListener('click', handleClick);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    };

    // Setup for breathing pattern selectors
    const cleanupInhale = setupTimePickerInteractions(
      'inhale-selector',
      () => currentInhale,
      setCurrentInhale,
      1, 999
    );
    const cleanupHold1 = setupTimePickerInteractions(
      'hold1-selector',
      () => currentHold1,
      setCurrentHold1,
      0, 999
    );
    const cleanupExhale = setupTimePickerInteractions(
      'exhale-selector',
      () => currentExhale,
      setCurrentExhale,
      1, 999
    );
    const cleanupHold2 = setupTimePickerInteractions(
      'hold2-selector',
      () => currentHold2,
      setCurrentHold2,
      0, 999
    );
    const cleanupDurationMinute = setupTimePickerInteractions(
      'duration-minute-selector',
      () => selectedDurationMinutes,
      setSelectedDurationMinutes,
      0, 999
    );
    const cleanupDurationSecond = setupTimePickerInteractions(
      'duration-second-selector',
      () => selectedDurationSeconds,
      setSelectedDurationSeconds,
      0, 59
    );

    return () => {
      cleanupInhale();
      cleanupHold1();
      cleanupExhale();
      cleanupHold2();
      cleanupDurationMinute();
      cleanupDurationSecond();
    };
  }, [screen, currentInhale, currentHold1, currentExhale, currentHold2, selectedDurationMinutes, selectedDurationSeconds]);

  const loadSavedPatterns = () => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem('jiobi_breathing_patterns');
      if (raw) {
        const patterns = JSON.parse(raw);
        setSavedPatterns(Array.isArray(patterns) ? patterns : []);
      }
    } catch (e) {
      console.error('패턴 로드 실패:', e);
    }
  };

  const savePattern = () => {
    try {
      const patterns = savedPatterns;
      const newPattern: SavedPattern = {
        id: Date.now(),
        name: patternName || `커스텀${patterns.length + 1}`,
        inhale_duration: currentInhale,
        hold_duration: currentHold1,
        exhale_duration: currentExhale,
        hold2_duration: currentHold2,
        pattern_string: `${currentInhale}-${currentHold1}-${currentExhale}-${currentHold2}`,
        created_at: new Date().toLocaleString('ko-KR')
      };
      patterns.unshift(newPattern);
      localStorage.setItem('jiobi_breathing_patterns', JSON.stringify(patterns));
      setSavedPatterns(patterns);
      setPatternName('');
      alert('패턴이 저장되었습니다!');
    } catch (e) {
      console.error('패턴 저장 실패:', e);
    }
  };

  const loadPattern = (pattern: SavedPattern) => {
    setCurrentInhale(pattern.inhale_duration);
    setCurrentHold1(pattern.hold_duration);
    setCurrentExhale(pattern.exhale_duration);
    setCurrentHold2(pattern.hold2_duration);
    setActivePreset('custom');
    alert('패턴이 불러와졌습니다!');
  };

  const deletePattern = (id: number) => {
    if (!confirm('이 패턴을 삭제하시겠습니까?')) return;
    const filtered = savedPatterns.filter(p => p.id !== id);
    localStorage.setItem('jiobi_breathing_patterns', JSON.stringify(filtered));
    setSavedPatterns(filtered);
  };

  const startSession = () => {
    const totalSeconds = (selectedDurationMinutes * 60) + selectedDurationSeconds;
    if (totalSeconds <= 0) {
      alert('총 명상 시간을 1초 이상 설정해주세요.');
      return;
    }
    
    if (currentInhale <= 0) {
      alert('들숨 시간을 1초 이상 설정해주세요.');
      return;
    }
    
    if (currentExhale <= 0) {
      alert('날숨 시간을 1초 이상 설정해주세요.');
      return;
    }
    
    // 기존 인터벌·시작 지연 타이머 제거 (중복 실행·더블클릭·Strict Mode 대비)
    if (sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current);
      sessionStartTimeoutRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearTimeout(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    
    setScreen('session');
    setCurrentStep(0);
    currentStepRef.current = 0;
    setCompletedCyclesCount(0);
    setTotalTimeRemaining(totalSeconds);
    setIsPaused(false);
    isPausedRef.current = false;
    setProgress(0);
    lastTickMsRef.current = 0;
    totalTimeRemainingRef.current = totalSeconds;
    
    // 인터벌 콜백에서 사용할 값 ref에 고정 (클로저 stale 방지)
    sessionConfigRef.current = {
      inhale: currentInhale,
      hold1: currentHold1,
      exhale: currentExhale,
      hold2: currentHold2,
      totalSeconds
    };
    
    // 첫 단계 시작
    const steps = [
      { name: 'inhale', text: '들이쉬세요', time: currentInhale, class: 'inhale' },
      { name: 'hold1', text: '멈추세요', time: currentHold1, class: 'hold-large' },
      { name: 'exhale', text: '내쉬세요', time: currentExhale, class: 'exhale' },
      { name: 'hold2', text: '멈추세요', time: currentHold2, class: 'hold-small' }
    ];
    
    const firstStep = steps[0];
    stepTimeRemainingRef.current = firstStep.time;
    setStepTimeRemaining(firstStep.time);
    
    // 애니메이션 적용
    if (breathCircleRef.current) {
      const circle = breathCircleRef.current;
      circle.style.transition = `transform ${firstStep.time}s ease-in-out, box-shadow ${firstStep.time}s ease-in-out`;
      circle.className = 'breath-circle';
      setTimeout(() => {
        circle.classList.add(firstStep.class);
      }, 50);
    }
    
    playSound(firstStep.name);
    
    // 1초마다 한 번만 실행되도록 setTimeout 연쇄 사용 (setInterval 중복 호출 방지)
    const scheduleNextTick = () => {
      sessionIntervalRef.current = setTimeout(() => {
        if (!sessionConfigRef.current) return; // 세션 종료 시 더 이상 예약 안 함
        if (!isPausedRef.current) {
          updateSession();
        }
        if (sessionConfigRef.current) scheduleNextTick();
      }, 1000);
    };
    sessionStartTimeoutRef.current = setTimeout(() => {
      sessionStartTimeoutRef.current = null;
      scheduleNextTick();
    }, 1000);
  };

  /** stepIndex: 설정할 단계(0~3). ref 기준으로 동작해 클로저 stale 방지. 0초 단계는 연속으로 건너뛰어 다음 유효 단계로 진행 */
  const startStep = (stepIndex: number) => {
    const config = sessionConfigRef.current;
    if (!config) return;

    const steps = [
      { name: 'inhale', text: '들이쉬세요', time: config.inhale, class: 'inhale' },
      { name: 'hold1', text: '멈추세요', time: config.hold1, class: 'hold-large' },
      { name: 'exhale', text: '내쉬세요', time: config.exhale, class: 'exhale' },
      { name: 'hold2', text: '멈추세요', time: config.hold2, class: 'hold-small' }
    ];

    let index = stepIndex;
    let step = steps[index];

    while (step.time === 0) {
      const nextIndex = index + 1 > 3 ? 0 : index + 1;
      if (index === 3) setCompletedCyclesCount((c) => c + 1);
      index = nextIndex;
      step = steps[index];
      if (index === stepIndex) return; // 한 바퀴 돌았는데 전부 0초면 종료
    }

    currentStepRef.current = index;
    setCurrentStep(index);
    stepTimeRemainingRef.current = step.time;
    setStepTimeRemaining(step.time);

    if (breathCircleRef.current) {
      const circle = breathCircleRef.current;
      if (step.name.startsWith('hold')) {
        circle.style.transition = 'box-shadow 0.5s ease-in-out';
        circle.className = `breath-circle ${step.class}`;
      } else {
        circle.style.transition = `transform ${step.time}s ease-in-out, box-shadow ${step.time}s ease-in-out`;
        circle.className = 'breath-circle';
        setTimeout(() => {
          circle.classList.add(step.class);
        }, 50);
      }
    }

    playSound(step.name);
  };

  const updateSession = () => {
    const config = sessionConfigRef.current;
    if (!config) return;

    const now = Date.now();
    if (now - lastTickMsRef.current < 800) return;
    lastTickMsRef.current = now;

    // ref만 1 감소 후 setState(값) 호출 (setState(prev=>...) 콜백이 Strict Mode에서 두 번 돌면 2씩 줄어드는 문제 방지)
    if (totalTimeRemainingRef.current <= 0) {
      endSession();
      return;
    }
    totalTimeRemainingRef.current -= 1;
    const newRemaining = totalTimeRemainingRef.current;

    const newProgress = ((config.totalSeconds - newRemaining) / config.totalSeconds) * 100;
    setProgress(newProgress);

    if (newRemaining <= 0) {
      endSession();
      setTotalTimeRemaining(0);
      return;
    }

    stepTimeRemainingRef.current -= 1;
    const newStepRemaining = stepTimeRemainingRef.current;
    setStepTimeRemaining(newStepRemaining >= 0 ? newStepRemaining : 0);
    setTotalTimeRemaining(newRemaining);

    if (newStepRemaining <= 0 && newRemaining > 0) {
      nextStep();
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => {
      const next = prev + 1 > 3 ? 0 : prev + 1;
      if (prev === 3) {
        setCompletedCyclesCount(c => c + 1);
      }
      currentStepRef.current = next;
      startStep(next);
      return next;
    });
  };

  const endSession = () => {
    if (sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current);
      sessionStartTimeoutRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearTimeout(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    sessionConfigRef.current = null;

    // 모든 소리 중지 (호흡 소리 + 알람)
    if (inhaleSoundRef.current) {
      inhaleSoundRef.current.pause();
      inhaleSoundRef.current.currentTime = 0;
    }
    if (exhaleSoundRef.current) {
      exhaleSoundRef.current.pause();
      exhaleSoundRef.current.currentTime = 0;
    }
    if (holdSoundRef.current) {
      holdSoundRef.current.pause();
      holdSoundRef.current.currentTime = 0;
    }
    if (alarmSoundRef.current) {
      alarmSoundRef.current.pause();
      alarmSoundRef.current.currentTime = 0;
      alarmSoundRef.current.loop = false;
    }

    // 완료 시 알람 5번 재생
    if (!isMuted && alarmSoundRef.current) {
      const alarm = alarmSoundRef.current;
      alarm.loop = false;
      alarm.volume = 1.0;
      let playCount = 0;
      const onEnded = () => {
        playCount += 1;
        if (playCount < 5) {
          alarm.currentTime = 0;
          alarm.play().catch(() => {});
        } else {
          alarm.removeEventListener('ended', onEnded);
        }
      };
      alarm.addEventListener('ended', onEnded);
      alarm.play().catch(() => {});
    }

    setScreen('completion');
  };

  const playSound = (stepName: string) => {
    if (isMuted) return;
    
    // 이전 오디오 중지
    if (inhaleSoundRef.current) {
      inhaleSoundRef.current.pause();
      inhaleSoundRef.current.currentTime = 0;
    }
    if (exhaleSoundRef.current) {
      exhaleSoundRef.current.pause();
      exhaleSoundRef.current.currentTime = 0;
    }
    if (holdSoundRef.current) {
      holdSoundRef.current.pause();
      holdSoundRef.current.currentTime = 0;
    }
    
    // 해당 단계 오디오 재생 (각 단계마다 재생)
    const onPlayError = (err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return; // pause()로 인한 중단은 무시
      console.warn('오디오 재생 실패:', err);
    };
    if (stepName === 'inhale' && inhaleSoundRef.current) {
      inhaleSoundRef.current.volume = 1.0;
      inhaleSoundRef.current.play().catch(onPlayError);
    } else if (stepName === 'exhale' && exhaleSoundRef.current) {
      exhaleSoundRef.current.volume = 1.0;
      exhaleSoundRef.current.play().catch(onPlayError);
    } else if ((stepName === 'hold1' || stepName === 'hold2') && holdSoundRef.current) {
      holdSoundRef.current.volume = 1.0;
      holdSoundRef.current.play().catch(onPlayError);
    }
  };

  const pauseSession = () => {
    setIsPaused(prev => !prev);
  };

  const stopSession = () => {
    if (confirm('세션을 정지하시겠습니까?')) {
      if (sessionStartTimeoutRef.current) {
        clearTimeout(sessionStartTimeoutRef.current);
        sessionStartTimeoutRef.current = null;
      }
      if (sessionIntervalRef.current) {
        clearTimeout(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
      setScreen('settings');
    }
  };

  const restartSession = () => {
    if (sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current);
      sessionStartTimeoutRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearTimeout(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    // 재시작 전 모든 소리 확실히 정지
    [inhaleSoundRef, exhaleSoundRef, holdSoundRef, alarmSoundRef].forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
        if ('loop' in ref.current) ref.current.loop = false;
      }
    });
    startSession();
  };

  const backToSettings = () => {
    if (sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current);
      sessionStartTimeoutRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearTimeout(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    setScreen('settings');
  };


  const getStepText = () => {
    const steps = ['들이쉬세요', '멈추세요', '내쉬세요', '멈추세요'];
    return steps[currentStep];
  };

  const getTotalTimeDisplay = () => {
    const minutes = Math.floor(totalTimeRemaining / 60);
    const seconds = totalTimeRemaining % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')} 남음`;
  };

  const getCompletedDuration = () => {
    if (selectedDurationSeconds > 0) {
      return `${selectedDurationMinutes}분 ${selectedDurationSeconds}초`;
    }
    return `${selectedDurationMinutes}분`;
  };

  return (
    <>
      <Navbar />
      <section className="breathing-container py-6 sm:py-10 px-4 min-h-screen">
        {/* 설정 패널 */}
        {screen === 'settings' && (
          <div id="settingsPanel" className="settings-panel max-w-4xl mx-auto">
            {/* 헤더 */}
            <header className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">명상 호흡</h1>
              <p className="text-sm sm:text-base text-gray-300">호흡에 집중하여 마음의 평화를 찾으세요</p>
            </header>

            {/* 프리셋 버튼 */}
            <div className="preset-section bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">호흡 패턴 선택</h3>
              <div className="preset-buttons flex flex-wrap justify-center gap-3">
                <button 
                  className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`}
                  onClick={() => setActivePreset('custom')}
                >
                  <span className="preset-name">커스텀</span>
                  <span className="preset-desc">직접 설정</span>
                </button>
                <button 
                  className={`preset-btn ${activePreset === '4-7-8' ? 'active' : ''}`}
                  onClick={() => setActivePreset('4-7-8')}
                >
                  <span className="preset-name">4-7-8 호흡법</span>
                  <span className="preset-desc">수면/이완</span>
                </button>
                <button 
                  className={`preset-btn ${activePreset === 'box' ? 'active' : ''}`}
                  onClick={() => setActivePreset('box')}
                >
                  <span className="preset-name">Box Breathing</span>
                  <span className="preset-desc">집중/스트레스</span>
                </button>
                <button 
                  className={`preset-btn ${activePreset === 'relax' ? 'active' : ''}`}
                  onClick={() => setActivePreset('relax')}
                >
                  <span className="preset-name">릴렉스 호흡</span>
                  <span className="preset-desc">기본 이완</span>
                </button>
              </div>
            </div>

            {/* 호흡 패턴 설정 */}
            <div className="breath-pattern-section bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">호흡 시간 설정</h3>
              
              <div className="time-picker-container bg-white rounded-lg p-6 w-full border-2 border-gray-300 mb-4">
                <div className="time-picker flex items-center justify-center flex-wrap gap-4">
                  
                  {/* 들숨 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">들숨</label>
                    <div className="inhale-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentInhale <= 1 ? 999 : currentInhale - 1}>
                        {currentInhale <= 1 ? 999 : currentInhale - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={currentInhale}>
                        {currentInhale}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentInhale >= 999 ? 1 : currentInhale + 1}>
                        {currentInhale >= 999 ? 1 : currentInhale + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">초</span>
                  </div>

                  <div className="separator text-[#373e56] text-3xl font-bold self-center">:</div>

                  {/* 정지 1 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">정지</label>
                    <div className="hold1-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentHold1 <= 0 ? 999 : currentHold1 - 1}>
                        {currentHold1 <= 0 ? 999 : currentHold1 - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={currentHold1}>
                        {currentHold1}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentHold1 >= 999 ? 0 : currentHold1 + 1}>
                        {currentHold1 >= 999 ? 0 : currentHold1 + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">초</span>
                  </div>

                  <div className="separator text-[#373e56] text-3xl font-bold self-center">:</div>

                  {/* 날숨 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">날숨</label>
                    <div className="exhale-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentExhale <= 1 ? 999 : currentExhale - 1}>
                        {currentExhale <= 1 ? 999 : currentExhale - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={currentExhale}>
                        {currentExhale}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentExhale >= 999 ? 1 : currentExhale + 1}>
                        {currentExhale >= 999 ? 1 : currentExhale + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">초</span>
                  </div>

                  <div className="separator text-[#373e56] text-3xl font-bold self-center">:</div>

                  {/* 정지 2 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">정지</label>
                    <div className="hold2-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentHold2 <= 0 ? 999 : currentHold2 - 1}>
                        {currentHold2 <= 0 ? 999 : currentHold2 - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={currentHold2}>
                        {currentHold2}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={currentHold2 >= 999 ? 0 : currentHold2 + 1}>
                        {currentHold2 >= 999 ? 0 : currentHold2 + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">초</span>
                  </div>

                </div>
              </div>

              {/* 현재 설정 요약 */}
              <div className="pattern-summary text-center">
                <p className="text-white text-lg">
                  <span>{currentInhale}</span>초 들이쉬고 → 
                  <span> {currentHold1}</span>초 멈추고 → 
                  <span> {currentExhale}</span>초 내쉬고 → 
                  <span> {currentHold2}</span>초 멈춤
                </p>
              </div>
            </div>

            {/* 커스텀 호흡법 저장/불러오기 */}
            <div className="custom-pattern-section bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">커스텀 호흡법 관리</h3>
              
              {/* 저장 폼 */}
              <div className="save-pattern-form bg-white rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2">패턴 이름 (선택사항)</label>
                    <input 
                      type="text" 
                      value={patternName}
                      onChange={(e) => setPatternName(e.target.value)}
                      placeholder="예: 나만의 호흡법" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    onClick={savePattern}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    현재 패턴 저장
                  </button>
                </div>
              </div>

              {/* 저장된 패턴 목록 */}
              <div className="saved-patterns">
                <h4 className="text-white text-center mb-3">저장된 호흡법</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedPatterns.length === 0 ? (
                    <p className="text-gray-500 text-center">저장된 패턴이 없습니다.</p>
                  ) : (
                    savedPatterns.map(pattern => (
                      <div key={pattern.id} className="saved-pattern-item bg-white rounded-lg p-3 flex justify-between items-center">
                        <div className="pattern-info">
                          <div className="pattern-name font-medium text-gray-800">{pattern.name}</div>
                          <div className="pattern-details text-sm text-gray-600">
                            {pattern.pattern_string} ({pattern.created_at})
                          </div>
                        </div>
                        <div className="pattern-actions flex gap-2">
                          <button 
                            onClick={() => loadPattern(pattern)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            불러오기
                          </button>
                          <button 
                            onClick={() => deletePattern(pattern.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 총 시간 선택 */}
            <div className="duration-section bg-white bg-opacity-10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">총 명상 시간</h3>
              
              {/* 프리셋 버튼 */}
              <div className="duration-buttons flex flex-wrap justify-center gap-3 mb-4">
                <button 
                  className={`duration-btn ${activeDuration === 'custom' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('custom')}
                >
                  커스텀
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '3' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('3')}
                >
                  3분
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '5' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('5')}
                >
                  5분
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '10' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('10')}
                >
                  10분
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '15' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('15')}
                >
                  15분
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '20' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('20')}
                >
                  20분
                </button>
                <button 
                  className={`duration-btn ${activeDuration === '30' ? 'active' : ''}`}
                  onClick={() => setActiveDuration('30')}
                >
                  30분
                </button>
              </div>

              {/* 커스텀 시간 선택 */}
              <div className="time-picker-container bg-white rounded-lg p-4 sm:p-6 w-full border-2 border-gray-300">
                <div className="time-picker flex items-center justify-center flex-wrap gap-4">
                  
                  {/* 분 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">분</label>
                    <div className="duration-minute-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={selectedDurationMinutes <= 0 ? 999 : selectedDurationMinutes - 1}>
                        {selectedDurationMinutes <= 0 ? 999 : selectedDurationMinutes - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={selectedDurationMinutes}>
                        {selectedDurationMinutes}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={selectedDurationMinutes >= 999 ? 0 : selectedDurationMinutes + 1}>
                        {selectedDurationMinutes >= 999 ? 0 : selectedDurationMinutes + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">분</span>
                  </div>

                  <div className="separator text-[#373e56] text-3xl font-bold align-self-center">:</div>

                  {/* 초 */}
                  <div className="time-section flex flex-col items-center">
                    <label className="text-sm text-gray-500 mb-2 font-medium">초</label>
                    <div className="duration-second-selector selector flex flex-col items-center cursor-grab">
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={selectedDurationSeconds <= 0 ? 59 : selectedDurationSeconds - 1}>
                        {selectedDurationSeconds <= 0 ? 59 : selectedDurationSeconds - 1}
                      </div>
                      <div className="time-option current text-[#373e56] text-3xl font-bold cursor-pointer" data-value={selectedDurationSeconds}>
                        {selectedDurationSeconds}
                      </div>
                      <div className="time-option text-gray-300 text-xl cursor-pointer" data-value={selectedDurationSeconds >= 59 ? 0 : selectedDurationSeconds + 1}>
                        {selectedDurationSeconds >= 59 ? 0 : selectedDurationSeconds + 1}
                      </div>
                    </div>
                    <span className="unit text-sm text-gray-500 mt-2">초</span>
                  </div>

                </div>
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="text-center">
              <button 
                onClick={startSession}
                className="start-button bg-gradient-to-r from-[#7bed9f] to-[#22a6b3] text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                시작하기
              </button>
            </div>
          </div>
        )}

        {/* 호흡 세션 화면 */}
        {screen === 'session' && (
          <div id="sessionScreen" className="session-screen max-w-4xl mx-auto">
            <div className="session-content flex flex-col items-center justify-center min-h-[600px]">
              
              {/* 전체 남은 시간 */}
              <div className="total-timer text-white text-xl mb-8">{getTotalTimeDisplay()}</div>

              {/* 애니메이션 원 */}
              <div className="breath-circle-container mb-8">
                <div ref={breathCircleRef} id="breathCircle" className="breath-circle"></div>
              </div>

              {/* 현재 단계 텍스트 */}
              <div className="instruction-text text-white text-4xl font-bold mb-4">
                {getStepText()}
              </div>

              {/* 현재 단계 남은 시간 */}
              <div className="step-timer text-white text-6xl font-bold mb-8">
                {stepTimeRemaining}
              </div>

              {/* 진행 바 */}
              <div className="progress-bar-container w-full max-w-md mb-8">
                <div className="progress-bar bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="progress-fill bg-gradient-to-r from-[#7bed9f] to-[#22a6b3] h-full transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* 사이클 카운터 */}
              <div className="cycle-counter text-white text-lg mb-8">
                <span>{completedCyclesCount}</span> 사이클 완료
              </div>

              {/* 컨트롤 버튼 */}
              <div className="controls flex gap-4">
                <button 
                  onClick={pauseSession}
                  className="control-btn bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  {isPaused ? '계속' : '일시정지'}
                </button>
                <button 
                  onClick={stopSession}
                  className="control-btn bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  정지
                </button>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="control-btn bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 완료 화면 */}
        {screen === 'completion' && (
          <div id="completionScreen" className="completion-screen max-w-4xl mx-auto">
            <div className="completion-content bg-white bg-opacity-10 rounded-xl p-12 text-center">
              <div className="completion-icon text-8xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold text-white mb-4">명상 완료!</h2>
              <div className="completion-stats text-white text-xl mb-8">
                <p className="mb-2"><span>{getCompletedDuration()}</span> 동안 호흡 명상을 완료했습니다.</p>
                <p>총 호흡 사이클: <span>{completedCyclesCount}</span>회</p>
              </div>
              <div className="completion-buttons flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={restartSession}
                  className="restart-button bg-gradient-to-r from-[#7bed9f] to-[#22a6b3] text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  다시 시작
                </button>
                <button 
                  onClick={backToSettings}
                  className="back-button bg-gray-500 hover:bg-gray-600 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  설정으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}

      </section>
      <Footer />
      
      {/* 오디오 요소 (숨김) */}
      <audio id="breathin" preload="auto" src="/audio/breathin.mp3"></audio>
      <audio id="breathout" preload="auto" src="/audio/breathout.mp3"></audio>
      <audio id="breathstop" preload="auto" src="/audio/breathstop.mp3"></audio>
      <audio id="meditationAlarmSound" preload="auto" src="/audio/games/alarm.mp3"></audio>
      
      <style jsx>{`
        body {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
          overflow-x: hidden;
        }
        .hidden {
          display: none !important;
        }
      `}</style>
    </>
  );
}

