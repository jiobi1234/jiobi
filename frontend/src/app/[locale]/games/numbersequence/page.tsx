'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import GameOverActions from '../../../../components/games/GameOverActions';
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
    userSequence,
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
      <div className="ns-container">
        <div className="ns-header">
          <div>최고점수: <span>{highScore}점</span></div>
          <div>현재점수: <span>{score}</span></div>
          <div>남은시간: <span>{time}</span></div>
        </div>
        {showInstruction && (
          <p className="ns-instruction">
            숫자를 주어진 시간 안에 순서대로 모두 누르세요
          </p>
        )}
        <div className="ns-board-wrap">
          <div
            className="ns-board"
            style={{ gridTemplateColumns: `repeat(${level}, 1fr)`, gridTemplateRows: `repeat(${level}, 1fr)` }}
          >
            {sequence.map((number, index) => {
            const isPressed = userSequence.includes(number);
            return (
              <button
                key={index}
                type="button"
                className={`grid-item ${isPressed ? 'pressed' : ''}`}
                onClick={() => handleNumberClick(number)}
                disabled={showGameOver}
              >
                {number}
              </button>
            );
          })}
          </div>
        </div>
        {showGameOver && (
          <GameOverActions
            title="게임이 끝났어요."
            message={gameOverMessage}
            onRestart={handleRestart}
            onExit={exitGame}
            restartLabel="다시 시작"
            exitLabel="종료"
          />
        )}
      </div>
    </>
  );
}

