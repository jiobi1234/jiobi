import { useState, useEffect, useRef, useCallback } from 'react';

export interface Question {
  index: string;
  question: string;
  answer: boolean;
}

interface UseOXQuizGameReturn {
  // 상태
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  isRunning: boolean;
  showStartButton: boolean;
  showMessageBox: boolean;
  questionText: string;
  
  // 핸들러
  startQuiz: () => void;
  answer: (isTrue: boolean) => void;
  startNewGame: () => void;
  exitGame: () => void;
  getTimeColor: () => string;
}

/**
 * O/X 퀴즈 게임 로직을 관리하는 커스텀 훅
 */
export function useOXQuizGame(onExit: () => void): UseOXQuizGameReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [questionText, setQuestionText] = useState('게임 시작 버튼을 누르세요!');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('/txt/quiz_questions.txt');
      const data = await response.text();
      const lines = data.trim().split('\n');
      const parsedQuestions: Question[] = [];

      for (let i = 0; i < lines.length; i += 2) {
        const questionLine = lines[i]?.trim();
        const answerLine = lines[i + 1]?.trim();

        if (!questionLine || !answerLine) continue;

        const questionIndex = questionLine.split(':')[0]?.trim();
        const questionText = questionLine.split(':')[1]?.trim();
        const answerIndex = answerLine.split(':')[0]?.trim();
        const answerText = answerLine.split(':')[1]?.trim().toUpperCase();

        if (questionIndex?.replace('Q', '') === answerIndex?.replace('A', '')) {
          parsedQuestions.push({
            index: questionIndex.replace('Q', ''),
            question: questionText || '',
            answer: answerText === 'O'
          });
        }
      }
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  }, []);

  const shuffleQuestions = useCallback(() => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestions(shuffled);
  }, [questions]);

  const endQuiz = useCallback((isCorrect = true, correctAnswer: boolean | null = null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);

    if (!isCorrect && correctAnswer !== null) {
      setQuestionText(`게임 종료! 정답은 ${correctAnswer ? 'O' : 'X'}였습니다. 최종 점수: ${score}점.`);
    } else {
      setQuestionText(`게임 종료! 최종 점수: ${score}점.`);
    }

    setShowMessageBox(true);
  }, [score]);

  const showNextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (prev < questions.length) {
        setQuestionText(questions[prev].question);
        return prev;
      } else {
        endQuiz();
        return prev;
      }
    });
  }, [questions, endQuiz]);

  const updateTimer = useCallback(() => {
    setTimeLeft(prev => {
      const newTime = prev - 1;
      if (newTime <= 0) {
        endQuiz();
        return 0;
      }
      return newTime;
    });
  }, [endQuiz]);

  const startQuiz = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setShowStartButton(false);
    setScore(0);
    setTimeLeft(60);
    setCurrentQuestionIndex(0);
    setShowMessageBox(false);

    shuffleQuestions();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(updateTimer, 1000);
    
    // 첫 번째 질문 표시
    setTimeout(() => {
      if (questions.length > 0) {
        setQuestionText(questions[0].question);
      }
    }, 100);
  }, [isRunning, shuffleQuestions, updateTimer, questions]);

  const answer = useCallback((isTrue: boolean) => {
    if (!isRunning) return;
    
    setCurrentQuestionIndex(prev => {
      const correctAnswer = questions[prev]?.answer;

      if (isTrue === correctAnswer) {
        if (correctAudioRef.current) {
          correctAudioRef.current.currentTime = 0;
          correctAudioRef.current.play().catch(() => {});
        }
        setScore(scorePrev => scorePrev + 10);
        
        const nextIndex = prev + 1;
        if (nextIndex < questions.length) {
          setTimeout(() => {
            setQuestionText(questions[nextIndex].question);
          }, 500);
          return nextIndex;
        } else {
          setTimeout(() => endQuiz(), 500);
          return prev;
        }
      } else {
        if (incorrectAudioRef.current) {
          incorrectAudioRef.current.currentTime = 0;
          incorrectAudioRef.current.play().catch(() => {});
        }
        setTimeout(() => endQuiz(false, correctAnswer), 100);
        return prev;
      }
    });
  }, [isRunning, questions, endQuiz]);

  const startNewGame = useCallback(() => {
    setShowMessageBox(false);
    setIsRunning(false);
    setQuestionText('게임 시작 버튼을 누르세요!');
    setShowStartButton(true);
  }, []);

  const exitGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    onExit();
  }, [onExit]);

  const getTimeColor = useCallback(() => {
    if (timeLeft <= 20) return '#F44336';
    if (timeLeft <= 40) return '#FF9800';
    return '#4CAF50';
  }, [timeLeft]);

  // 초기화
  useEffect(() => {
    correctAudioRef.current = new Audio('/audio/games/oxquiz_O.mp3');
    incorrectAudioRef.current = new Audio('/audio/games/oxquiz_X.mp3');
    if (correctAudioRef.current) {
      correctAudioRef.current.volume = 0.7;
      correctAudioRef.current.preload = 'auto';
    }
    if (incorrectAudioRef.current) {
      incorrectAudioRef.current.volume = 0.9;
      incorrectAudioRef.current.preload = 'auto';
    }

    fetchQuestions();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchQuestions]);

  return {
    questions,
    currentQuestionIndex,
    score,
    timeLeft,
    isRunning,
    showStartButton,
    showMessageBox,
    questionText,
    startQuiz,
    answer,
    startNewGame,
    exitGame,
    getTimeColor,
  };
}

