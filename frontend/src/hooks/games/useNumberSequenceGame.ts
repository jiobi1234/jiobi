import { useState, useEffect, useRef, useCallback } from 'react';

interface UseNumberSequenceGameReturn {
  // 상태
  score: number;
  highScore: number;
  time: number;
  level: number;
  sequence: number[];
  userSequence: number[];
  showGameOver: boolean;
  gameOverMessage: string;
  showInstruction: boolean;
  
  // 핸들러
  handleNumberClick: (number: number) => void;
  handleRestart: () => void;
  exitGame: () => void;
}

/**
 * 숫자 순서 게임 로직을 관리하는 커스텀 훅
 */
export function useNumberSequenceGame(onExit: () => void): UseNumberSequenceGameReturn {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [time, setTime] = useState(0);
  const [level, setLevel] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [showInstruction, setShowInstruction] = useState(true);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  const shuffle = useCallback((array: number[]): number[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const generateSequence = useCallback((currentLevel: number): number[] => {
    const numbers: number[] = [];
    const size = currentLevel * currentLevel;
    for (let i = 1; i <= size; i++) {
      numbers.push(i);
    }
    return shuffle(numbers);
  }, [shuffle]);

  const startTimer = useCallback((timeLimit: number) => {
    let currentTime = timeLimit;
    setTime(currentTime);
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    timerIntervalRef.current = setInterval(() => {
      currentTime--;
      setTime(currentTime);
      if (currentTime <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setTime(0);
        showGameOverMessage('시간이 초과되어 게임이 끝났습니다.');
      }
    }, 1000);
  }, []);

  const showGameOverMessage = useCallback((message: string) => {
    setGameOverMessage(message);
    setShowGameOver(true);
    setShowInstruction(false);
    updateHighScore();
  }, []);

  const updateHighScore = useCallback(() => {
    if (score > highScore) {
      const newHighScore = score;
      setHighScore(newHighScore);
      localStorage.setItem('numbersequenceHighScore', newHighScore.toString());
    }
  }, [score, highScore]);

  const startLevel = useCallback((currentLevel: number) => {
    setUserSequence([]);
    const newSequence = generateSequence(currentLevel);
    setSequence(newSequence);
    startTimer(currentLevel * currentLevel + 2);
  }, [generateSequence, startTimer]);

  const initGame = useCallback(() => {
    setScore(0);
    setLevel(2);
    setShowGameOver(false);
    setShowInstruction(true);
    setUserSequence([]);
    startLevel(2);
  }, [startLevel]);

  const handleNumberClick = useCallback((number: number) => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }

    const nextNumber = userSequence.length + 1;
    if (number === nextNumber) {
      const newUserSequence = [...userSequence, number];
      setUserSequence(newUserSequence);
      setScore(prev => prev + 1);

      if (newUserSequence.length === sequence.length) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setTimeout(() => {
          const newLevel = level + 1;
          setLevel(newLevel);
          startLevel(newLevel);
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      showGameOverMessage('올바른 숫자를 선택하지 않았습니다! 게임이 끝났습니다.');
    }
  }, [userSequence, sequence, level, startLevel, showGameOverMessage]);

  const handleRestart = useCallback(() => {
    initGame();
  }, [initGame]);

  const exitGame = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    onExit();
  }, [onExit]);

  // 초기화
  useEffect(() => {
    clickAudioRef.current = new Audio('/audio/games/numbersequence_click.mp3');
    if (clickAudioRef.current) {
      clickAudioRef.current.volume = 0.7;
      clickAudioRef.current.preload = 'auto';
    }

    const saved = localStorage.getItem('numbersequenceHighScore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }

    initGame();
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [initGame]);

  return {
    score,
    highScore,
    time,
    level,
    sequence,
    userSequence,
    showGameOver,
    gameOverMessage,
    showInstruction,
    handleNumberClick,
    handleRestart,
    exitGame,
  };
}

