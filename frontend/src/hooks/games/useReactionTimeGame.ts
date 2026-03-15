import { useState, useEffect, useRef, useCallback } from 'react';

export interface GameObject {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  shape: 'circle' | 'triangle' | 'square';
  points: number;
}

interface UseReactionTimeGameReturn {
  // 상태
  score: number;
  stage: number;
  timeLeft: number;
  currentStageScore: number;
  showGameOver: boolean;
  countdown: number;
  isGameStarted: boolean;
  
  // Refs
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  // 핸들러
  handleCanvasPointerDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleRestart: () => void;
  handleExit: () => void;
}

/**
 * 반응속도 게임 로직을 관리하는 커스텀 훅
 */
export function useReactionTimeGame(onExit: () => void): UseReactionTimeGameReturn {
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [timeLeft, setTimeLeft] = useState(31);
  const [currentStageScore, setCurrentStageScore] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef<GameObject[]>([]);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  const fixedSpeedRef = useRef(2);
  const upfixedSpeed = 1.25;
  const uptriangleSpeed = 1.5;
  const upsquareSpeed = 2.0;
  const circleSpeedRef = useRef(2);
  const triangleSpeedRef = useRef(2 * uptriangleSpeed);
  const squareSpeedRef = useRef(2 * upsquareSpeed);
  const radiusRef = useRef(40);
  const triangleProbabilityRef = useRef(0);
  const squareProbabilityRef = useRef(0);
  const canvasLogicalWidthRef = useRef(window.innerWidth);
  const canvasLogicalHeightRef = useRef(window.innerHeight);
  const currentStageScoreRef = useRef(0);

  useEffect(() => {
    currentStageScoreRef.current = currentStageScore;
  }, [currentStageScore]);

  // 유틸리티 함수들
  const random = useCallback((min: number, max: number) => {
    return Math.random() * (max - min) + min;
  }, []);

  const sign = useCallback((x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  }, []);

  const isInsideTriangle = useCallback((obj: GameObject, mouseX: number, mouseY: number) => {
    const b1 = sign(mouseX, mouseY, obj.x, obj.y - obj.radius, obj.x - obj.radius, obj.y + obj.radius) < 0.0;
    const b2 = sign(mouseX, mouseY, obj.x - obj.radius, obj.y + obj.radius, obj.x + obj.radius, obj.y + obj.radius) < 0.0;
    const b3 = sign(mouseX, mouseY, obj.x + obj.radius, obj.y + obj.radius, obj.x, obj.y - obj.radius) < 0.0;
    return ((b1 === b2) && (b2 === b3));
  }, [sign]);

  const isInsideSquare = useCallback((obj: GameObject, mouseX: number, mouseY: number) => {
    return mouseX >= obj.x - obj.radius && mouseX <= obj.x + obj.radius &&
           mouseY >= obj.y - obj.radius && mouseY <= obj.y + obj.radius;
  }, []);

  const drawObject = useCallback((ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.beginPath();
    if (obj.shape === 'circle') {
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2, false);
    } else if (obj.shape === 'triangle') {
      ctx.moveTo(obj.x, obj.y - obj.radius);
      ctx.lineTo(obj.x - obj.radius, obj.y + obj.radius);
      ctx.lineTo(obj.x + obj.radius, obj.y + obj.radius);
      ctx.closePath();
    } else {
      ctx.rect(obj.x - obj.radius, obj.y - obj.radius, obj.radius * 2, obj.radius * 2);
    }
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.closePath();
  }, []);

  const createObject = useCallback(() => {
    if (!canvasRef.current) return;

    const w = canvasLogicalWidthRef.current;
    const h = canvasLogicalHeightRef.current;
    const shapeType = Math.random();
    let shape: 'circle' | 'triangle' | 'square';

    if (shapeType < squareProbabilityRef.current) {
      shape = 'square';
    } else if (shapeType < triangleProbabilityRef.current + squareProbabilityRef.current) {
      shape = 'triangle';
    } else {
      shape = 'circle';
    }

    const x = random(radiusRef.current, w - radiusRef.current);
    const y = random(radiusRef.current, h - radiusRef.current);
    const speed = shape === 'triangle' ? triangleSpeedRef.current : shape === 'square' ? squareSpeedRef.current : circleSpeedRef.current;
    const dx = random(-2, 2) * speed;
    const dy = random(-2, 2) * speed;
    const color = shape === 'circle' ? 'red' : shape === 'triangle' ? 'blue' : 'green';
    const points = shape === 'circle' ? 1 : shape === 'triangle' ? 3 : 4;

    objectsRef.current.push({ x, y, dx, dy, radius: radiusRef.current, color, shape, points });
  }, [random]);

  const updateObjects = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasLogicalWidthRef.current;
    const h = canvasLogicalHeightRef.current;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < objectsRef.current.length; i++) {
      const obj1 = objectsRef.current[i];
      obj1.x += obj1.dx;
      obj1.y += obj1.dy;

      if (obj1.x + obj1.radius > w || obj1.x - obj1.radius < 0) {
        obj1.dx = -obj1.dx;
      }
      if (obj1.y + obj1.radius > h || obj1.y - obj1.radius < 0) {
        obj1.dy = -obj1.dy;
      }

      for (let j = i + 1; j < objectsRef.current.length; j++) {
        const obj2 = objectsRef.current[j];
        let dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
        if (dist < obj1.radius + obj2.radius) {
          let angle = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
          let totalVelocity = Math.sqrt(obj1.dx * obj1.dx + obj1.dy * obj1.dy) + Math.sqrt(obj2.dx * obj2.dx + obj2.dy * obj2.dy);
          let velocity1 = totalVelocity * 0.5;
          let velocity2 = totalVelocity * 0.5;
          obj1.dx = velocity1 * Math.cos(angle + Math.PI);
          obj1.dy = velocity1 * Math.sin(angle + Math.PI);
          obj2.dx = velocity2 * Math.cos(angle);
          obj2.dy = velocity2 * Math.sin(angle);
        }
      }

      drawObject(ctx, obj1);
    }
  }, [drawObject]);

  const updateGameState = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        handleGameOver();
        return 0;
      }

      const afterDecrement = prev - 1;

      // 남은 시간이 15, 30, 45… 초가 될 때 = 단계가 올라가는 시점
      const isStageBoundary = afterDecrement % 15 === 0 && afterDecrement > 0;

      if (isStageBoundary) {
        // 단계가 증가할 때마다: 단계 점수를 남은 시간에 더하고, 단계 점수 0으로 초기화
        const stageBonus = currentStageScoreRef.current;
        currentStageScoreRef.current = 0;
        setCurrentStageScore(0);

        setStage(stagePrev => {
          const nextStage = stagePrev + 1;
          if (nextStage % 2 === 0) {
            fixedSpeedRef.current *= upfixedSpeed;
            circleSpeedRef.current = fixedSpeedRef.current;
            triangleSpeedRef.current = fixedSpeedRef.current * uptriangleSpeed;
            squareSpeedRef.current = fixedSpeedRef.current * upsquareSpeed;
          } else {
            if (nextStage >= 3) triangleProbabilityRef.current = 0.2;
            if (nextStage >= 5) squareProbabilityRef.current = 0.2;
            if (nextStage % 5 === 0 && radiusRef.current > 16) {
              radiusRef.current = Math.max(40 * 0.6, radiusRef.current * 0.95);
            }
          }
          return nextStage;
        });

        // 남은 시간 = 이번 구간까지 감소한 값 + 단계 점수 보너스
        return afterDecrement + stageBonus;
      }

      return afterDecrement;
    });
  }, []);

  const cleanup = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    if (stateIntervalRef.current) {
      clearInterval(stateIntervalRef.current);
      stateIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const initBGM = useCallback(() => {
    bgmAudioRef.current = new Audio('/audio/games/reactiontime_BGM.mp3');
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

  const handleGameOver = useCallback(() => {
    cleanup();
    stopBGM();
    setShowGameOver(true);
  }, [cleanup, stopBGM]);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const parent = canvas.parentElement;
    const logicalW = parent ? parent.clientWidth : window.innerWidth;
    const logicalH = parent ? parent.clientHeight : window.innerHeight;
    if (logicalW <= 0 || logicalH <= 0) return;
    canvasLogicalWidthRef.current = logicalW;
    canvasLogicalHeightRef.current = logicalH;
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }, []);

  const startGame = useCallback(() => {
    if (!canvasRef.current) return;
    cleanup();
    currentStageScoreRef.current = 0;

    const canvas = canvasRef.current;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setIsGameStarted(true);
    setScore(0);
    setStage(1);
    setTimeLeft(31);
    setCurrentStageScore(0);
    setShowGameOver(false);
    objectsRef.current = [];

    fixedSpeedRef.current = 2;
    circleSpeedRef.current = 2;
    triangleSpeedRef.current = 2 * uptriangleSpeed;
    squareSpeedRef.current = 2 * upsquareSpeed;
    radiusRef.current = 40;
    triangleProbabilityRef.current = 0;
    squareProbabilityRef.current = 0;

    playBGM();

    gameIntervalRef.current = setInterval(() => {
      createObject();
    }, 1500);

    stateIntervalRef.current = setInterval(() => {
      updateGameState();
    }, 1000);
  }, [createObject, updateGameState, playBGM, resizeCanvas, cleanup]);

  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      if (count > 0) {
        setCountdown(count);
        count--;
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
        startGame();
      }
    }, 1000);
  }, [startGame]);

  const handleObjectHit = useCallback((mouseX: number, mouseY: number) => {
    const arr = objectsRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const obj = arr[i];
      const dist = Math.hypot(mouseX - obj.x, mouseY - obj.y);
      if ((obj.shape === 'circle' && dist < obj.radius) ||
          (obj.shape === 'triangle' && isInsideTriangle(obj, mouseX, mouseY)) ||
          (obj.shape === 'square' && isInsideSquare(obj, mouseX, mouseY))) {
        arr.splice(i, 1);
        const pts = obj.points;
        currentStageScoreRef.current += pts;
        setScore(prev => prev + pts);
        setCurrentStageScore(prev => prev + pts);
        break;
      }
    }
  }, [isInsideTriangle, isInsideSquare]);

  const handleCanvasPointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const w = canvasLogicalWidthRef.current;
    const h = canvasLogicalHeightRef.current;
    const scaleX = rect.width > 0 ? w / rect.width : 1;
    const scaleY = rect.height > 0 ? h / rect.height : 1;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    handleObjectHit(mouseX, mouseY);
  }, [handleObjectHit]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const w = canvasLogicalWidthRef.current;
      const h = canvasLogicalHeightRef.current;
      const scaleX = rect.width > 0 ? w / rect.width : 1;
      const scaleY = rect.height > 0 ? h / rect.height : 1;
      const mouseX = (touch.clientX - rect.left) * scaleX;
      const mouseY = (touch.clientY - rect.top) * scaleY;
      handleObjectHit(mouseX, mouseY);
    }
  }, [handleObjectHit]);

  const handleRestart = useCallback(() => {
    cleanup();
    setShowGameOver(false);
    setIsGameStarted(false);
    startCountdown();
  }, [cleanup, startCountdown]);

  const handleExit = useCallback(() => {
    cleanup();
    stopBGM();
    onExit();
  }, [cleanup, stopBGM, onExit]);

  // 초기화 (마운트 시 한 번만 실행, 클릭 시 재실행되지 않도록 deps 비움)
  useEffect(() => {
    initBGM();
    startCountdown();
    return () => {
      cleanup();
      stopBGM();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 의도적으로 마운트 시 1회만 실행
  }, []);

  // 게임 오버 시 BGM 정지
  useEffect(() => {
    if (showGameOver) {
      stopBGM();
    }
  }, [showGameOver, stopBGM]);

  // 애니메이션 루프
  useEffect(() => {
    if (isGameStarted && canvasRef.current) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const loop = () => {
        if (isGameStarted && canvasRef.current) {
          updateObjects();
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };
      animationFrameRef.current = requestAnimationFrame(loop);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isGameStarted, updateObjects, resizeCanvas]);

  return {
    score,
    stage,
    timeLeft,
    currentStageScore,
    showGameOver,
    countdown,
    isGameStarted,
    canvasRef,
    handleCanvasPointerDown,
    handleTouchStart,
    handleRestart,
    handleExit,
  };
}

