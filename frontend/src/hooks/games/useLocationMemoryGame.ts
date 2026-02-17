import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [currentShapes, setCurrentShapes] = useState<Array<{ shape: number; position: number }>>([]);
  const [topGridCells, setTopGridCells] = useState<GridCell[]>(
    Array.from({ length: 16 }, (_, i) => ({ id: i, shape: null }))
  );
  const [bottomGridCells, setBottomGridCells] = useState<GridCell[]>(
    Array.from({ length: 16 }, (_, i) => ({ id: i, shape: i }))
  );

  const currentStepRef = useRef(1);
  const correctPlacementsRef = useRef(0);
  const memoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const draggedItemRef = useRef<{ shape: number; element: HTMLElement } | null>(null);

  const shapes = Array.from({ length: 16 }, (_, i) => i);

  const clearIntervals = useCallback(() => {
    if (memoryIntervalRef.current) clearInterval(memoryIntervalRef.current);
    if (remainingIntervalRef.current) clearInterval(remainingIntervalRef.current);
  }, []);

  const countdownMemoryTime = useCallback((initialTime: number) => {
    let time = initialTime;
    memoryIntervalRef.current = setInterval(() => {
      time--;
      setMemoryTime(time);
      if (time <= 0) {
        clearInterval(memoryIntervalRef.current!);
        startDragAndDrop(initialTime);
      }
    }, 1000);
  }, []);

  const startDragAndDrop = useCallback((initialRemainingTime: number) => {
    clearIntervals();
    setShowMemoryTime(false);
    let time = initialRemainingTime;
    
    remainingIntervalRef.current = setInterval(() => {
      time--;
      setRemainingTime(time);
      if (time <= 0) {
        clearInterval(remainingIntervalRef.current!);
        gameOver('timeout');
      }
    }, 1000);
  }, [clearIntervals]);

  const displayShapes = useCallback((memoryTimeValue: number) => {
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
        randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      } while (usedShapes.includes(randomShape));
      usedShapes.push(randomShape);
      
      newCurrentShapes.push({ shape: randomShape, position: randomPosition });
      newTopGridCells[randomPosition] = { ...newTopGridCells[randomPosition], shape: randomShape };
    }
    
    setCurrentShapes(newCurrentShapes);
    setTopGridCells(newTopGridCells);
    
    const memoryTimeMs = memoryTimeValue * 1000;
    setTimeout(() => {
      const clearedTopGrid = newTopGridCells.map(cell => ({ ...cell, shape: null }));
      setTopGridCells(clearedTopGrid);
    }, memoryTimeMs);
  }, [shapes]);

  const resetGame = useCallback(() => {
    clearIntervals();
    correctPlacementsRef.current = 0;
    setShowGameOver(false);
    
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
    // displayShapes는 resetGame 내부에서 호출됨
  }, [resetGame]);

  const checkPlacement = useCallback((targetPosition: number, droppedShape: number) => {
    const correctShapeObj = currentShapes.find(s => s.position === targetPosition);
    
    if (correctShapeObj && correctShapeObj.shape === droppedShape) {
      correctPlacementsRef.current++;
      setTotalScore(prev => prev + 1);
      
      if (correctPlacementsRef.current === currentShapes.length) {
        showCorrectMessage();
      }
    } else {
      gameOver();
    }
  }, [currentShapes]);

  const showCorrectMessage = useCallback(() => {
    clearIntervals();
    setTimeout(() => {
      nextStep();
    }, 1000);
  }, [clearIntervals]);

  const nextStep = useCallback(() => {
    currentStepRef.current++;
    if (currentStepRef.current <= 16) {
      clearIntervals();
      resetGame();
      // displayShapes는 resetGame 내부에서 호출됨
    } else {
      gameOver();
    }
  }, [clearIntervals, resetGame]);

  const gameOver = useCallback((reason?: string) => {
    clearIntervals();
    setShowGameOver(true);
    
    if (reason === 'timeout') {
      setTimeout(() => {
        // timeout message already shown
      }, 1000);
    }
  }, [clearIntervals]);

  const handleDragStart = useCallback((e: React.DragEvent, shape: number) => {
    draggedItemRef.current = { shape, element: e.currentTarget as HTMLElement };
    e.dataTransfer.setData('text/plain', `shape-${shape}`);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      (e.currentTarget as HTMLElement).style.display = 'none';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setTimeout(() => {
      if (draggedItemRef.current) {
        draggedItemRef.current.element.style.display = 'block';
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
    if (droppedItemId) {
      const shape = parseInt(droppedItemId.split('-')[1]);
      checkPlacement(cellId, shape);
      
      const newTopGridCells = [...topGridCells];
      newTopGridCells[cellId] = { ...newTopGridCells[cellId], shape };
      setTopGridCells(newTopGridCells);
      
      const newBottomGridCells = [...bottomGridCells];
      const cellIndex = newBottomGridCells.findIndex(cell => cell.shape === shape);
      if (cellIndex !== -1) {
        newBottomGridCells[cellIndex] = { ...newBottomGridCells[cellIndex], shape: null };
        setBottomGridCells(newBottomGridCells);
      }
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

