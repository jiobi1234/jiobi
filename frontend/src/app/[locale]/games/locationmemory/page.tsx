'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import GameOverActions from '../../../../components/games/GameOverActions';
import '../../../../styles/games/locationmemory.css';
import { useLocationMemoryGame } from '../../../../hooks/games/useLocationMemoryGame';

export default function LocationMemoryPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
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
  } = useLocationMemoryGame(() => {
    router.push(`/${locale}/games`);
  });

  /** 게임 오버 시 정답 그리드 (currentShapes → 16칸) */
  const answerGridCells = useMemo(() => {
    return Array.from({ length: 16 }, (_, id) => ({
      id,
      shape: currentShapes.find((s) => s.position === id)?.shape ?? null,
    }));
  }, [currentShapes]);

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h2 className="text-center">정확한 위치에 기억한 도형을 남은 시간 내에 옮기세요.</h2>

        <div className="row mt-4 text-center">
          <div className="col">
            <h4>총 점수: <span id="total-score">{totalScore}</span></h4>
          </div>
          <div className="col">
            {showMemoryTime ? (
              <h4 id="memory-time-container">기억하는 시간: <span id="memory-time">{memoryTime}</span> 초</h4>
            ) : (
              <h4 id="remaining-time-container">남은 시간: <span id="remaining-time">{remainingTime}</span> 초</h4>
            )}
          </div>
        </div>

        {showGameOver && (
          <div id="game-over-message" className="text-center mt-3">
            <GameOverActions
              title="게임이 끝났어요."
              message={gameOverMessage}
              onRestart={handleRestart}
              onExit={exitGame}
              restartLabel="다시하기"
              exitLabel="종료"
            >
              {currentShapes.length > 0 && (
                <div className="game-over-answer-wrap">
                  <p className="game-over-answer-label">정답 위치</p>
                  <div className="grid game-over-answer-grid">
                    {answerGridCells.map((cell) => (
                      <div key={cell.id} className="grid-cell">
                        {cell.shape !== null && (
                          <img
                            src={`/images/games/shape${cell.shape}.png`}
                            alt={`Shape ${cell.shape}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GameOverActions>
          </div>
        )}

        <div className="row mt-4 flex-column align-items-center">
          <div className="col-12 mb-4">
            <div id="top-grid" className="grid">
              {topGridCells.map((cell) => (
                <div
                  key={cell.id}
                  className="grid-cell"
                  id={`top-cell-${cell.id}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, cell.id)}
                >
                  {cell.shape !== null && (
                    <img
                      src={`/images/games/shape${cell.shape}.png`}
                      alt={`Shape ${cell.shape}`}
                      id={`shape-${cell.shape}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col-12">
            <div id="bottom-grid" className="grid">
              {bottomGridCells.map((cell) => (
                <div
                  key={cell.id}
                  className="grid-cell draggable"
                  id={`bottom-cell-${cell.id}`}
                >
                  {cell.shape !== null && (
                    <img
                      src={`/images/games/shape${cell.shape}.png`}
                      alt={`Shape ${cell.shape}`}
                      className="draggable"
                      id={`shape-${cell.shape}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cell.shape!)}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

