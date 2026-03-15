import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFlashTrackGameReturn {
  // 상태
  score: number;
  highScore: number;
  showMessage: boolean;
  messageText: string;
  stage: number;
  showStageMessage: boolean;
  
  // 핸들러
  handleButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  startNewGame: () => void;
  exitGame: () => void;
}

/**
 * FlashTrack 게임 로직을 관리하는 커스텀 훅
 */
export function useFlashTrackGame(onExit: () => void): UseFlashTrackGameReturn {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [stage, setStage] = useState(1);
  const [showStageMessage, setShowStageMessage] = useState(false);

  const sequenceRef = useRef<number[]>([]);
  const playerSequenceRef = useRef<number[]>([]);
  const activeButtonsRef = useRef(3);
  const bRef = useRef(3);
  const cRef = useRef(1);
  const isShowingSequenceRef = useRef(false);
  const startTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const showAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const deadAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  /** 구역별 음 높이 (1~8: inner 1-4, outer 1-4) - C4~C5 옥타브 */
  const SEGMENT_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];

  const playSegmentTone = useCallback((segmentIndex: number) => {
    const freq = SEGMENT_FREQUENCIES[segmentIndex - 1];
    if (!freq) return;
    try {
      const ctx = audioContextRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      if (showAudioRef.current) {
        showAudioRef.current.currentTime = 0;
        showAudioRef.current.play().catch(() => {});
      }
    }
  }, []);

  const setupButtonColors = useCallback(() => {
    const buttons = document.querySelectorAll('.quarter-button') as NodeListOf<HTMLElement>;
    
    buttons.forEach((button) => {
      button.style.backgroundColor = '#FFFFFF';
      button.classList.add('inactive');
      button.style.display = 'none';
    });

    const fixedColors: { [key: string]: string } = {
      'inner-btn-1': 'url("/images/games/flashtrack_3D_Blue.png")',
      'inner-btn-2': 'url("/images/games/flashtrack_3D_Cyan.png")',
      'inner-btn-3': 'url("/images/games/flashtrack_3D_Pink.png")',
      'inner-btn-4': 'url("/images/games/flashtrack_3D_Purple.png")',
      'outer-btn-1': 'url("/images/games/flashtrack_3D_Red.png")',
      'outer-btn-2': 'url("/images/games/flashtrack_3D_Orange.png")',
      'outer-btn-3': 'url("/images/games/flashtrack_3D_Green.png")',
      'outer-btn-4': 'url("/images/games/flashtrack_3D_Yellow.png")'
    };

    Object.keys(fixedColors).forEach((buttonId, index) => {
      const button = document.getElementById(buttonId) as HTMLElement;
      if (button && index < activeButtonsRef.current) {
        button.style.backgroundImage = fixedColors[buttonId];
        button.style.backgroundSize = 'cover';
        button.style.display = 'block';
        button.classList.remove('inactive');
      }
    });
  }, []);

  /** 플래시 후 복원할 기준 transform (겹침 방지) */
  const BASE_TRANSFORMS: Record<string, string> = {
    'inner-btn-1': 'rotate(0deg)',
    'inner-btn-2': 'rotate(90deg)',
    'inner-btn-3': 'rotate(270deg)',
    'inner-btn-4': 'rotate(180deg)',
    'outer-btn-1': 'rotate(0deg)',
    'outer-btn-2': 'rotate(90deg)',
    'outer-btn-3': 'rotate(270deg)',
    'outer-btn-4': 'rotate(180deg)',
  };

  const flashButton = useCallback((button: HTMLElement, segmentIndex: number) => {
    if (!button || button.classList.contains('inactive')) return;
    playSegmentTone(segmentIndex);
    const buttonId = button.id;
    const baseTransform = BASE_TRANSFORMS[buttonId] ?? '';
    const originalTransition = button.style.transition;
    button.style.transition = 'all 0.15s ease-in-out';

    const computedStyle = getComputedStyle(button);
    const currentTransform = computedStyle.transform;

    if (currentTransform === 'none' || currentTransform === 'matrix(1, 0, 0, 1, 0, 0)') {
      button.style.transform = 'scale(1.15)';
    } else {
      button.style.transform = currentTransform + ' scale(1.15)';
    }

    setTimeout(() => {
      button.style.transform = baseTransform;
      setTimeout(() => {
        button.style.transition = originalTransition;
      }, 150);
    }, 300);
  }, [playSegmentTone]);

  const playSequence = useCallback(() => {
    isShowingSequenceRef.current = true;
    let i = 0;
    startTimeRef.current = performance.now();
    const interval = setInterval(() => {
      const seg = sequenceRef.current[i];
      const buttonId = seg <= 4 ? `inner-btn-${seg}` : `outer-btn-${seg - 4}`;
      const button = document.getElementById(buttonId) as HTMLElement;
      if (button) flashButton(button, seg);
      i++;
      if (i >= sequenceRef.current.length) {
        clearInterval(interval);
        playerSequenceRef.current = [];
        isShowingSequenceRef.current = false;
      }
    }, 500);
  }, [flashButton]);

  const generateSequence = useCallback(() => {
    const numberOfFlashes = bRef.current;
    sequenceRef.current = [];
    for (let i = 0; i < numberOfFlashes; i++) {
      sequenceRef.current.push(Math.floor(Math.random() * activeButtonsRef.current) + 1);
    }
    playSequence();
  }, [playSequence]);

  const calculateScore = useCallback(() => {
    const timeTaken = performance.now() - startTimeRef.current;
    const baseScore = bRef.current * activeButtonsRef.current * 10;
    const timeBonus = Math.max(0, (1000 / timeTaken) * 50);
    return Math.round(baseScore + timeBonus);
  }, []);

  const checkPlayerInput = useCallback(() => {
    const currentStep = playerSequenceRef.current.length - 1;
    if (playerSequenceRef.current[currentStep] !== sequenceRef.current[currentStep]) {
      endGame();
      return;
    }

    if (playerSequenceRef.current.length === sequenceRef.current.length) {
      const newScore = calculateScore();
      setScore(prev => {
        const next = prev + newScore;
        scoreRef.current = next;
        return next;
      });

      bRef.current++;
      if (bRef.current > activeButtonsRef.current * 2) {
        activeButtonsRef.current++;
        bRef.current = activeButtonsRef.current;
        setupButtonColors();
      }

      cRef.current++;
      setStage(cRef.current);
      showStageMessageFunc(cRef.current);
      setTimeout(generateSequence, 1000);
    }
  }, [calculateScore, setupButtonColors, generateSequence]);

  const showStageMessageFunc = useCallback((stageNum: number) => {
    setShowStageMessage(true);
    setTimeout(() => {
      setShowStageMessage(false);
    }, 1000);
  }, []);

  const updateHighScore = useCallback(() => {
    const currentScore = scoreRef.current;
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem('flashtrackhighScore', currentScore.toString());
    }
  }, [highScore]);

  const endGame = useCallback(() => {
    if (deadAudioRef.current) {
      deadAudioRef.current.currentTime = 0;
      deadAudioRef.current.play().catch(e => console.log('패배 오디오 재생 실패:', e));
    }
    const finalScore = scoreRef.current;
    setMessageText(`게임이 끝났습니다. 최종 점수: ${finalScore}점`);
    setShowMessage(true);
    updateHighScore();
  }, [updateHighScore]);

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    if (target.classList.contains('inactive')) return;
    if (isShowingSequenceRef.current) return;
    const buttonId = target.id;
    const buttonNumber = buttonId.includes('inner-btn')
      ? parseInt(buttonId.split('-')[2], 10)
      : parseInt(buttonId.split('-')[2], 10) + 4;
    playSegmentTone(buttonNumber);
    playerSequenceRef.current.push(buttonNumber);
    
    target.classList.add('button-clicked');
    setTimeout(() => {
      target.classList.remove('button-clicked');
    }, 150);
    
    checkPlayerInput();
  }, [checkPlayerInput]);

  const startNewGame = useCallback(() => {
    sequenceRef.current = [];
    playerSequenceRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    activeButtonsRef.current = 3;
    bRef.current = 3;
    cRef.current = 1;
    setStage(1);
    isShowingSequenceRef.current = false;
    setShowMessage(false);
    setupButtonColors();
    showStageMessageFunc(1);
    setTimeout(generateSequence, 1000);
  }, [setupButtonColors, showStageMessageFunc, generateSequence]);

  const exitGame = useCallback(() => {
    onExit();
  }, [onExit]);

  // 초기화
  useEffect(() => {
    // 오디오 초기화
    showAudioRef.current = new Audio('/audio/games/flashtrack_show.mp3');
    clickAudioRef.current = new Audio('/audio/games/flasktrack_click.mp3');
    deadAudioRef.current = new Audio('/audio/games/flashtrack_dead.mp3');
    
    if (showAudioRef.current) showAudioRef.current.volume = 0.7;
    if (clickAudioRef.current) clickAudioRef.current.volume = 0.7;
    if (deadAudioRef.current) deadAudioRef.current.volume = 0.8;

    // 최고 점수 로드
    const savedHighScore = localStorage.getItem('flashtrackhighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    startNewGame();
  }, [startNewGame]);

  return {
    score,
    highScore,
    showMessage,
    messageText,
    stage,
    showStageMessage,
    handleButtonClick,
    startNewGame,
    exitGame,
  };
}

