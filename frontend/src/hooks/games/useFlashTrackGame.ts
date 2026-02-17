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
  const showAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const deadAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const flashButton = useCallback((button: HTMLElement) => {
    if (!button || button.classList.contains('inactive')) return;
    
    if (showAudioRef.current) {
      showAudioRef.current.currentTime = 0;
      showAudioRef.current.play().catch(e => console.log('오디오 재생 실패:', e));
    }
    
    const originalTransform = button.style.transform;
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
      button.style.transform = originalTransform;
      setTimeout(() => {
        button.style.transition = originalTransition;
      }, 150);
    }, 300);
  }, []);

  const playSequence = useCallback(() => {
    isShowingSequenceRef.current = true;
    let i = 0;
    startTimeRef.current = performance.now();
    const interval = setInterval(() => {
      const buttonId = sequenceRef.current[i] <= 4 
        ? `inner-btn-${sequenceRef.current[i]}` 
        : `outer-btn-${sequenceRef.current[i] - 4}`;
      const button = document.getElementById(buttonId) as HTMLElement;
      if (button) flashButton(button);
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
      setScore(prev => prev + newScore);

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
    if (score > highScore) {
      const newHighScore = score;
      setHighScore(newHighScore);
      localStorage.setItem('flashtrackhighScore', newHighScore.toString());
    }
  }, [score, highScore]);

  const endGame = useCallback(() => {
    if (deadAudioRef.current) {
      deadAudioRef.current.currentTime = 0;
      deadAudioRef.current.play().catch(e => console.log('패배 오디오 재생 실패:', e));
    }
    
    setMessageText(`게임이 끝났습니다. 최종 점수: ${score}점`);
    setShowMessage(true);
    updateHighScore();
  }, [score, updateHighScore]);

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    if (target.classList.contains('inactive')) return;
    if (isShowingSequenceRef.current) return;
    
    if (showAudioRef.current) {
      showAudioRef.current.currentTime = 0;
      showAudioRef.current.play().catch(e => console.log('클릭 오디오 재생 실패:', e));
    }
    
    const buttonId = target.id;
    const buttonNumber = buttonId.includes('inner-btn') 
      ? parseInt(buttonId.split('-')[2]) 
      : parseInt(buttonId.split('-')[2]) + 4;
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

