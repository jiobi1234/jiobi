'use client';

import Navbar from '../../../../components/Navbar';
import { useMemoryGame } from '../../../../hooks/games/useMemoryGame';

export default function MemoryTestPage() {
  const {
    allWords,
    currentStage,
    currentWords,
    phase,
    timeLeft,
    userInputs,
    results,
    inputRefs,
    startGame,
    handleInputChange,
    handleKeyDown,
    checkAnswers,
    nextStage,
    resetGame,
  } = useMemoryGame();

  return (
    <>
      <Navbar />
      <div className="container" style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dddddd',
        padding: '40px 20px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        position: 'relative',
        maxWidth: '600px',
        width: '90%',
        margin: '80px auto 40px auto'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px', fontSize: '2em' }}>기억력 테스트 게임</h1>
        <p id="instruction" style={{ color: '#666', marginBottom: '20px', fontSize: '1.1em' }}>
          {phase === 'start' && '게임을 시작하려면 아래 버튼을 클릭하세요!'}
          {phase === 'memorization' && `아래 ${currentWords.length}개 단어들을 순서대로 기억하세요!`}
          {phase === 'input' && '기억한 단어들을 순서대로 입력하세요'}
          {phase === 'result' && results.some(r => !r.isCorrect) && '게임 오버! 다시 도전해보세요!'}
          {phase === 'result' && results.every(r => r.isCorrect) && '축하합니다! 모든 단계를 완료했습니다!'}
        </p>

        {phase === 'start' && (
          <button 
            id="start-game-btn" 
            onClick={startGame}
            style={{
              fontSize: '1.2em',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '20px 0'
            }}
          >
            게임 시작
          </button>
        )}

        {phase === 'memorization' && timeLeft > 0 && (
          <div id="time" style={{
            fontSize: '2.5em',
            color: '#dc3545',
            margin: '30px 0',
            padding: '15px 30px',
            backgroundColor: '#f8d7da',
            border: '3px solid #dc3545',
            borderRadius: '12px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {timeLeft}초 남음
          </div>
        )}

        {phase === 'memorization' && (
          <div id="memorization-phase" style={{ display: 'block' }}>
            <div className="phase-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px auto',
              gap: '80px',
              maxWidth: '100%',
              width: '100%'
            }}>
              <div className="words-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0'
                }}>
                  {currentWords.map((word, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-word"
                        value={word}
                        disabled
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: 'white'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="input-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0'
                }}>
                  {currentWords.map((_, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-word"
                        disabled
                        placeholder=""
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: 'white'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {phase === 'input' && (
          <div id="input-phase" style={{ display: 'block' }}>
            <div className="phase-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px auto',
              gap: '80px',
              maxWidth: '100%',
              width: '100%'
            }}>
              <div className="words-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0'
                }}>
                  {currentWords.map((_, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-word"
                        value="***"
                        disabled
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: 'white'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="input-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" id="active-inputs" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  {currentWords.map((_, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        className="input-word"
                        value={userInputs[index] || ''}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        placeholder="단어 입력"
                        autoComplete="off"
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: 'white'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-submit" 
              id="submit-btn"
              onClick={checkAnswers}
              style={{
                fontSize: '1.2em',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '20px 0'
              }}
            >
              제출
            </button>
            <div className="keyboard-hints" style={{
              margin: '20px 0',
              textAlign: 'center',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9em' }}>
                💡 <strong>키보드 단축키:</strong> Enter로 제출, Tab으로 다음 칸, Shift+Tab으로 이전 칸
              </p>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div id="result-phase" style={{ display: 'block' }}>
            <div className="phase-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px auto',
              gap: '80px',
              maxWidth: '100%',
              width: '100%'
            }}>
              <div className="words-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0'
                }}>
                  {results.map((result, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-word"
                        value={result.correctWord}
                        disabled
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: 'white'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="input-column" style={{
                flex: '0 1 auto',
                textAlign: 'center',
                minWidth: '180px',
                maxWidth: '200px',
                margin: '0 auto'
              }}>
                <ul className="words-list" style={{
                  fontSize: '1.5em',
                  listStyleType: 'none',
                  padding: 0,
                  margin: '20px 0'
                }}>
                  {results.map((result, index) => (
                    <li key={index} style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-word"
                        value={result.userInput}
                        disabled
                        style={{
                          fontSize: '1.2em',
                          padding: '8px 12px',
                          width: '100%',
                          maxWidth: '200px',
                          textAlign: 'center',
                          margin: '8px',
                          border: `2px solid ${result.isCorrect ? '#007bff' : '#dc3545'}`,
                          borderRadius: '5px',
                          backgroundColor: result.isCorrect ? '#f8f9fa' : '#f8d7da'
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {results.every(r => r.isCorrect) && currentStage * 3 <= allWords.length && (
              <button 
                type="button" 
                className="btn-submit" 
                id="next-stage-btn"
                onClick={nextStage}
                style={{
                  fontSize: '1.2em',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  margin: '20px 0'
                }}
              >
                다음 단계
              </button>
            )}
            <button 
              type="button" 
              className="btn-submit" 
              id="restart-btn"
              onClick={resetGame}
              style={{
                fontSize: '1.2em',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '20px 0'
              }}
            >
              다시 시작
            </button>
          </div>
        )}
      </div>
    </>
  );
}

