'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import '../../../../styles/games/flashtrack.css';
import { useFlashTrackGame } from '../../../../hooks/games/useFlashTrackGame';

export default function FlashTrackPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
    score,
    highScore,
    showMessage,
    messageText,
    stage,
    showStageMessage,
    handleButtonClick,
    startNewGame,
    exitGame,
  } = useFlashTrackGame(() => {
    router.push(`/${locale}/games`);
  });

  return (
    <>
      <Navbar />
      <div id="game-container" className="game-wrapper">
        <div id="game-wrapper" className="game-group">
          <h1 className="game-title">FlashTrack</h1>

          <div id="scoreboard" className="score-display">
            <p>High Score: <span id="high-score">{highScore > 0 ? `최고 점수: ${highScore}점` : '0'}</span></p>
            <p>Score: <span id="score">{score}</span></p>
          </div>

          <div id="button-grid" className="grid">
            <button id="outer-btn-1" className="quarter-button" onClick={handleButtonClick}></button>
            <button id="outer-btn-2" className="quarter-button" onClick={handleButtonClick}></button>
            <button id="outer-btn-3" className="quarter-button" onClick={handleButtonClick}></button>
            <button id="outer-btn-4" className="quarter-button" onClick={handleButtonClick}></button>

            <div className="outer-overlay"></div>

            <button id="inner-btn-1" className="quarter-button inner-button" onClick={handleButtonClick}></button>
            <button id="inner-btn-2" className="quarter-button inner-button" onClick={handleButtonClick}></button>
            <button id="inner-btn-3" className="quarter-button inner-button" onClick={handleButtonClick}></button>
            <button id="inner-btn-4" className="quarter-button inner-button" onClick={handleButtonClick}></button>

            <div className="inner-overlay"></div>

            {showStageMessage && (
              <div className="stage-message">단계 {stage}</div>
            )}

            {showMessage && (
              <div id="message-box" className={showMessage ? '' : 'hidden'}>
                <p id="message-text">{messageText}</p>
                <button id="restart-btn" onClick={startNewGame}>다시 하기</button>
                <button id="exit-btn" onClick={exitGame}>종료</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

