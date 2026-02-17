'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '../../../../components/Navbar';
import { useReactionTimeGame } from '../../../../hooks/games/useReactionTimeGame';

export default function ReactionTimePage() {
  const router = useRouter();
  const locale = useLocale();
  
  const {
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
  } = useReactionTimeGame(() => {
    router.push(`/${locale}/games`);
  });

  return (
    <>
      <Navbar />
      <div id="scoreboard" style={{
        position: 'absolute',
        top: '80px',
        width: '100%',
        textAlign: 'center',
        fontSize: '24px',
        color: 'white',
        zIndex: 100
      }}>
        <div id="stage" style={{ display: 'inline-block', marginRight: '20px' }}>단계: {stage}</div>
        <div id="score" style={{ display: 'inline-block', marginRight: '20px' }}>게임점수: {score}</div>
        <div id="current-score" style={{ display: 'inline-block', marginRight: '20px' }}>단계 점수: {currentStageScore}</div>
        <div id="time" style={{ display: 'inline-block' }}>
          {countdown > 0 ? `${countdown}초 후 게임 시작!` : `남은 시간: ${timeLeft}초`}
        </div>
      </div>
      <canvas 
        ref={canvasRef}
        id="gameCanvas"
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        style={{
          display: 'block',
          margin: '0 auto',
          background: 'transparent'
        }}
      />
      
      {showGameOver && (
        <div id="game-over-message" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '28px' }}>게임 종료!</h2>
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '20px' }}>
              최종 점수: <span id="final-score">{score}</span>점
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={handleRestart}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#4CAF50',
                  color: 'white'
                }}
              >
                다시 하기
              </button>
              <button 
                onClick={handleExit}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#2196F3',
                  color: 'white'
                }}
              >
                게임 메인으로
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

