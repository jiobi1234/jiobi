import { useState, useEffect, useRef, useCallback } from 'react';

export interface Block {
  id: number;
  left: number;
  top: number;
  isFalling: boolean;
}

interface UseStackDropGameReturn {
  // 상태
  timeLeft: number;
  score: number;
  highScore: number;
  showMessageBox: boolean;
  stackedBlocks: Block[];
  fallingBlock: Block | null;
  movingRight: boolean;
  
  // Refs
  gameAreaRef: React.RefObject<HTMLDivElement>;
  
  // 핸들러
  dropRectangle: () => void;
  handleRestart: () => void;
  handleExit: () => void;
}

/**
 * 블록 쌓기 게임 로직을 관리하는 커스텀 훅
 */
export function useStackDropGame(onExit: () => void): UseStackDropGameReturn {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [stackedBlocks, setStackedBlocks] = useState<Block[]>([]);
  const [fallingBlock, setFallingBlock] = useState<Block | null>(null);
  const [movingRight, setMovingRight] = useState(true);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const blockIdCounterRef = useRef(0);

  const blockWidth = 80;
  const blockHeight = 30;
  const moveSpeed = 5;
  const maxStackedBlocks = 3;

  const initBGM = useCallback(() => {
    bgmAudioRef.current = new Audio('/audio/games/stackdrop_BGM.mp3');
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = 0.3;
      bgmAudioRef.current.loop = true;
      bgmAudioRef.current.preload = 'auto';
    }
  }, []);

  const playBGM = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.play().catch(() => {});
    }
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.currentTime = 0;
    }
  }, []);

  const loadHighScore = useCallback(() => {
    const saved = localStorage.getItem('stackdropHighScore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const moveRectangle = useCallback(() => {
    if (!fallingBlock || !gameAreaRef.current) return;
    
    const gameAreaWidth = gameAreaRef.current.offsetWidth;
    const maxLeft = 0;
    const maxRight = gameAreaWidth - blockWidth;
    
    setFallingBlock(prev => {
      if (!prev) return null;
      
      let newLeft = prev.left;
      if (movingRight) {
        if (newLeft < maxRight) {
          newLeft += moveSpeed;
        } else {
          setMovingRight(false);
        }
      } else {
        if (newLeft > maxLeft) {
          newLeft -= moveSpeed;
        } else {
          setMovingRight(true);
        }
      }
      
      return { ...prev, left: newLeft };
    });
  }, [fallingBlock, movingRight]);

  const calculateScore = useCallback((currentLeft: number, lastBlockLeft: number) => {
    const difference = Math.abs(currentLeft - lastBlockLeft);
    const overlapPercentage = ((blockWidth - difference) / blockWidth) * 100;
    const bonusScore = Math.max(0, Math.min(10, Math.floor((overlapPercentage - 50) / 5) + 1));
    setScore(prev => prev + 10 + bonusScore);
  }, []);

  const checkFailCondition = useCallback((currentLeft: number, lastBlockLeft: number, gameAreaHeight: number) => {
    const difference = Math.abs(currentLeft - lastBlockLeft);
    const currentRight = currentLeft + blockWidth;
    const lastBlockRight = lastBlockLeft + blockWidth;

    if (currentRight < lastBlockLeft || currentLeft > lastBlockRight) {
      // 전혀 겹치지 않음
      setTimeout(() => {
        endGame();
      }, 1000);
    } else if (difference > blockWidth / 2) {
      // 절반 이상 벗어남
      setTimeout(() => {
        endGame();
      }, 500);
    }
  }, []);

  const endGame = useCallback(() => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    stopBGM();
    setFallingBlock(null);
    setShowMessageBox(true);
    
    if (score > highScore) {
      const newHighScore = score;
      setHighScore(newHighScore);
      localStorage.setItem('stackdropHighScore', newHighScore.toString());
    }
  }, [stopBGM, score, highScore]);

  const dropRectangle = useCallback(() => {
    if (!fallingBlock || !gameAreaRef.current) return;
    
    const gameAreaHeight = gameAreaRef.current.offsetHeight;
    const currentLeft = fallingBlock.left;
    
    if (stackedBlocks.length > 0) {
      const lastBlock = stackedBlocks[stackedBlocks.length - 1];
      const lastBlockLeft = lastBlock.left;
      
      checkFailCondition(currentLeft, lastBlockLeft, gameAreaHeight);
      calculateScore(currentLeft, lastBlockLeft);
    } else {
      setScore(prev => prev + 10);
    }

    const stackedCount = stackedBlocks.length;
    const topOffset = gameAreaHeight * 0.003;
    const newTop = gameAreaHeight - (stackedCount + 1) * blockHeight - topOffset;

    const newStackedBlock: Block = {
      ...fallingBlock,
      top: newTop,
      isFalling: false
    };

    let newStackedBlocks = [...stackedBlocks, newStackedBlock];
    
    if (newStackedBlocks.length > maxStackedBlocks) {
      newStackedBlocks = newStackedBlocks.slice(1);
      newStackedBlocks = newStackedBlocks.map(block => ({
        ...block,
        top: block.top + blockHeight
      }));
    }

    setStackedBlocks(newStackedBlocks);
    
    // 새 블록 생성
    const gameAreaWidth = gameAreaRef.current.offsetWidth;
    const newFallingBlock: Block = {
      id: blockIdCounterRef.current++,
      left: currentLeft,
      top: 0,
      isFalling: true
    };
    setFallingBlock(newFallingBlock);
  }, [fallingBlock, stackedBlocks, checkFailCondition, calculateScore]);

  const startGame = useCallback(() => {
    if (!gameAreaRef.current) return;
    
    const gameAreaWidth = gameAreaRef.current.offsetWidth;
    const initialLeft = gameAreaWidth / 2 - blockWidth / 2;
    
    const newFallingBlock: Block = {
      id: blockIdCounterRef.current++,
      left: initialLeft,
      top: 0,
      isFalling: true
    };
    
    setFallingBlock(newFallingBlock);
    setStackedBlocks([]);
    setScore(0);
    setTimeLeft(60);
    setShowMessageBox(false);
    setMovingRight(true);

    // 블록 이동 시작
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    intervalIdRef.current = setInterval(() => {
      moveRectangle();
    }, 50);

    // 타이머 시작
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    timerIdRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    playBGM();
  }, [moveRectangle, endGame, playBGM]);

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleExit = useCallback(() => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    stopBGM();
    onExit();
  }, [stopBGM, onExit]);

  // 초기화
  useEffect(() => {
    initBGM();
    loadHighScore();
    startGame();
    
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, [initBGM, loadHighScore, startGame]);

  return {
    timeLeft,
    score,
    highScore,
    showMessageBox,
    stackedBlocks,
    fallingBlock,
    movingRight,
    gameAreaRef,
    dropRectangle,
    handleRestart,
    handleExit,
  };
}

