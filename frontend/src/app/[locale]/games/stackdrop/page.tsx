'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import '../../../../styles/games/stackdrop.css';
import { useStackDropGame } from '../../../../hooks/games/useStackDropGame';

export default function StackDropPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
    timeLeft,
    score,
    highScore,
    showMessageBox,
    stackedBlocks,
    fallingBlock,
    gameAreaRef,
    dropRectangle,
    handleRestart,
    handleExit,
  } = useStackDropGame(() => {
    router.push(`/${locale}/games`);
  });

  const blockWidth = 80;
  const blockHeight = 30;

  return (
    <>
      <Navbar />
      <div id="game-info">
        <div id="time-left" style={{ color: timeLeft <= 10 ? 'red' : '', fontWeight: timeLeft <= 10 ? 'bold' : 'normal' }}>
          남은 시간: {timeLeft}초
        </div>
        <div id="current-score">현재 점수: {score}점</div>
        <div id="high-score">최고 점수: {highScore}점</div>
      </div>

      <div id="game-container">
        <div id="game-area" ref={gameAreaRef} style={{ position: 'relative', width: '100%', height: '400px' }}>
          <div id="stacked-rectangles" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {stackedBlocks.map(block => (
              <div
                key={block.id}
                className="falling-rectangle"
                style={{
                  position: 'absolute',
                  width: `${blockWidth}px`,
                  height: `${blockHeight}px`,
                  backgroundColor: '#3498db',
                  left: `${block.left}px`,
                  top: `${block.top}px`,
                  transition: block.isFalling ? 'none' : 'top 0.5s ease-in-out'
                }}
              />
            ))}
          </div>
          {fallingBlock && (
            <div
              className="falling-rectangle"
              style={{
                position: 'absolute',
                width: `${blockWidth}px`,
                height: `${blockHeight}px`,
                backgroundColor: '#3498db',
                left: `${fallingBlock.left}px`,
                top: `${fallingBlock.top}px`
              }}
            />
          )}
        </div>

        <div id="footer">
          <button id="drop-button" onClick={dropRectangle} disabled={!fallingBlock}>쌓기</button>
        </div>
      </div>

      {showMessageBox && (
        <div id="standard-message-box" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '2px solid #333',
          zIndex: 1000
        }}>
          <p>게임이 끝났습니다.</p>
          <p>최종 점수는 {score}점입니다.</p>
          <div id="button-container">
            <button id="standard-restart-btn" onClick={handleRestart}>다시 하기</button>
            <button id="standard-exit-btn" onClick={handleExit}>종료</button>
          </div>
        </div>
      )}
    </>
  );
}

