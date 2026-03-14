'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';

type TabType = 'clock' | 'alarm' | 'stopwatch' | 'timer';

/** 세계 시계용 도시 목록 (IANA timeZone 기준). 유명 도시 + 2026 월드컵 개최 도시 포함 */
const WORLD_CITIES: { id: string; name: string; country: string; timeZone: string }[] = [
  // 동아시아·한국
  { id: 'Asia/Seoul', name: '서울', country: '대한민국', timeZone: 'Asia/Seoul' },
  { id: 'Asia/Tokyo', name: '도쿄', country: '일본', timeZone: 'Asia/Tokyo' },
  { id: 'Asia/Shanghai', name: '상하이', country: '중국', timeZone: 'Asia/Shanghai' },
  { id: 'Asia/Beijing', name: '베이징', country: '중국', timeZone: 'Asia/Shanghai' },
  { id: 'Asia/Hong_Kong', name: '홍콩', country: '중국', timeZone: 'Asia/Hong_Kong' },
  { id: 'Asia/Taipei', name: '타이페이', country: '대만', timeZone: 'Asia/Taipei' },
  { id: 'Asia/Urumqi', name: '우루무치', country: '중국', timeZone: 'Asia/Urumqi' },
  // 동남아시아
  { id: 'Asia/Singapore', name: '싱가포르', country: '싱가포르', timeZone: 'Asia/Singapore' },
  { id: 'Asia/Bangkok', name: '방콕', country: '태국', timeZone: 'Asia/Bangkok' },
  { id: 'Asia/Jakarta', name: '자카르타', country: '인도네시아', timeZone: 'Asia/Jakarta' },
  { id: 'Asia/Manila', name: '마닐라', country: '필리핀', timeZone: 'Asia/Manila' },
  { id: 'Asia/Kuala_Lumpur', name: '쿠알라룸푸르', country: '말레이시아', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'Asia/Ho_Chi_Minh', name: '호치민', country: '베트남', timeZone: 'Asia/Ho_Chi_Minh' },
  // 남아시아·중동
  { id: 'Asia/Kolkata', name: '뭄바이', country: '인도', timeZone: 'Asia/Kolkata' },
  { id: 'Asia/Delhi', name: '델리', country: '인도', timeZone: 'Asia/Kolkata' },
  { id: 'Asia/Dubai', name: '두바이', country: 'UAE', timeZone: 'Asia/Dubai' },
  { id: 'Asia/Riyadh', name: '리야드', country: '사우디아라비아', timeZone: 'Asia/Riyadh' },
  { id: 'Asia/Istanbul', name: '이스탄불', country: '터키', timeZone: 'Europe/Istanbul' },
  // 오세아니아
  { id: 'Australia/Sydney', name: '시드니', country: '오스트레일리아', timeZone: 'Australia/Sydney' },
  { id: 'Australia/Melbourne', name: '멜버른', country: '오스트레일리아', timeZone: 'Australia/Melbourne' },
  { id: 'Pacific/Auckland', name: '오클랜드', country: '뉴질랜드', timeZone: 'Pacific/Auckland' },
  // 유럽
  { id: 'Europe/London', name: '런던', country: '영국', timeZone: 'Europe/London' },
  { id: 'Europe/Paris', name: '파리', country: '프랑스', timeZone: 'Europe/Paris' },
  { id: 'Europe/Berlin', name: '베를린', country: '독일', timeZone: 'Europe/Berlin' },
  { id: 'Europe/Madrid', name: '마드리드', country: '스페인', timeZone: 'Europe/Madrid' },
  { id: 'Europe/Rome', name: '로마', country: '이탈리아', timeZone: 'Europe/Rome' },
  { id: 'Europe/Amsterdam', name: '암스테르담', country: '네덜란드', timeZone: 'Europe/Amsterdam' },
  { id: 'Europe/Vienna', name: '빈', country: '오스트리아', timeZone: 'Europe/Vienna' },
  { id: 'Europe/Moscow', name: '모스크바', country: '러시아', timeZone: 'Europe/Moscow' },
  { id: 'Europe/Athens', name: '아테네', country: '그리스', timeZone: 'Europe/Athens' },
  { id: 'Europe/Lisbon', name: '리스본', country: '포르투갈', timeZone: 'Europe/Lisbon' },
  { id: 'Europe/Dublin', name: '더블린', country: '아일랜드', timeZone: 'Europe/Dublin' },
  { id: 'Europe/Stockholm', name: '스톡홀름', country: '스웨덴', timeZone: 'Europe/Stockholm' },
  { id: 'Europe/Warsaw', name: '바르샤바', country: '폴란드', timeZone: 'Europe/Warsaw' },
  { id: 'Europe/Prague', name: '프라하', country: '체코', timeZone: 'Europe/Prague' },
  // 아프리카
  { id: 'Africa/Cairo', name: '카이로', country: '이집트', timeZone: 'Africa/Cairo' },
  { id: 'Africa/Johannesburg', name: '요하네스버그', country: '남아프리카', timeZone: 'Africa/Johannesburg' },
  { id: 'Africa/Lagos', name: '라고스', country: '나이지리아', timeZone: 'Africa/Lagos' },
  { id: 'Africa/Nairobi', name: '나이로비', country: '케냐', timeZone: 'Africa/Nairobi' },
  // 북미 — 2026 월드컵 개최 도시 포함
  { id: 'America/New_York', name: '뉴욕', country: '미국', timeZone: 'America/New_York' },
  { id: 'America/Los_Angeles', name: '로스앤젤레스', country: '미국', timeZone: 'America/Los_Angeles' },
  { id: 'America/Chicago', name: '시카고', country: '미국', timeZone: 'America/Chicago' },
  { id: 'America/Denver', name: '덴버', country: '미국', timeZone: 'America/Denver' },
  { id: 'America/Atlanta', name: '애틀랜타', country: '미국 (월드컵)', timeZone: 'America/New_York' },
  { id: 'America/Boston', name: '보스턴', country: '미국 (월드컵)', timeZone: 'America/New_York' },
  { id: 'America/Dallas', name: '달라스', country: '미국 (월드컵)', timeZone: 'America/Chicago' },
  { id: 'America/Houston', name: '휴스턴', country: '미국 (월드컵)', timeZone: 'America/Chicago' },
  { id: 'America/Kansas_City', name: '캔자스시티', country: '미국 (월드컵)', timeZone: 'America/Chicago' },
  { id: 'America/Miami', name: '마이애미', country: '미국 (월드컵)', timeZone: 'America/New_York' },
  { id: 'America/Philadelphia', name: '필라델피아', country: '미국 (월드컵)', timeZone: 'America/New_York' },
  { id: 'America/San_Francisco', name: '샌프란시스코', country: '미국 (월드컵)', timeZone: 'America/Los_Angeles' },
  { id: 'America/Seattle', name: '시애틀', country: '미국 (월드컵)', timeZone: 'America/Los_Angeles' },
  { id: 'America/Toronto', name: '토론토', country: '캐나다 (월드컵)', timeZone: 'America/Toronto' },
  { id: 'America/Vancouver', name: '밴쿠버', country: '캐나다 (월드컵)', timeZone: 'America/Vancouver' },
  { id: 'America/Mexico_City', name: '멕시코시티', country: '멕시코 (월드컵)', timeZone: 'America/Mexico_City' },
  { id: 'America/Guadalajara', name: '과달라하라', country: '멕시코 (월드컵)', timeZone: 'America/Mexico_City' },
  { id: 'America/Monterrey', name: '몬테레이', country: '멕시코 (월드컵)', timeZone: 'America/Monterrey' },
  // 중남미
  { id: 'America/Sao_Paulo', name: '상파울루', country: '브라질', timeZone: 'America/Sao_Paulo' },
  { id: 'America/Buenos_Aires', name: '부에노스아이레스', country: '아르헨티나', timeZone: 'America/Argentina/Buenos_Aires' },
  { id: 'America/Lima', name: '리마', country: '페루', timeZone: 'America/Lima' },
  { id: 'America/Bogota', name: '보고타', country: '콜롬비아', timeZone: 'America/Bogota' },
  { id: 'America/Santiago', name: '산티아고', country: '칠레', timeZone: 'America/Santiago' },
];

const CLOCK_STORAGE_KEY = 'jiobi_clock_selected_cities';
const CLOCK_MAIN_CITY_KEY = 'jiobi_clock_main_city';

interface Alarm {
  id: string;
  hour: number;
  minute: number;
  ampm: string;
  name: string;
  state: 'running' | 'stopped';
  targetTime: Date;
}

interface Timer {
  id: string;
  hours: number;
  minutes: number;
  seconds: number;
  name: string;
  state: 'running' | 'paused' | 'stopped';
  remaining: number;
}

interface Stopwatch {
  id: string;
  name: string;
  elapsed: number;
  running: boolean;
  startTime: number;
  laps: string[];
}

export default function ClockPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clock');
  const [is24Hour, setIs24Hour] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Seoul');
  /** 세계 시계에 표시할 도시 id 목록 (여러 개 선택 가능, localStorage 연동) */
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(['Asia/Seoul']);
  /** 주 시계(디지털/아날로그)에 표시할 도시 id (선택한 도시 중 하나, localStorage 연동) */
  const [mainCityId, setMainCityId] = useState<string>('Asia/Seoul');
  const [digitalTime, setDigitalTime] = useState('오후 00:00:00');
  const [clockTick, setClockTick] = useState(0);
  /** 서버/클라이언트 날짜·시간 불일치로 인한 hydration 에러 방지: 마운트 후에만 날짜·시간 표시 */
  const [isMounted, setIsMounted] = useState(false);
  const analogClockRef = useRef<HTMLCanvasElement>(null);
  
  // 알람 상태
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [mainAlarmAMPM, setMainAlarmAMPM] = useState('AM');
  const [mainAlarmHour, setMainAlarmHour] = useState(12);
  const [mainAlarmMinute, setMainAlarmMinute] = useState(0);
  const [mainAlarmName, setMainAlarmName] = useState('메시지를 입력하세요');
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const alarmIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [alarmModals, setAlarmModals] = useState<Map<string, boolean>>(new Map());
  
  // 타이머 상태
  const [timers, setTimers] = useState<Timer[]>([]);
  const [mainTimerHour, setMainTimerHour] = useState(0);
  const [mainTimerMinute, setMainTimerMinute] = useState(0);
  const [mainTimerSecond, setMainTimerSecond] = useState(0);
  const [mainTimerName, setMainTimerName] = useState('메시지를 입력하세요');
  const timerSoundRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [timerModals, setTimerModals] = useState<Map<string, boolean>>(new Map());
  
  // 스톱워치 상태
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([]);
  const stopwatchIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // 시간 선택기 refs (드래그, 휠, 편집 기능용)
  const ampmSelectorRef = useRef<HTMLDivElement>(null);
  const hourSelectorRef = useRef<HTMLDivElement>(null);
  const minuteSelectorRef = useRef<HTMLDivElement>(null);
  const timerHourSelectorRef = useRef<HTMLDivElement>(null);
  const timerMinuteSelectorRef = useRef<HTMLDivElement>(null);
  const timerSecondSelectorRef = useRef<HTMLDivElement>(null);
  
  // createStopwatch 함수 정의 (useEffect보다 먼저)
  const createStopwatch = useCallback(() => {
    const newStopwatch: Stopwatch = {
      id: `stopwatch-${Date.now()}`,
      name: '이름을 입력하세요',
      elapsed: 0,
      running: false,
      startTime: 0,
      laps: []
    };
    setStopwatches(prev => [...prev, newStopwatch]);
  }, []);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 세계 시계 선택 도시 로드/저장
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' && window.localStorage.getItem(CLOCK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((id: unknown) => typeof id === 'string')) {
          const valid = parsed.filter((id: string) => WORLD_CITIES.some((c) => c.id === id));
          if (valid.length > 0) setSelectedCityIds(valid);
        }
      }
    } catch (_) {}
  }, []);
  useEffect(() => {
    if (selectedCityIds.length === 0) return;
    try {
      window.localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(selectedCityIds));
    } catch (_) {}
  }, [selectedCityIds]);

  // 주 시계 도시 로드/저장
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' && window.localStorage.getItem(CLOCK_MAIN_CITY_KEY);
      if (saved && WORLD_CITIES.some((c) => c.id === saved)) setMainCityId(saved);
    } catch (_) {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(CLOCK_MAIN_CITY_KEY, mainCityId);
    } catch (_) {}
  }, [mainCityId]);

  // 선택 목록에서 제거된 도시면 주 시계 도시를 첫 번째로; timezone은 주 시계 도시 기준
  useEffect(() => {
    if (selectedCityIds.length === 0) return;
    if (!selectedCityIds.includes(mainCityId)) {
      setMainCityId(selectedCityIds[0]);
      return;
    }
    const main = WORLD_CITIES.find((c) => c.id === mainCityId);
    if (main) setTimezone(main.timeZone);
  }, [selectedCityIds.join(','), mainCityId]);

  // 초기화: 현재 시간으로 알람 설정 및 오디오 초기화
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    setMainAlarmAMPM(currentHour >= 12 ? 'PM' : 'AM');
    setMainAlarmHour(currentHour === 0 ? 12 : (currentHour > 12 ? currentHour - 12 : currentHour));
    setMainAlarmMinute(now.getMinutes());
    
    // 오디오 초기화
    alarmSoundRef.current = new Audio('/audio/games/alarm.mp3');
    timerSoundRef.current = new Audio('/audio/games/alarm.mp3');
    
    // 기본 스톱워치 하나 생성
    createStopwatch();
  }, [createStopwatch]);
  
  // 알람 시간 선택기 드래그, 휠, 편집 기능
  useEffect(() => {
    if (activeTab !== 'alarm') return;
    
    const ampmSelector = document.querySelector('.ampm-selector');
    const hourSelector = document.querySelector('.hour-selector');
    const minuteSelector = document.querySelector('.minute-selector');
    
    if (!ampmSelector || !hourSelector || !minuteSelector) return;
    
    // AM/PM 휠 이벤트
    const handleAMPMWheel = (e: WheelEvent) => {
      e.preventDefault();
      setMainAlarmAMPM(prev => prev === 'AM' ? 'PM' : 'AM');
    };
    
    // 시간 휠 이벤트
    const handleHourWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setMainAlarmHour(prev => prev >= 12 ? 1 : prev + 1);
      } else {
        setMainAlarmHour(prev => prev <= 1 ? 12 : prev - 1);
      }
    };
    
    // 분 휠 이벤트
    const handleMinuteWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setMainAlarmMinute(prev => prev >= 59 ? 0 : prev + 1);
      } else {
        setMainAlarmMinute(prev => prev <= 0 ? 59 : prev - 1);
      }
    };

    // 키보드(화살표): 휠과 완전히 동일 동작. 휠 deltaY<0=올리기=증가=ArrowUp, deltaY>0=내리기=감소=ArrowDown
    const makeAlarmKeyHandler = (kind: 'ampm' | 'hour' | 'minute') => (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      e.stopPropagation();
      const isUp = e.key === 'ArrowUp';
      if (kind === 'ampm') {
        setMainAlarmAMPM(prev => prev === 'AM' ? 'PM' : 'AM');
      } else if (kind === 'hour') {
        if (isUp) setMainAlarmHour(prev => prev >= 12 ? 1 : prev + 1);
        else setMainAlarmHour(prev => prev <= 1 ? 12 : prev - 1);
      } else {
        if (isUp) setMainAlarmMinute(prev => prev >= 59 ? 0 : prev + 1);
        else setMainAlarmMinute(prev => prev <= 0 ? 59 : prev - 1);
      }
    };
    const handleAlarmAmpmKey = makeAlarmKeyHandler('ampm');
    const handleAlarmHourKey = makeAlarmKeyHandler('hour');
    const handleAlarmMinuteKey = makeAlarmKeyHandler('minute');

    // 드래그 이벤트
    let isDragging = false;
    let startY = 0;
    let draggedElement: HTMLElement | null = null;
    
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('time-option') || target.closest('.ampm-selector, .hour-selector, .minute-selector')) {
        isDragging = true;
        startY = e.clientY;
        draggedElement = target.closest('.ampm-selector, .hour-selector, .minute-selector') as HTMLElement;
        if (draggedElement) {
          draggedElement.style.cursor = 'grabbing';
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedElement) return;
      
      const currentY = e.clientY;
      const deltaY = startY - currentY;
      
      if (Math.abs(deltaY) > 20) {
        if (draggedElement.classList.contains('ampm-selector')) {
          setMainAlarmAMPM(prev => prev === 'AM' ? 'PM' : 'AM');
        } else if (draggedElement.classList.contains('hour-selector')) {
          if (deltaY > 0) {
            setMainAlarmHour(prev => prev >= 12 ? 1 : prev + 1);
          } else {
            setMainAlarmHour(prev => prev <= 1 ? 12 : prev - 1);
          }
        } else if (draggedElement.classList.contains('minute-selector')) {
          if (deltaY > 0) {
            setMainAlarmMinute(prev => prev >= 59 ? 0 : prev + 1);
          } else {
            setMainAlarmMinute(prev => prev <= 0 ? 59 : prev - 1);
          }
        }
        startY = currentY;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      if (draggedElement) {
        draggedElement.style.cursor = 'grab';
        draggedElement = null;
      }
    };
    
    // 편집 기능: 현재 선택된 값을 클릭하면 편집 모드
    const handleTimeOptionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('time-option')) return;
      
      const selector = target.closest('.hour-selector, .minute-selector');
      if (!selector) return;
      
      const currentValue = parseInt(target.textContent || '0');
      const isCenter = target.classList.contains('text-3xl');
      
      if (isCenter) {
        // 편집 모드
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue.toString();
        input.className = 'w-16 text-center text-3xl font-bold border-2 border-blue-500 rounded px-1';
        
        if (selector.classList.contains('hour-selector')) {
          input.min = '1';
          input.max = '12';
        } else {
          input.min = '0';
          input.max = '59';
        }
        
        const originalText = target.textContent || '';
        target.textContent = '';
        target.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
          let newValue = parseInt(input.value);
          if (isNaN(newValue)) {
            newValue = currentValue;
          }
          
          if (selector.classList.contains('hour-selector')) {
            newValue = Math.max(1, Math.min(12, newValue));
            setMainAlarmHour(newValue);
          } else {
            newValue = Math.max(0, Math.min(59, newValue));
            setMainAlarmMinute(newValue);
          }
          
          target.textContent = newValue.toString().padStart(2, '0');
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
      }
    };
    
    ampmSelector.addEventListener('wheel', handleAMPMWheel);
    hourSelector.addEventListener('wheel', handleHourWheel);
    minuteSelector.addEventListener('wheel', handleMinuteWheel);
    ampmSelector.addEventListener('keydown', handleAlarmAmpmKey);
    hourSelector.addEventListener('keydown', handleAlarmHourKey);
    minuteSelector.addEventListener('keydown', handleAlarmMinuteKey);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleTimeOptionClick);

    // 커서 스타일 설정
    (ampmSelector as HTMLElement).style.cursor = 'grab';
    (hourSelector as HTMLElement).style.cursor = 'grab';
    (minuteSelector as HTMLElement).style.cursor = 'grab';

    return () => {
      ampmSelector.removeEventListener('wheel', handleAMPMWheel);
      hourSelector.removeEventListener('wheel', handleHourWheel);
      minuteSelector.removeEventListener('wheel', handleMinuteWheel);
      ampmSelector.removeEventListener('keydown', handleAlarmAmpmKey);
      hourSelector.removeEventListener('keydown', handleAlarmHourKey);
      minuteSelector.removeEventListener('keydown', handleAlarmMinuteKey);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleTimeOptionClick);
    };
  }, [activeTab, mainAlarmAMPM, mainAlarmHour, mainAlarmMinute]);
  
  // 타이머 시간 선택기 드래그, 휠, 편집 기능
  useEffect(() => {
    if (activeTab !== 'timer') return;
    
    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 선택
    const timer = setTimeout(() => {
      const timerTab = document.getElementById('timer');
      if (!timerTab) return;
      
      const hourSelector = timerTab.querySelector('.hour-selector') as HTMLElement;
      const minuteSelector = timerTab.querySelector('.minute-selector') as HTMLElement;
      const secondSelector = timerTab.querySelector('.second-selector') as HTMLElement;
      
      if (!hourSelector || !minuteSelector || !secondSelector) {
        return;
      }
    
    // 시간 휠 이벤트
    const handleHourWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setMainTimerHour(prev => prev >= 99 ? 0 : prev + 1);
      } else {
        setMainTimerHour(prev => prev <= 0 ? 99 : prev - 1);
      }
    };
    
    // 분 휠 이벤트
    const handleMinuteWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setMainTimerMinute(prev => prev >= 59 ? 0 : prev + 1);
      } else {
        setMainTimerMinute(prev => prev <= 0 ? 59 : prev - 1);
      }
    };
    
    // 초 휠 이벤트
    const handleSecondWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setMainTimerSecond(prev => prev >= 59 ? 0 : prev + 1);
      } else {
        setMainTimerSecond(prev => prev <= 0 ? 59 : prev - 1);
      }
    };

    // 키보드(화살표): 휠과 완전히 동일. 휠 올리기=ArrowUp=증가, 휠 내리기=ArrowDown=감소
    const makeTimerKeyHandler = (kind: 'hour' | 'minute' | 'second') => (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      e.stopPropagation();
      const isUp = e.key === 'ArrowUp';
      if (kind === 'hour') {
        if (isUp) setMainTimerHour(prev => prev >= 99 ? 0 : prev + 1);
        else setMainTimerHour(prev => prev <= 0 ? 99 : prev - 1);
      } else if (kind === 'minute') {
        if (isUp) setMainTimerMinute(prev => prev >= 59 ? 0 : prev + 1);
        else setMainTimerMinute(prev => prev <= 0 ? 59 : prev - 1);
      } else {
        if (isUp) setMainTimerSecond(prev => prev >= 59 ? 0 : prev + 1);
        else setMainTimerSecond(prev => prev <= 0 ? 59 : prev - 1);
      }
    };
    const handleTimerHourKey = makeTimerKeyHandler('hour');
    const handleTimerMinuteKey = makeTimerKeyHandler('minute');
    const handleTimerSecondKey = makeTimerKeyHandler('second');

    // 드래그 이벤트
    let isDragging = false;
    let startY = 0;
    let draggedElement: HTMLElement | null = null;
    
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('time-option') || target.closest('.hour-selector, .minute-selector, .second-selector')) {
        isDragging = true;
        startY = e.clientY;
        draggedElement = target.closest('.hour-selector, .minute-selector, .second-selector') as HTMLElement;
        if (draggedElement) {
          draggedElement.style.cursor = 'grabbing';
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedElement) return;
      
      const currentY = e.clientY;
      const deltaY = startY - currentY;
      
      if (Math.abs(deltaY) > 20) {
        if (draggedElement.classList.contains('hour-selector')) {
          if (deltaY > 0) {
            setMainTimerHour(prev => prev >= 99 ? 0 : prev + 1);
          } else {
            setMainTimerHour(prev => prev <= 0 ? 99 : prev - 1);
          }
        } else if (draggedElement.classList.contains('minute-selector')) {
          if (deltaY > 0) {
            setMainTimerMinute(prev => prev >= 59 ? 0 : prev + 1);
          } else {
            setMainTimerMinute(prev => prev <= 0 ? 59 : prev - 1);
          }
        } else if (draggedElement.classList.contains('second-selector')) {
          if (deltaY > 0) {
            setMainTimerSecond(prev => prev >= 59 ? 0 : prev + 1);
          } else {
            setMainTimerSecond(prev => prev <= 0 ? 59 : prev - 1);
          }
        }
        startY = currentY;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      if (draggedElement) {
        draggedElement.style.cursor = 'grab';
        draggedElement = null;
      }
    };
    
    // 편집 기능
    const handleTimeOptionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('time-option')) return;
      
      // 타이머 탭에서만 작동하도록 확인
      const timerTab = document.getElementById('timer');
      if (!timerTab) return;
      
      // 클릭된 요소가 타이머 탭 내부에 있는지 확인
      if (!timerTab.contains(target)) return;
      
      const selector = target.closest('.hour-selector, .minute-selector, .second-selector');
      if (!selector) return;
      
      const currentValue = parseInt(target.textContent || '0');
      const isCenter = target.classList.contains('text-3xl');
      
      if (isCenter) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue.toString();
        input.className = 'w-16 text-center text-3xl font-bold border-2 border-blue-500 rounded px-1';
        
        if (selector.classList.contains('hour-selector')) {
          input.min = '0';
          input.max = '99';
        } else {
          input.min = '0';
          input.max = '59';
        }
        
        const originalText = target.textContent || '';
        target.textContent = '';
        target.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
          let newValue = parseInt(input.value);
          if (isNaN(newValue)) {
            newValue = currentValue;
          }
          
          if (selector.classList.contains('hour-selector')) {
            newValue = Math.max(0, Math.min(99, newValue));
            setMainTimerHour(newValue);
          } else if (selector.classList.contains('minute-selector')) {
            newValue = Math.max(0, Math.min(59, newValue));
            setMainTimerMinute(newValue);
          } else {
            newValue = Math.max(0, Math.min(59, newValue));
            setMainTimerSecond(newValue);
          }
          
          target.textContent = newValue.toString().padStart(2, '0');
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
      }
    };
    
      hourSelector.addEventListener('wheel', handleHourWheel);
      minuteSelector.addEventListener('wheel', handleMinuteWheel);
      secondSelector.addEventListener('wheel', handleSecondWheel);
      hourSelector.addEventListener('keydown', handleTimerHourKey);
      minuteSelector.addEventListener('keydown', handleTimerMinuteKey);
      secondSelector.addEventListener('keydown', handleTimerSecondKey);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('click', handleTimeOptionClick);

      // 커서 스타일 설정
      hourSelector.style.cursor = 'grab';
      minuteSelector.style.cursor = 'grab';
      secondSelector.style.cursor = 'grab';

      return () => {
        hourSelector.removeEventListener('wheel', handleHourWheel);
        minuteSelector.removeEventListener('wheel', handleMinuteWheel);
        secondSelector.removeEventListener('wheel', handleSecondWheel);
        hourSelector.removeEventListener('keydown', handleTimerHourKey);
        minuteSelector.removeEventListener('keydown', handleTimerMinuteKey);
        secondSelector.removeEventListener('keydown', handleTimerSecondKey);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('click', handleTimeOptionClick);
      };
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [activeTab, mainTimerHour, mainTimerMinute, mainTimerSecond]);

  useEffect(() => {
    // 디지털 시계 업데이트
    const updateDigitalClock = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const offset = getTimeOffsetMillis(timezone);
      const local = new Date(utc + offset);

      let hours = local.getHours();
      const minutes = local.getMinutes();
      const seconds = local.getSeconds();

      let formattedTime;
      if (is24Hour) {
        formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      } else {
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12;
        hours = hours ? hours : 12;
        formattedTime = `${ampm} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      setDigitalTime(formattedTime);
    };

    const interval = setInterval(() => {
      updateDigitalClock();
      drawAnalogClock();
      setClockTick((t) => t + 1);
    }, 1000);

    updateDigitalClock();
    drawAnalogClock();

    return () => clearInterval(interval);
  }, [is24Hour, timezone]);

  useEffect(() => {
    // 알람 체크
    const checkAlarms = setInterval(() => {
      const now = new Date();
      setAlarms(prev => prev.map(alarm => {
        if (alarm.state === 'running' && now >= alarm.targetTime) {
          // 알람 시간 도달: ref로 재생(제거 시 멈출 수 있음) + 팝업 표시
          if (alarmSoundRef.current) {
            alarmSoundRef.current.loop = true;
            alarmSoundRef.current.play().catch(() => {});
          }
          setAlarmModals(prevModals => new Map(prevModals).set(alarm.id, true));
          return { ...alarm, state: 'stopped' };
        }
        return alarm;
      }));
    }, 1000);

    return () => clearInterval(checkAlarms);
  }, []);

  useEffect(() => {
    // 타이머 업데이트
    const updateTimers = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.state === 'running' && timer.remaining > 0) {
          const newRemaining = timer.remaining - 1;
          if (newRemaining <= 0) {
            // 타이머 완료
            if (timerSoundRef.current) {
              timerSoundRef.current.loop = true;
              timerSoundRef.current.play().catch(() => {});
            }
            
            // 모달 표시
            setTimerModals(prev => new Map(prev).set(timer.id, true));
            
            // 인터벌 정리
            const interval = timerIntervalsRef.current.get(timer.id);
            if (interval) {
              clearInterval(interval);
              timerIntervalsRef.current.delete(timer.id);
            }
            
            return { ...timer, remaining: 0, state: 'stopped' };
          }
          return { ...timer, remaining: newRemaining };
        }
        return timer;
      }));
    }, 1000);

    return () => clearInterval(updateTimers);
  }, []);

  useEffect(() => {
    // 스톱워치 업데이트 (10ms 간격)
    const updateStopwatches = setInterval(() => {
      setStopwatches(prev => prev.map(sw => {
        if (sw.running) {
          const elapsed = Date.now() - sw.startTime;
          return { ...sw, elapsed };
        }
        return sw;
      }));
    }, 10);

    return () => clearInterval(updateStopwatches);
  }, []);

  /** IANA 타임존의 UTC 대비 오프셋(시간). Intl로 계산 (서머타임 반영) */
  const getTimezoneOffsetHours = (tz: string): number => {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = fmt.formatToParts(now);
      const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const tzMins = hour * 60 + minute;
      const utcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
      let diff = tzMins - utcMins;
      if (diff > 720) diff -= 1440;
      if (diff < -720) diff += 1440;
      return diff / 60;
    } catch {
      return 0;
    }
  };

  const getTimeOffsetMillis = (tz: string) => getTimezoneOffsetHours(tz) * 3600000;

  /** 서울 대비 시차(시간). 양수=서울보다 빠름, 음수=서울보다 느림 */
  const getOffsetHoursFromSeoul = (tz: string): number => {
    const seoul = getTimezoneOffsetHours('Asia/Seoul');
    const city = getTimezoneOffsetHours(tz);
    return city - seoul;
  };

  /** 해당 타임존의 현재 시각 문자열 (12/24시간 형식) */
  const getTimeStringInZone = (tz: string, use24: boolean): string => {
    try {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !use24,
      };
      return new Intl.DateTimeFormat('ko-KR', opts).format(now);
    } catch {
      return '--:--:--';
    }
  };

  /** 해당 타임존 기준 오늘/어제/내일 (서울 기준 날짜와 비교) */
  const getRelativeDay = (tz: string): string => {
    try {
      const now = new Date();
      const seoulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const tzDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      if (tzDate === seoulDate) return '오늘';
      const seoulD = new Date(seoulDate);
      const tzD = new Date(tzDate);
      const diff = Math.round((tzD.getTime() - seoulD.getTime()) / 86400000);
      if (diff === -1) return '어제';
      if (diff === 1) return '내일';
      return tzDate;
    } catch {
      return '오늘';
    }
  };

  /** 해당 타임존 기준 날짜 문자열 (예: 2026년 3월 11일) */
  const getDateStringInZone = (tz: string): string => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: tz,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now);
    } catch {
      return '';
    }
  };

  /** 도시 목록 한글 이름 오름차순 정렬 */
  const worldCitiesSorted = [...WORLD_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const pad = (n: number) => n.toString().padStart(2, "0");

  const drawAnalogClock = () => {
    const canvas = analogClockRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const local = new Date(utc + getTimeOffsetMillis(timezone));

    const hours = local.getHours();
    const minutes = local.getMinutes();
    const seconds = local.getSeconds();

    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(radius, radius);

    // 시계 테두리
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.strokeStyle = "#373e56";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 시침, 분침, 초침
    drawHand(ctx, (hours % 12 + minutes / 60) * 30, radius * 0.5, 6);
    drawHand(ctx, minutes * 6, radius * 0.75, 4);
    drawHand(ctx, seconds * 6, radius * 0.85, 2);

    ctx.restore();
  };

  const drawHand = (ctx: CanvasRenderingContext2D, angleDeg: number, length: number, width: number) => {
    const angle = (Math.PI / 180) * angleDeg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * Math.sin(angle), -length * Math.cos(angle));
    ctx.strokeStyle = "#373e56";
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const showTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const createAlarm = () => {
    const newAlarm: Alarm = {
      id: `alarm-${Date.now()}`,
      hour: mainAlarmHour,
      minute: mainAlarmMinute,
      ampm: mainAlarmAMPM,
      name: mainAlarmName === '메시지를 입력하세요' ? '알람' : mainAlarmName,
      state: 'running',
      targetTime: new Date()
    };

    // 목표 시간 설정
    let targetHour = mainAlarmHour;
    if (mainAlarmAMPM === 'PM' && mainAlarmHour !== 12) {
      targetHour = mainAlarmHour + 12;
    } else if (mainAlarmAMPM === 'AM' && mainAlarmHour === 12) {
      targetHour = 0;
    }

    const targetTime = new Date();
    targetTime.setHours(targetHour);
    targetTime.setMinutes(mainAlarmMinute);
    targetTime.setSeconds(0);
    targetTime.setMilliseconds(0);

    if (targetTime <= new Date()) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    newAlarm.targetTime = targetTime;
    setAlarms([...alarms, newAlarm]);

    // 초기화
    setMainAlarmAMPM('AM');
    setMainAlarmHour(12);
    setMainAlarmMinute(0);
    setMainAlarmName('메시지를 입력하세요');
  };

  const removeAlarm = (id: string) => {
    // 인터벌 정리
    const interval = alarmIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      alarmIntervalsRef.current.delete(id);
    }
    
    // 오디오 중지
    if (alarmSoundRef.current) {
      alarmSoundRef.current.pause();
      alarmSoundRef.current.currentTime = 0;
      alarmSoundRef.current.loop = false;
    }
    
    // 모달 제거
    setAlarmModals(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => {
      if (a.id === id) {
        if (a.state === 'stopped') {
          // 알람 재시작
          const interval = setInterval(() => {
            setAlarms(prev => prev.map(alarm => {
              if (alarm.id === id && alarm.state === 'running') {
                const now = new Date();
                if (now >= alarm.targetTime) {
                  clearInterval(interval);
                  alarmIntervalsRef.current.delete(id);
                  
                  if (alarmSoundRef.current) {
                    alarmSoundRef.current.loop = true;
                    alarmSoundRef.current.play().catch(() => {});
                  }
                  
                  setAlarmModals(prev => new Map(prev).set(id, true));
                  
                  return { ...alarm, state: 'stopped' };
                }
              }
              return alarm;
            }));
          }, 1000);
          
          alarmIntervalsRef.current.set(id, interval);
          return { ...a, state: 'running' };
        } else {
          // 알람 정지
          const interval = alarmIntervalsRef.current.get(id);
          if (interval) {
            clearInterval(interval);
            alarmIntervalsRef.current.delete(id);
          }
          return { ...a, state: 'stopped' };
        }
      }
      return a;
    }));
  };
  
  const stopAlarmFromModal = (alarmId: string) => {
    // 모달 제거
    setAlarmModals(prev => {
      const newMap = new Map(prev);
      newMap.delete(alarmId);
      return newMap;
    });
    
    // 오디오 중지
    if (alarmSoundRef.current) {
      alarmSoundRef.current.pause();
      alarmSoundRef.current.currentTime = 0;
      alarmSoundRef.current.loop = false;
    }
    
    // 알람 제거
    removeAlarm(alarmId);
  };

  const createTimer = () => {
    const totalSeconds = mainTimerHour * 3600 + mainTimerMinute * 60 + mainTimerSecond;
    if (totalSeconds <= 0) {
      alert('시간을 1초 이상 설정해주세요.');
      return;
    }

    const newTimer: Timer = {
      id: `timer-${Date.now()}`,
      hours: mainTimerHour,
      minutes: mainTimerMinute,
      seconds: mainTimerSecond,
      name: mainTimerName === '메시지를 입력하세요' ? '타이머' : mainTimerName,
      state: 'running',
      remaining: totalSeconds
    };

    setTimers([...timers, newTimer]);

    // 초기화
    setMainTimerHour(0);
    setMainTimerMinute(0);
    setMainTimerSecond(0);
    setMainTimerName('메시지를 입력하세요');
  };

  const removeTimer = (id: string) => {
    // 인터벌 정리
    const interval = timerIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      timerIntervalsRef.current.delete(id);
    }
    
    // 오디오 중지
    if (timerSoundRef.current) {
      timerSoundRef.current.pause();
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.loop = false;
    }
    
    // 모달 제거
    setTimerModals(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        if (t.state === 'stopped') {
          // 타이머 시작
          const interval = setInterval(() => {
            setTimers(prev => prev.map(timer => {
              if (timer.id === id && timer.state === 'running' && timer.remaining > 0) {
                const newRemaining = timer.remaining - 1;
                if (newRemaining <= 0) {
                  clearInterval(interval);
                  timerIntervalsRef.current.delete(id);
                  
                  if (timerSoundRef.current) {
                    timerSoundRef.current.loop = true;
                    timerSoundRef.current.play().catch(() => {});
                  }
                  
                  setTimerModals(prev => new Map(prev).set(id, true));
                  
                  return { ...timer, remaining: 0, state: 'stopped' };
                }
                return { ...timer, remaining: newRemaining };
              }
              return timer;
            }));
          }, 1000);
          
          timerIntervalsRef.current.set(id, interval);
          return { ...t, state: 'running' };
        } else if (t.state === 'running') {
          // 타이머 일시정지
          const interval = timerIntervalsRef.current.get(id);
          if (interval) {
            clearInterval(interval);
            timerIntervalsRef.current.delete(id);
          }
          return { ...t, state: 'paused' };
        } else if (t.state === 'paused') {
          // 타이머 계속
          const interval = setInterval(() => {
            setTimers(prev => prev.map(timer => {
              if (timer.id === id && timer.state === 'running' && timer.remaining > 0) {
                const newRemaining = timer.remaining - 1;
                if (newRemaining <= 0) {
                  clearInterval(interval);
                  timerIntervalsRef.current.delete(id);
                  
                  if (timerSoundRef.current) {
                    timerSoundRef.current.loop = true;
                    timerSoundRef.current.play().catch(() => {});
                  }
                  
                  setTimerModals(prev => new Map(prev).set(id, true));
                  
                  return { ...timer, remaining: 0, state: 'stopped' };
                }
                return { ...timer, remaining: newRemaining };
              }
              return timer;
            }));
          }, 1000);
          
          timerIntervalsRef.current.set(id, interval);
          return { ...t, state: 'running' };
        }
      }
      return t;
    }));
  };

  const resetTimer = (id: string) => {
    // 인터벌 정리
    const interval = timerIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      timerIntervalsRef.current.delete(id);
    }
    
    // 오디오 중지
    if (timerSoundRef.current) {
      timerSoundRef.current.pause();
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.loop = false;
    }
    
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        const totalSeconds = t.hours * 3600 + t.minutes * 60 + t.seconds;
        return { ...t, remaining: totalSeconds, state: 'stopped' };
      }
      return t;
    }));
  };

  const addTimeToTimer = (id: string, seconds: number) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, remaining: Math.max(0, t.remaining + seconds) };
      }
      return t;
    }));
  };
  
  const stopTimerFromModal = (timerId: string) => {
    // 모달 제거
    setTimerModals(prev => {
      const newMap = new Map(prev);
      newMap.delete(timerId);
      return newMap;
    });
    
    // 오디오 중지
    if (timerSoundRef.current) {
      timerSoundRef.current.pause();
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.loop = false;
    }
    
    // 타이머 제거
    removeTimer(timerId);
  };
  
  const addTimeToMainTimer = (minutesToAdd: number) => {
    let newMinute = mainTimerMinute + minutesToAdd;
    let newHour = mainTimerHour;
    
    if (newMinute >= 60) {
      const additionalHours = Math.floor(newMinute / 60);
      newHour += additionalHours;
      newMinute = newMinute % 60;
      
      if (newHour > 99) {
        newHour = 99;
        newMinute = 59;
      }
    }
    
    setMainTimerHour(newHour);
    setMainTimerMinute(newMinute);
  };
  
  const resetMainTimer = () => {
    setMainTimerHour(0);
    setMainTimerMinute(0);
    setMainTimerSecond(0);
  };

  const toggleStopwatch = (id: string) => {
    setStopwatches(prev => prev.map(sw => {
      if (sw.id === id) {
        if (sw.running) {
          // 정지
          const interval = stopwatchIntervalsRef.current.get(id);
          if (interval) {
            clearInterval(interval);
            stopwatchIntervalsRef.current.delete(id);
          }
          return { ...sw, running: false };
        } else {
          // 시작
          const startTime = Date.now() - sw.elapsed;
          const interval = setInterval(() => {
            setStopwatches(prev => prev.map(s => {
              if (s.id === id && s.running) {
                const elapsed = Date.now() - s.startTime;
                return { ...s, elapsed };
              }
              return s;
            }));
          }, 10);
          
          stopwatchIntervalsRef.current.set(id, interval);
          return { ...sw, running: true, startTime };
        }
      }
      return sw;
    }));
  };

  const resetStopwatch = (id: string) => {
    // 인터벌 정리
    const interval = stopwatchIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      stopwatchIntervalsRef.current.delete(id);
    }
    
    setStopwatches(prev => prev.map(sw => 
      sw.id === id ? { ...sw, elapsed: 0, running: false, laps: [] } : sw
    ));
  };

  const addLap = (id: string) => {
    setStopwatches(stopwatches.map(sw => {
      if (sw.id === id && sw.running) {
        const total = sw.elapsed;
        const ms = total % 1000;
        const s = Math.floor(total / 1000) % 60;
        const m = Math.floor(total / (1000 * 60)) % 60;
        const h = Math.floor(total / (1000 * 60 * 60));
        const lapTime = `${pad(h)}:${pad(m)}:${pad(s)}.${String(ms).padStart(3, '0')}`;
        return { ...sw, laps: [...sw.laps, lapTime] };
      }
      return sw;
    }));
  };

  const removeStopwatch = (id: string) => {
    // 인터벌 정리
    const interval = stopwatchIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      stopwatchIntervalsRef.current.delete(id);
    }
    
    setStopwatches(prev => prev.filter(sw => sw.id !== id));
  };

  const formatTime = (milliseconds: number) => {
    const ms = milliseconds % 1000;
    const s = Math.floor(milliseconds / 1000) % 60;
    const m = Math.floor(milliseconds / (1000 * 60)) % 60;
    const h = Math.floor(milliseconds / (1000 * 60 * 60));
    return {
      hours: pad(h),
      minutes: pad(m),
      seconds: pad(s),
      milliseconds: String(ms).padStart(3, '0')
    };
  };

  const formatTimerTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const getRemainingTime = (targetTime: Date) => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    if (diff <= 0) return '알람 시간!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `남은시간: ${hours}시간 ${minutes}분 ${secs}초`;
  };

  return (
    <>
      <Navbar />
      <section className="py-10 px-4 bg-[#E9ECEF] min-h-screen">
        {/* 탭 버튼 */}
        <div className="flex justify-center flex-wrap gap-4 mb-10">
          <button 
            className={`tab px-6 py-2 rounded-full shadow transition-colors ${
              activeTab === 'clock' 
                ? 'bg-[#373e56] text-white' 
                : 'bg-white text-gray-700'
            }`}
            onClick={() => showTab('clock')}
          >
            시계
          </button>
          <button 
            className={`tab px-6 py-2 rounded-full shadow transition-colors ${
              activeTab === 'alarm' 
                ? 'bg-[#373e56] text-white' 
                : 'bg-white text-gray-700'
            }`}
            onClick={() => showTab('alarm')}
          >
            알람
          </button>
          <button 
            className={`tab px-6 py-2 rounded-full shadow transition-colors ${
              activeTab === 'stopwatch' 
                ? 'bg-[#373e56] text-white' 
                : 'bg-white text-gray-700'
            }`}
            onClick={() => showTab('stopwatch')}
          >
            스톱워치
          </button>
          <button 
            className={`tab px-6 py-2 rounded-full shadow transition-colors ${
              activeTab === 'timer' 
                ? 'bg-[#373e56] text-white' 
                : 'bg-white text-gray-700'
            }`}
            onClick={() => showTab('timer')}
          >
            타이머
          </button>
        </div>

        {/* 시계 탭 */}
        {activeTab === 'clock' && (
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">디지털 시계</h3>
              {(() => {
                const effectiveMainId = selectedCityIds.includes(mainCityId) ? mainCityId : selectedCityIds[0];
                const mainCity = WORLD_CITIES.find((c) => c.id === effectiveMainId);
                return (
                  <>
                    <div className="flex flex-wrap justify-center items-center gap-3 mb-2">
                      <label htmlFor="main-city" className="text-sm font-medium text-gray-600">주 시계 도시:</label>
                      <select
                        id="main-city"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
                        value={effectiveMainId}
                        onChange={(e) => setMainCityId(e.target.value)}
                      >
                        {[...selectedCityIds]
                          .map((id) => WORLD_CITIES.find((c) => c.id === id))
                          .filter(Boolean)
                          .sort((a, b) => (a!.name).localeCompare(b!.name, 'ko'))
                          .map((city) => (
                            <option key={city!.id} value={city!.id}>
                              {city!.name}, {city!.country}
                            </option>
                          ))}
                      </select>
                    </div>
                    {mainCity && (
                      <p className="text-gray-600 text-sm mb-2">
                        {mainCity.name}, {mainCity.country}
                        {isMounted ? ` · ${getDateStringInZone(mainCity.timeZone)}` : ''}
                      </p>
                    )}
                  </>
                );
              })()}
              <div className="text-5xl font-bold text-[#373e56] mb-4">
                {isMounted ? digitalTime : '--:--:--'}
              </div>
              <button 
                onClick={() => setIs24Hour(!is24Hour)}
                className="bg-[#373e56] text-white px-4 py-2 rounded-full hover:bg-[#2a3142]"
              >
                12/24시간 형식 변환
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-semibold">세계 시계</h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="add-city" className="text-sm font-medium text-gray-600">도시 추가:</label>
                  <select
                    id="add-city"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
                    value=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id && !selectedCityIds.includes(id)) {
                        setSelectedCityIds((prev) => [...prev, id]);
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">선택하세요</option>
                    {worldCitiesSorted.filter((c) => !selectedCityIds.includes(c.id)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}, {c.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                {isMounted
                  ? new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedCityIds.map((cityId) => {
                  const city = WORLD_CITIES.find((c) => c.id === cityId);
                  if (!city) return null;
                  const tz = city.timeZone;
                  const offsetHours = getOffsetHoursFromSeoul(tz);
                  const offsetStr = offsetHours === 0 ? '+0시간' : offsetHours > 0 ? `+${offsetHours}시간` : `${offsetHours}시간`;
                  return (
                    <div
                      key={cityId}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-[#373e56]">{city.name}</h4>
                          <p className="text-sm text-gray-500">{city.country}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="제거"
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                          onClick={() => {
                            const next = selectedCityIds.filter((id) => id !== cityId);
                            setSelectedCityIds(next.length > 0 ? next : ['Asia/Seoul']);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {isMounted ? `${getDateStringInZone(tz)} (${getRelativeDay(tz)})` : '—'}
                      </div>
                      <div className="text-2xl font-bold text-[#373e56] mt-1">
                        {isMounted ? getTimeStringInZone(tz, is24Hour) : '--:--:--'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        서울 대비 {offsetStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">아날로그 시계</h3>
              <canvas 
                ref={analogClockRef}
                width={250} 
                height={250} 
                className="mx-auto"
              ></canvas>
            </div>
          </div>
        )}

        {/* 알람 탭 */}
        {activeTab === 'alarm' && (
          <div className="bg-[#E9ECEF] rounded-xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-4">알람</h3>
            
            {/* 메인 알람 설정 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="time-picker-container bg-white rounded-lg p-4 w-full border mb-4">
                <div className="time-picker flex items-center justify-center space-x-8">
                  {/* AM/PM 선택 */}
                  <div
                    className="ampm-selector flex flex-col items-center justify-center"
                    tabIndex={0}
                    role="spinbutton"
                    aria-valuetext={mainAlarmAMPM}
                    aria-label="AM/PM"
                    onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <div 
                      className={`time-option text-xl cursor-pointer ${
                        mainAlarmAMPM === 'PM' ? 'text-gray-300' : 'text-[#373e56] text-3xl font-bold'
                      }`}
                      onClick={() => setMainAlarmAMPM('AM')}
                    >
                      AM
                    </div>
                    <div 
                      className={`time-option text-xl cursor-pointer ${
                        mainAlarmAMPM === 'AM' ? 'text-gray-300' : 'text-[#373e56] text-3xl font-bold'
                      }`}
                      onClick={() => setMainAlarmAMPM('PM')}
                    >
                      PM
                    </div>
                  </div>
                  
                  {/* 시간 선택 */}
                  <div
                    className="hour-selector flex flex-col items-center justify-center"
                    tabIndex={0}
                    role="spinbutton"
                    aria-valuenow={mainAlarmHour}
                    aria-valuemin={1}
                    aria-valuemax={12}
                    aria-label="시간"
                    onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainAlarmHour <= 1 ? 12 : mainAlarmHour - 1}
                    >
                      {mainAlarmHour <= 1 ? 12 : mainAlarmHour - 1}
                    </div>
                    <div 
                      className="time-option text-[#373e56] text-3xl font-bold cursor-pointer"
                      data-value={mainAlarmHour}
                    >
                      {mainAlarmHour}
                    </div>
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainAlarmHour >= 12 ? 1 : mainAlarmHour + 1}
                    >
                      {mainAlarmHour >= 12 ? 1 : mainAlarmHour + 1}
                    </div>
                  </div>
                  
                  <div className="text-[#373e56] text-3xl font-bold">:</div>
                  
                  {/* 분 선택 */}
                  <div
                    className="minute-selector flex flex-col items-center justify-center"
                    tabIndex={0}
                    role="spinbutton"
                    aria-valuenow={mainAlarmMinute}
                    aria-valuemin={0}
                    aria-valuemax={59}
                    aria-label="분"
                    onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainAlarmMinute <= 0 ? 59 : mainAlarmMinute - 1}
                    >
                      {pad(mainAlarmMinute <= 0 ? 59 : mainAlarmMinute - 1)}
                    </div>
                    <div 
                      className="time-option text-[#373e56] text-3xl font-bold cursor-pointer"
                      data-value={mainAlarmMinute}
                    >
                      {pad(mainAlarmMinute)}
                    </div>
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainAlarmMinute >= 59 ? 0 : mainAlarmMinute + 1}
                    >
                      {pad(mainAlarmMinute >= 59 ? 0 : mainAlarmMinute + 1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center mb-4">
                <input 
                  type="text" 
                  value={mainAlarmName}
                  onChange={(e) => setMainAlarmName(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === '메시지를 입력하세요') {
                      setMainAlarmName('');
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim() === '') {
                      setMainAlarmName('메시지를 입력하세요');
                    }
                  }}
                  className="text-lg font-semibold bg-transparent border-none outline-none focus:border-b-2 focus:border-[#373e56] px-1 text-center"
                />
              </div>
              
              <div className="flex justify-center gap-2">
                <button 
                  onClick={createAlarm}
                  className="bg-[#373e56] hover:bg-[#2a3142] text-white font-medium py-2 px-6 rounded-full"
                >
                  시작
                </button>
              </div>
            </div>

            {/* 알람 목록 */}
            <div className="space-y-4">
              {alarms.map(alarm => (
                <div key={alarm.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-semibold text-gray-800">{alarm.name}</div>
                    <button 
                      onClick={() => removeAlarm(alarm.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      제거
                    </button>
                  </div>
                  
                  <div className="text-4xl font-bold text-[#373e56] text-center mb-4">
                    {pad(alarm.hour)}:{pad(alarm.minute)} {alarm.ampm}
                  </div>
                  
                  <div className="flex justify-center gap-2 mb-2">
                    <button 
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`${
                        alarm.state === 'running' 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white font-medium py-1 px-4 rounded-full`}
                    >
                      {alarm.state === 'running' ? '정지' : '시작'}
                    </button>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    {alarm.state === 'running' ? getRemainingTime(alarm.targetTime) : '알람이 정지되었습니다'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 스톱워치 탭 */}
        {activeTab === 'stopwatch' && (
          <div className="bg-[#E9ECEF] rounded-xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-4">스톱워치</h3>
            <div className="space-y-6">
              {stopwatches.map(sw => {
                const time = formatTime(sw.elapsed);
                return (
                  <div key={sw.id} className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <input 
                        type="text" 
                        value={sw.name}
                        onChange={(e) => setStopwatches(stopwatches.map(s => 
                          s.id === sw.id ? { ...s, name: e.target.value } : s
                        ))}
                        onFocus={(e) => {
                          if (e.target.value === '이름을 입력하세요') {
                            e.target.value = '';
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim() === '') {
                            setStopwatches(stopwatches.map(s => 
                              s.id === sw.id ? { ...s, name: '이름을 입력하세요' } : s
                            ));
                          }
                        }}
                        className="text-lg font-semibold text-gray-800 bg-transparent border-none outline-none focus:border-b-2 focus:border-[#373e56] px-1"
                      />
                      <button 
                        onClick={() => removeStopwatch(sw.id)}
                        className="text-red-500 text-sm font-semibold hover:underline"
                      >
                        제거
                      </button>
                    </div>

                    <div className="flex justify-center items-baseline mb-4">
                      <div className="text-5xl font-bold text-[#373e56]">
                        {time.hours}:{time.minutes}:{time.seconds}
                      </div>
                      <div className="text-xl text-[#373e56] ml-2">.{time.milliseconds}</div>
                    </div>

                    <div className="flex justify-center gap-3 mb-4">
                      <button 
                        onClick={() => toggleStopwatch(sw.id)}
                        className="bg-[#373e56] text-white font-semibold px-4 py-2 rounded-full shadow hover:bg-[#2a3142]"
                      >
                        {sw.running ? '정지' : '시작'}
                      </button>
                      <button 
                        onClick={() => addLap(sw.id)}
                        className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-full shadow hover:bg-blue-600"
                      >
                        랩
                      </button>
                      <button 
                        onClick={() => resetStopwatch(sw.id)}
                        className="bg-gray-400 text-white font-semibold px-4 py-2 rounded-full shadow hover:bg-gray-500"
                      >
                        리셋
                      </button>
                    </div>

                    <ul className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                      {sw.laps.map((lap, idx) => (
                        <li key={idx}>{lap}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={createStopwatch}
              className="mt-6 bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600"
            >
              스톱워치 추가
            </button>
          </div>
        )}

        {/* 타이머 탭 */}
        {activeTab === 'timer' && (
          <div id="timer" className="tab-content active bg-[#E9ECEF] rounded-xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-4">타이머</h3>
            
            {/* 메인 타이머 설정 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="time-picker-container bg-white rounded-lg p-4 w-full border mb-4">
                <div className="time-picker flex items-center justify-center space-x-8">
                  {/* 시간 선택 */}
                  <div id="mainTimerSetup">
                    <div
                      className="hour-selector flex flex-col items-center"
                      tabIndex={0}
                      role="spinbutton"
                      aria-valuenow={mainTimerHour}
                      aria-valuemin={0}
                      aria-valuemax={99}
                      aria-label="시간"
                      onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                    >
                      <div 
                        className="time-option text-gray-300 text-xl cursor-pointer"
                        data-value={mainTimerHour === 0 ? 99 : mainTimerHour - 1}
                      >
                        {mainTimerHour === 0 ? 99 : mainTimerHour - 1}
                      </div>
                      <div 
                        className="time-option text-[#373e56] text-3xl font-bold cursor-pointer"
                        data-value={mainTimerHour}
                      >
                        {mainTimerHour}
                      </div>
                      <div 
                        className="time-option text-gray-300 text-xl cursor-pointer"
                        data-value={mainTimerHour === 99 ? 0 : mainTimerHour + 1}
                      >
                        {mainTimerHour === 99 ? 0 : mainTimerHour + 1}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[#373e56] text-3xl font-bold">:</div>
                  
                  {/* 분 선택 */}
                  <div
                    className="minute-selector flex flex-col items-center"
                    tabIndex={0}
                    role="spinbutton"
                    aria-valuenow={mainTimerMinute}
                    aria-valuemin={0}
                    aria-valuemax={59}
                    aria-label="분"
                    onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainTimerMinute <= 0 ? 59 : mainTimerMinute - 1}
                    >
                      {pad(mainTimerMinute <= 0 ? 59 : mainTimerMinute - 1)}
                    </div>
                    <div 
                      className="time-option text-[#373e56] text-3xl font-bold cursor-pointer"
                      data-value={mainTimerMinute}
                    >
                      {pad(mainTimerMinute)}
                    </div>
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainTimerMinute >= 59 ? 0 : mainTimerMinute + 1}
                    >
                      {pad(mainTimerMinute >= 59 ? 0 : mainTimerMinute + 1)}
                    </div>
                  </div>
                  
                  <div className="text-[#373e56] text-3xl font-bold">:</div>
                  
                  {/* 초 선택 */}
                  <div
                    className="second-selector flex flex-col items-center"
                    tabIndex={0}
                    role="spinbutton"
                    aria-valuenow={mainTimerSecond}
                    aria-valuemin={0}
                    aria-valuemax={59}
                    aria-label="초"
                    onMouseDown={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainTimerSecond <= 0 ? 59 : mainTimerSecond - 1}
                    >
                      {pad(mainTimerSecond <= 0 ? 59 : mainTimerSecond - 1)}
                    </div>
                    <div 
                      className="time-option text-[#373e56] text-3xl font-bold cursor-pointer"
                      data-value={mainTimerSecond}
                    >
                      {pad(mainTimerSecond)}
                    </div>
                    <div 
                      className="time-option text-gray-300 text-xl cursor-pointer"
                      data-value={mainTimerSecond >= 59 ? 0 : mainTimerSecond + 1}
                    >
                      {pad(mainTimerSecond >= 59 ? 0 : mainTimerSecond + 1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center mb-4">
                <input 
                  type="text" 
                  value={mainTimerName}
                  onChange={(e) => setMainTimerName(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === '메시지를 입력하세요') {
                      setMainTimerName('');
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim() === '') {
                      setMainTimerName('메시지를 입력하세요');
                    }
                  }}
                  className="text-lg font-semibold bg-transparent border-none outline-none focus:border-b-2 focus:border-[#373e56] px-1 text-center"
                />
              </div>
              
              <div className="flex justify-center gap-2">
                <button 
                  onClick={createTimer}
                  className="bg-[#373e56] hover:bg-[#2a3142] text-white font-medium py-2 px-6 rounded-full"
                >
                  시작
                </button>
              </div>
            </div>

            {/* 빠른 시간 추가 버튼 (메인 타이머 설정 아래) */}
            <div className="mb-4 flex justify-center flex-wrap gap-2">
              <button 
                onClick={() => addTimeToMainTimer(1)}
                className="bg-[#373e56] text-white px-3 py-2 rounded-full text-sm"
              >
                1분
              </button>
              <button 
                onClick={() => addTimeToMainTimer(5)}
                className="bg-[#373e56] text-white px-3 py-2 rounded-full text-sm"
              >
                5분
              </button>
              <button 
                onClick={() => addTimeToMainTimer(10)}
                className="bg-[#373e56] text-white px-3 py-2 rounded-full text-sm"
              >
                10분
              </button>
              <button 
                onClick={() => addTimeToMainTimer(30)}
                className="bg-[#373e56] text-white px-3 py-2 rounded-full text-sm"
              >
                30분
              </button>
              <button 
                onClick={() => addTimeToMainTimer(60)}
                className="bg-[#373e56] text-white px-3 py-2 rounded-full text-sm"
              >
                1시간
              </button>
              <button 
                onClick={resetMainTimer}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-full text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                초기화
              </button>
            </div>

            {/* 타이머 목록 */}
            <div className="space-y-4">
              {timers.map(timer => (
                <div key={timer.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-semibold text-gray-800">{timer.name}</div>
                    <button 
                      onClick={() => removeTimer(timer.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      제거
                    </button>
                  </div>

                  <div className="text-4xl font-bold text-[#373e56] text-center mb-4">
                    {formatTimerTime(timer.remaining)}
                  </div>

                  <div className="flex justify-center gap-2 mb-2">
                    <button 
                      onClick={() => toggleTimer(timer.id)}
                      className={`${
                        timer.state === 'running' 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : timer.state === 'paused'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-[#373e56] hover:bg-[#2a3142]'
                      } text-white font-medium py-1 px-4 rounded-full`}
                    >
                      {timer.state === 'running' ? '일시정지' : timer.state === 'paused' ? '계속' : '시작'}
                    </button>
                    <button 
                      onClick={() => resetTimer(timer.id)}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-1 px-4 rounded-full"
                    >
                      리셋
                    </button>
                  </div>
                  {timerModals.get(timer.id) && (
                    <div className="text-center">
                      <button 
                        onClick={() => {
                          if (timerSoundRef.current) {
                            timerSoundRef.current.pause();
                            timerSoundRef.current.currentTime = 0;
                            timerSoundRef.current.loop = false;
                          }
                          setTimerModals(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(timer.id);
                            return newMap;
                          });
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-4 rounded-full"
                      >
                        알람 소리 끄기
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
      
      {/* 알람 모달 */}
      {Array.from(alarmModals.entries()).map(([alarmId, show]) => {
        if (!show) return null;
        const alarm = alarms.find(a => a.id === alarmId);
        if (!alarm) return null;
        return (
          <div key={alarmId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopAlarmFromModal(alarmId);
            }
          }}>
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">알람!</h2>
                <p className="text-xl text-gray-600 mb-8">{alarm.name}</p>
                <button 
                  onClick={() => stopAlarmFromModal(alarmId)}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  알람 끄기
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* 타이머 모달 */}
      {Array.from(timerModals.entries()).map(([timerId, show]) => {
        if (!show) return null;
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return null;
        return (
          <div key={timerId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopTimerFromModal(timerId);
            }
          }}>
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">타이머 완료!</h2>
                <p className="text-xl text-gray-600 mb-8">{timer.name}</p>
                <button 
                  onClick={() => stopTimerFromModal(timerId)}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  타이머 끄기
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      <style jsx>{`
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block !important;
        }
        .hidden {
          display: none !important;
        }
      `}</style>
    </>
  );
}

