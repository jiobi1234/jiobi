'use client';

import '../../styles/games/common.css';

interface GameOverActionsProps {
  title?: string;
  message?: string;
  onRestart: () => void;
  onExit: () => void;
  restartLabel?: string;
  exitLabel?: string;
  children?: React.ReactNode;
}

export default function GameOverActions({
  title = '게임이 끝났어요.',
  message,
  onRestart,
  onExit,
  restartLabel = '다시하기',
  exitLabel = '종료',
  children,
}: GameOverActionsProps) {
  return (
    <div className="game-over-wrap">
      {title && <h3 className="game-over-title">{title}</h3>}
      {message && <p className="game-over-message">{message}</p>}
      {children}
      <div className="game-over-buttons">
        <button type="button" className="game-over-btn game-over-btn-primary" onClick={onRestart}>
          {restartLabel}
        </button>
        <button type="button" className="game-over-btn game-over-btn-secondary" onClick={onExit}>
          {exitLabel}
        </button>
      </div>
    </div>
  );
}
