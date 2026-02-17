'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import '../../../../styles/games/numbersequence.css';
import { useNumberSequenceGame } from '../../../../hooks/games/useNumberSequenceGame';

export default function NumberSequencePage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
    score,
    highScore,
    time,
    level,
    sequence,
    showGameOver,
    gameOverMessage,
    showInstruction,
    handleNumberClick,
    handleRestart,
    exitGame,
  } = useNumberSequenceGame(() => {
    router.push(`/${locale}/games`);
  });

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="header">
          <div className="high-score">최고점수: <span id="high-score">{highScore}점</span></div>
          <div className="score">현재점수: <span id="score">{score}</span></div>
          <div className="timer">남은시간: <span id="time">{time}</span></div>
        </div>
        {showInstruction && (
          <div id="game-instruction" className="game-instruction">
            숫자를 주어진 시간 안에 순서대로 모두 누르세요
          </div>
        )}
        <div id="game-board" className="game-board" style={{ gridTemplateColumns: `repeat(${level}, 1fr)`, gridTemplateRows: `repeat(${level}, 1fr)` }}>
          {sequence.map((number, index) => (
            <div
              key={index}
              className="grid-item"
              onClick={() => handleNumberClick(number)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleNumberClick(number);
              }}
            >
              {number}
            </div>
          ))}
        </div>
        {showGameOver && (
          <div className="game-over-container">
            <div className="game-over-message">{gameOverMessage}</div>
            <div className="button-container">
              <button className="btn btn-primary large-button" onClick={handleRestart}>다시 시작</button>
              <button className="btn btn-secondary large-button" onClick={exitGame}>종료</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

