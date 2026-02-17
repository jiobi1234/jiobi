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
  handleCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
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
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentStageScore, setCurrentStageScore] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef<GameObject[]>([]);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    
    const canvas = canvasRef.current;
    const shapeType = Math.random();
    let shape: 'circle' | 'triangle' | 'square';
    
    if (shapeType < squareProbabilityRef.current) {
      shape = 'square';
    } else if (shapeType < triangleProbabilityRef.current + squareProbabilityRef.current) {
      shape = 'triangle';
    } else {
      shape = 'circle';
    }

    const x = random(radiusRef.current, canvas.width - radiusRef.current);
    const y = random(radiusRef.current, canvas.height - radiusRef.current);
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < objectsRef.current.length; i++) {
      let obj1 = objectsRef.current[i];
      obj1.x += obj1.dx;
      obj1.y += obj1.dy;

      if (obj1.x + obj1.radius > canvas.width || obj1.x - obj1.radius < 0) {
        obj1.dx = -obj1.dx;
      }
      if (obj1.y + obj1.radius > canvas.height || obj1.y - obj1.radius < 0) {
        obj1.dy = -obj1.dy;
      }

      for (let j = i + 1; j < objectsRef.current.length; j++) {
        let obj2 = objectsRef.current[j];
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
      
      const newTime = prev - 1;
      
      // 15초 단위로 스테이지 업데이트
      if (newTime % 15 === 0 && newTime !== 15 && newTime > 0) {
        setStage(stagePrev => {
          const newStage = stagePrev + 1;
          
          if (newStage % 2 === 0) {
            fixedSpeedRef.current *= upfixedSpeed;
            circleSpeedRef.current = fixedSpeedRef.current;
            triangleSpeedRef.current = fixedSpeedRef.current * uptriangleSpeed;
            squareSpeedRef.current = fixedSpeedRef.current * upsquareSpeed;
          } else {
            if (newStage >= 3) {
              triangleProbabilityRef.current = 0.2;
            }
            if (newStage >= 5) {
              squareProbabilityRef.current = 0.2;
            }
            if (newStage % 5 === 0 && radiusRef.current > 16) {
              radiusRef.current *= 0.95;
              if (radiusRef.current < 40 * 0.6) {
                radiusRef.current = 40 * 0.6;
              }
            }
          }
          
          return newStage;
        });
        
        setTimeLeft(timePrev => timePrev + currentStageScore);
        setCurrentStageScore(0);
      }
      
      return newTime;
    });
  }, [currentStageScore]);

  const handleGameOver = useCallback(() => {
    cleanup();
    stopBGM();
    setShowGameOver(true);
  }, []);

  const cleanup = useCallback(() => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (stateIntervalRef.current) clearInterval(stateIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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

  const startGame = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setIsGameStarted(true);
    setScore(0);
    setStage(1);
    setTimeLeft(15);
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
  }, [createObject, updateGameState, playBGM]);

  const startCountdown = useCallback(() => {
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        setCountdown(count);
        count--;
      } else {
        clearInterval(countdownInterval);
        setCountdown(0);
        startGame();
      }
    }, 1000);
  }, [startGame]);

  const handleObjectClick = useCallback((mouseX: number, mouseY: number) => {
    objectsRef.current.forEach((obj, index) => {
      const dist = Math.hypot(mouseX - obj.x, mouseY - obj.y);
      if ((obj.shape === 'circle' && dist < obj.radius) ||
          (obj.shape === 'triangle' && isInsideTriangle(obj, mouseX, mouseY)) ||
          (obj.shape === 'square' && isInsideSquare(obj, mouseX, mouseY))) {
        objectsRef.current.splice(index, 1);
        setScore(prev => prev + obj.points);
        setCurrentStageScore(prev => prev + obj.points);
      }
    });
  }, [isInsideTriangle, isInsideSquare]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    handleObjectClick(mouseX, mouseY);
  }, [handleObjectClick]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (canvasRef.current) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      handleObjectClick(mouseX, mouseY);
    }
  }, [handleObjectClick]);

  const handleRestart = useCallback(() => {
    cleanup();
    setShowGameOver(false);
    startCountdown();
  }, [cleanup, startCountdown]);

  const handleExit = useCallback(() => {
    cleanup();
    stopBGM();
    onExit();
  }, [cleanup, stopBGM, onExit]);

  // 초기화
  useEffect(() => {
    initBGM();
    startCountdown();
    return () => {
      cleanup();
    };
  }, [initBGM, startCountdown, cleanup]);

  // 애니메이션 루프
  useEffect(() => {
    if (isGameStarted && canvasRef.current) {
      const canvas = canvasRef.current;
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
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
  }, [isGameStarted, updateObjects]);

  return {
    score,
    stage,
    timeLeft,
    currentStageScore,
    showGameOver,
    countdown,
    isGameStarted,
    canvasRef,
    handleCanvasClick,
    handleTouchStart,
    handleRestart,
    handleExit,
  };
}

