'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import '../../../../styles/games/oxquiz.css';
import { useOXQuizGame } from '../../../../hooks/games/useOXQuizGame';

export default function OXQuizPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
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
  } = useOXQuizGame(() => {
    router.push(`/${locale}/games`);
  });

  return (
    <>
      <Navbar />
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="timer">
            <span id="time-left" style={{ color: getTimeColor() }}>{timeLeft}</span> 초 남음
          </div>
          <div className="score">
            점수: <span id="score">{score}</span>
          </div>
        </div>
        <div className="quiz-body">
          <div id="question-box">
            <p id="question-text">{questionText}</p>
          </div>
          {showStartButton && (
            <button id="start-btn" className="start-btn" onClick={startQuiz}>게임 시작</button>
          )}
        </div>
        <div className="quiz-footer">
          <button id="true-btn" className="answer-btn" onClick={() => answer(true)} disabled={!isRunning}>O</button>
          <button id="false-btn" className="answer-btn" onClick={() => answer(false)} disabled={!isRunning}>X</button>
        </div>
      </div>

      {showMessageBox && (
        <div id="message-box" className={showMessageBox ? '' : 'hidden'}>
          <p id="message-text">게임이 끝났습니다.</p>
          <button id="restart-btn" onClick={startNewGame}>다시 하기</button>
          <button id="exit-btn" onClick={exitGame}>종료</button>
        </div>
      )}
    </>
  );
}

