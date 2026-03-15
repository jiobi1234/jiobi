import { useState, useEffect, useRef, useCallback } from 'react';

/** 도형 개수 (0~15). 매 렌더마다 새 배열을 만들면 effect가 무한 반복되므로 모듈 상수로 고정 */
const SHAPES = Array.from({ length: 16 }, (_, i) => i);

export interface GridCell {
  id: number;
  shape: number | null;
}

interface UseLocationMemoryGameReturn {
  // 상태
  totalScore: number;
  memoryTime: number;
  remainingTime: number;
  showMemoryTime: boolean;
  showGameOver: boolean;
  gameOverMessage: string;
  currentShapes: Array<{ shape: number; position: number }>;
  topGridCells: GridCell[];
  bottomGridCells: GridCell[];
  
  // 핸들러
  handleDragStart: (e: React.DragEvent, shape: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, cellId: number) => void;
  handleRestart: () => void;
  exitGame: () => void;
}

/**
 * 위치 기억 게임 로직을 관리하는 커스텀 훅
 */
export function useLocationMemoryGame(onExit: () => void): UseLocationMemoryGameReturn {
  const [totalScore, setTotalScore] = useState(0);
  const [memoryTime, setMemoryTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showMemoryTime, setShowMemoryTime] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [currentShapes, setCurrentShapes] = useState<Array<{ shape: number; position: number }>>([]);
  const [topGridCells, setTopGridCells] = useState<GridCell[]>(
    Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null }))
  );
  const [bottomGridCells, setBottomGridCells] = useState<GridCell[]>(
    Array.from({ length: 16 }, (_, i) => ({ id: i, shape: i }))
  );

  const currentStepRef = useRef(1);
  const correctPlacementsRef = useRef(0);
  const memoryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearShapesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggedItemRef = useRef<{ shape: number; element: HTMLElement } | null>(null);

  const clearIntervals = useCallback(() => {
    if (clearShapesTimeoutRef.current) {
      clearTimeout(clearShapesTimeoutRef.current);
      clearShapesTimeoutRef.current = null;
    }
    if (memoryIntervalRef.current) {
      clearInterval(memoryIntervalRef.current);
      memoryIntervalRef.current = null;
    }
    if (remainingIntervalRef.current) {
      clearInterval(remainingIntervalRef.current);
      remainingIntervalRef.current = null;
    }
  }, []);

  const gameOver = useCallback((reason?: string) => {
    clearIntervals();
    setGameOverMessage(reason === 'timeout' ? '시간이 초과되었습니다.' : '올바른 위치가 아닙니다.');
    setShowGameOver(true);
  }, [clearIntervals]);

  const startDragAndDrop = useCallback((initialRemainingTime: number) => {
    clearIntervals();
    setShowMemoryTime(false);
    // 기억 시간 종료 시 위 그리드 도형 제거 (clearIntervals가 clearShapesTimeout을 지우므로 여기서 직접 비움)
    setTopGridCells(Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null })));
    let time = initialRemainingTime;
    remainingIntervalRef.current = setInterval(() => {
      time--;
      setRemainingTime(time);
      if (time <= 0) {
        if (remainingIntervalRef.current) clearInterval(remainingIntervalRef.current);
        remainingIntervalRef.current = null;
        gameOver('timeout');
      }
    }, 1000);
  }, [clearIntervals, gameOver]);

  const countdownMemoryTime = useCallback((initialTime: number) => {
    clearIntervals();
    let time = initialTime;
    memoryIntervalRef.current = setInterval(() => {
      time--;
      setMemoryTime(time);
      if (time <= 0) {
        if (memoryIntervalRef.current) clearInterval(memoryIntervalRef.current);
        memoryIntervalRef.current = null;
        startDragAndDrop(initialTime);
      }
    }, 1000);
  }, [clearIntervals, startDragAndDrop]);


  const displayShapes = useCallback((memoryTimeValue: number) => {
    if (clearShapesTimeoutRef.current) {
      clearTimeout(clearShapesTimeoutRef.current);
      clearShapesTimeoutRef.current = null;
    }
    const positions: number[] = [];
    const usedShapes: number[] = [];
    const newCurrentShapes: Array<{ shape: number; position: number }> = [];
    const initialTopGridCells = Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null }));
    const newTopGridCells = [...initialTopGridCells];
    
    const shapeCount = Math.ceil(currentStepRef.current / 3);
    
    for (let i = 0; i < shapeCount; i++) {
      let randomPosition: number;
      let randomShape: number;
      
      do {
        randomPosition = Math.floor(Math.random() * 16);
      } while (positions.includes(randomPosition));
      positions.push(randomPosition);
      
      do {
        randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      } while (usedShapes.includes(randomShape));
      usedShapes.push(randomShape);
      
      newCurrentShapes.push({ shape: randomShape, position: randomPosition });
      newTopGridCells[randomPosition] = { ...newTopGridCells[randomPosition], shape: randomShape };
    }
    
    setCurrentShapes(newCurrentShapes);
    setTopGridCells(newTopGridCells);
    
    const memoryTimeMs = memoryTimeValue * 1000;
    clearShapesTimeoutRef.current = setTimeout(() => {
      clearShapesTimeoutRef.current = null;
      const clearedTopGrid = newTopGridCells.map(cell => ({ ...cell, shape: null }));
      setTopGridCells(clearedTopGrid);
    }, memoryTimeMs);
  }, []);

  const resetGame = useCallback(() => {
    clearIntervals();
    correctPlacementsRef.current = 0;
    setShowGameOver(false);
    setGameOverMessage('');
    
    const shapeCount = Math.floor((currentStepRef.current + 2) / 3);
    const newMemoryTime = shapeCount * 3;
    const newRemainingTime = shapeCount * 3;
    
    setMemoryTime(newMemoryTime);
    setRemainingTime(newRemainingTime);
    setShowMemoryTime(true);
    
    setTopGridCells(Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null })));
    setBottomGridCells(Array.from({ length: 16 }, (_, i) => ({ id: i, shape: i })));
    
    countdownMemoryTime(newMemoryTime);
    displayShapes(newMemoryTime);
  }, [clearIntervals, countdownMemoryTime, displayShapes]);

  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const nextStep = useCallback(() => {
    currentStepRef.current++;
    if (currentStepRef.current <= 16) {
      clearIntervals();
      resetGame();
    } else {
      gameOver();
    }
  }, [clearIntervals, resetGame, gameOver]);

  const showCorrectMessage = useCallback(() => {
    clearIntervals();
    setTimeout(() => {
      nextStep();
    }, 1000);
  }, [clearIntervals, nextStep]);

  /** 맞으면 true, 틀리면 false (틀리면 gameOver 호출) */
  const checkPlacement = useCallback((targetPosition: number, droppedShape: number): boolean => {
    const correctShapeObj = currentShapes.find(s => s.position === targetPosition);
    
    if (correctShapeObj && correctShapeObj.shape === droppedShape) {
      correctPlacementsRef.current++;
      setTotalScore(prev => prev + 1);
      
      if (correctPlacementsRef.current === currentShapes.length) {
        showCorrectMessage();
      }
      return true;
    } else {
      gameOver();
      return false;
    }
  }, [currentShapes, gameOver, showCorrectMessage]);

  const handleDragStart = useCallback((e: React.DragEvent, shape: number) => {
    const el = e.currentTarget as HTMLElement;
    draggedItemRef.current = { shape, element: el };
    e.dataTransfer.setData('text/plain', `shape-${shape}`);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (el) el.style.display = 'none';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const ref = draggedItemRef.current;
    setTimeout(() => {
      if (ref?.element) {
        ref.element.style.display = '';
        draggedItemRef.current = null;
      }
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, cellId: number) => {
    e.preventDefault();
    const droppedItemId = e.dataTransfer.getData('text/plain');
    if (!droppedItemId) return;
    const shape = parseInt(droppedItemId.split('-')[1], 10);
    const isCorrect = checkPlacement(cellId, shape);
    if (!isCorrect) return; // 틀리면 그리드 갱신 없이 게임 오버만 표시
    const newTopGridCells = [...topGridCells];
    newTopGridCells[cellId] = { ...newTopGridCells[cellId], shape };
    setTopGridCells(newTopGridCells);
    const newBottomGridCells = [...bottomGridCells];
    const cellIndex = newBottomGridCells.findIndex(cell => cell.shape === shape);
    if (cellIndex !== -1) {
      newBottomGridCells[cellIndex] = { ...newBottomGridCells[cellIndex], shape: null };
      setBottomGridCells(newBottomGridCells);
    }
  }, [topGridCells, bottomGridCells, checkPlacement]);

  const handleRestart = useCallback(() => {
    setTotalScore(0);
    currentStepRef.current = 1;
    correctPlacementsRef.current = 0;
    clearIntervals();
    setTopGridCells(Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null })));
    setBottomGridCells(Array.from({ length: 16 }, (_, i) => ({ id: i, shape: i })));
    startGame();
  }, [clearIntervals, startGame]);

  const exitGame = useCallback(() => {
    clearIntervals();
    onExit();
  }, [clearIntervals, onExit]);

  // 초기화
  useEffect(() => {
    startGame();
    return () => {
      clearIntervals();
    };
  }, [startGame, clearIntervals]);

  return {
    totalScore,
    memoryTime,
    remainingTime,
    showMemoryTime,
    showGameOver,
    gameOverMessage,
    currentShapes,
    topGridCells,
    bottomGridCells,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleRestart,
    exitGame,
  };
}

