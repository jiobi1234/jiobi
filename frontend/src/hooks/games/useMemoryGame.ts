import { useState, useEffect, useRef, useCallback } from 'react';

export type GamePhase = 'start' | 'memorization' | 'input' | 'result';

export interface GameResult {
  userInput: string;
  correctWord: string;
  isCorrect: boolean;
}

interface UseMemoryGameReturn {
  // 상태
  allWords: string[];
  currentStage: number;
  currentWords: string[];
  phase: GamePhase;
  timeLeft: number;
  userInputs: string[];
  results: GameResult[];
  
  // Refs
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  
  // 핸들러
  startGame: () => void;
  handleInputChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  checkAnswers: () => void;
  nextStage: () => void;
  resetGame: () => void;
}

/**
 * 기억력 게임 로직을 관리하는 커스텀 훅
 */
export function useMemoryGame(): UseMemoryGameReturn {
  const [allWords, setAllWords] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>('start');
  const [timeLeft, setTimeLeft] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);

  const memorizationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchWords = useCallback(async () => {
    try {
      const response = await fetch('/txt/nouns.txt');
      const text = await response.text();
      const words = text.split('\n').filter(word => word.trim()).map(word => word.trim());
      setAllWords(words);
    } catch (error) {
      console.error('Failed to fetch words:', error);
      // Fallback words
      setAllWords(['사과', '바나나', '오렌지', '포도', '키위', '딸기', '레몬', '망고', '파인애플', '체리', '수박', '참외', '복숭아', '자두', '배', '감', '귤', '한라봉', '유자', '석류']);
    }
  }, []);

  const getRandomWords = useCallback((count: number): string[] => {
    const shuffled = [...allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }, [allWords]);

  const showInputPhase = useCallback(() => {
    setPhase('input');
    setTimeLeft(0);
    setUserInputs(new Array(currentWords.length).fill(''));
    
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  }, [currentWords.length]);

  const startMemorizationTimer = useCallback((wordCount: number) => {
    const timePerWord = 3;
    const totalTime = wordCount * timePerWord;
    let countdown = totalTime;
    setTimeLeft(countdown);

    if (memorizationTimerRef.current) clearInterval(memorizationTimerRef.current);
    
    memorizationTimerRef.current = setInterval(() => {
      countdown--;
      setTimeLeft(countdown);
      if (countdown <= 0) {
        if (memorizationTimerRef.current) clearInterval(memorizationTimerRef.current);
        showInputPhase();
      }
    }, 1000);
  }, [showInputPhase]);

  const startStage = useCallback((wordCount: number) => {
    const selectedWords = getRandomWords(wordCount);
    setCurrentWords(selectedWords);
    setPhase('memorization');
    setUserInputs([]);
    startMemorizationTimer(selectedWords.length);
  }, [getRandomWords, startMemorizationTimer]);

  const startGame = useCallback(() => {
    setCurrentStage(1);
    startStage(3);
  }, [startStage]);

  const gameComplete = useCallback(() => {
    setPhase('result');
  }, []);

  const nextStage = useCallback(() => {
    const nextWordCount = 3 + currentStage;
    if (nextWordCount <= allWords.length) {
      setCurrentStage(prev => prev + 1);
      startStage(nextWordCount);
    } else {
      gameComplete();
    }
  }, [currentStage, allWords.length, startStage, gameComplete]);

  const checkAnswers = useCallback(() => {
    const newResults = currentWords.map((correctWord, index) => {
      const userInput = userInputs[index]?.trim() || '';
      const isCorrect = userInput.toLowerCase() === correctWord.toLowerCase();
      return { userInput, correctWord, isCorrect };
    });

    setResults(newResults);
    
    const allCorrect = newResults.every(r => r.isCorrect);
    if (allCorrect) {
      nextStage();
    } else {
      setPhase('result');
    }
  }, [currentWords, userInputs, nextStage]);

  const handleInputChange = useCallback((index: number, value: string) => {
    const newInputs = [...userInputs];
    newInputs[index] = value;
    setUserInputs(newInputs);
  }, [userInputs]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkAnswers();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (index < currentWords.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        checkAnswers();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  }, [currentWords.length, checkAnswers]);

  const resetGame = useCallback(() => {
    setCurrentStage(1);
    setCurrentWords([]);
    setPhase('start');
    setTimeLeft(0);
    setUserInputs([]);
    setResults([]);
    if (memorizationTimerRef.current) clearInterval(memorizationTimerRef.current);
  }, []);

  // 초기화
  useEffect(() => {
    fetchWords();
    return () => {
      if (memorizationTimerRef.current) clearInterval(memorizationTimerRef.current);
    };
  }, [fetchWords]);

  return {
    allWords,
    currentStage,
    currentWords,
    phase,
    timeLeft,
    userInputs,
    results,
    inputRefs,
    startGame,
    handleInputChange,
    handleKeyDown,
    checkAnswers,
    nextStage,
    resetGame,
  };
}

