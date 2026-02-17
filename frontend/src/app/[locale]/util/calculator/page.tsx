'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/calculator.css';

export default function CalculatorPage() {
  const [firstOperand, setFirstOperand] = useState('');
  const [secondOperand, setSecondOperand] = useState('');
  const [operator, setOperator] = useState('');
  const [resultDisplayed, setResultDisplayed] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const updateDisplay = () => {
    if (resultDisplayed) {
      return firstOperand;
    }
    return secondOperand || operator || firstOperand || '0';
  };

  const appendToHistory = useCallback((expression: string, result: string) => {
    setCalculationHistory(`${expression} =`);
    setHistory(prev => [...prev, `${expression} = ${result}`]);
  }, []);

  const calculate = useCallback((addToHistory = true) => {
    let result: number | string = 0;
    const a = parseFloat(firstOperand);
    const b = parseFloat(secondOperand);
    const expression = `${firstOperand} ${operator} ${secondOperand}`;

    switch (operator) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '×':
        result = a * b;
        break;
      case '÷':
        result = b !== 0 ? a / b : 'Error';
        break;
      case '%':
        result = a % b;
        break;
      default:
        return;
    }

    if (result === 'Error' || (typeof result === 'number' && isNaN(result))) {
      setFirstOperand('Error');
    } else {
      setFirstOperand(String(result));
    }
    setSecondOperand('');
    setOperator('');
    setResultDisplayed(true);
    
    if (addToHistory && typeof result === 'number' && !isNaN(result)) {
      appendToHistory(expression, String(result));
    }
  }, [firstOperand, secondOperand, operator, appendToHistory]);

  const handleButtonClick = useCallback((value: string, type: string) => {
    if (type === 'number') {
      if (resultDisplayed) {
        setFirstOperand(value);
        setResultDisplayed(false);
        setCalculationHistory('');
      } else {
        if (!operator) {
          setFirstOperand(prev => prev + value);
        } else {
          setSecondOperand(prev => prev + value);
        }
      }
    } else if (type === 'operator') {
      if (firstOperand && !secondOperand) {
        // 첫 번째 연산자 입력
        setOperator(value);
        setResultDisplayed(false);
      } else if (firstOperand && operator && secondOperand) {
        // 연속 계산: 현재 계산을 수행하고 새로운 연산자 설정
        calculate(false); // 히스토리에 추가하지 않음
        setOperator(value);
        setResultDisplayed(false);
      } else if (resultDisplayed) {
        // 결과가 표시된 상태에서 연산자 입력 시 연속 계산
        setOperator(value);
        setResultDisplayed(false);
      }
    } else if (type === 'calculate') {
      if (firstOperand && secondOperand && operator) {
        calculate();
      }
    } else if (type === 'clear') {
      setFirstOperand('');
      setSecondOperand('');
      setOperator('');
      setResultDisplayed(false);
      setCalculationHistory('');
    } else if (type === 'clearEntry') {
      if (secondOperand) {
        setSecondOperand('');
      } else if (operator) {
        setOperator('');
      } else {
        setFirstOperand('');
      }
    } else if (type === 'function') {
      if (value === '√') {
        const num = parseFloat(firstOperand || '0');
        if (num >= 0) {
          const result = Math.sqrt(num);
          setFirstOperand(String(result));
          setResultDisplayed(true);
          appendToHistory(`√${num}`, String(result));
        }
      } else if (value === 'x²') {
        const num = parseFloat(firstOperand || '0');
        const result = num * num;
        setFirstOperand(String(result));
        setResultDisplayed(true);
        appendToHistory(`${num}²`, String(result));
      }
    }
  }, [firstOperand, secondOperand, operator, resultDisplayed, calculate, appendToHistory]);

  useEffect(() => {
    // 실시간 계산 기록 업데이트
    let historyText = '';
    if (firstOperand) {
      historyText += firstOperand;
    }
    if (operator) {
      historyText += ` ${operator}`;
    }
    if (secondOperand) {
      historyText += ` ${secondOperand}`;
    }
    if (!resultDisplayed) {
      setCalculationHistory(historyText);
    }
  }, [firstOperand, secondOperand, operator, resultDisplayed]);

  useEffect(() => {
    // 키보드 입력 지원
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (!isNaN(parseInt(key))) {
        handleButtonClick(key, 'number');
      }

      if (['+', '-', '*', '/', '%'].includes(key)) {
        const opMap: { [key: string]: string } = {
          '*': '×',
          '/': '÷'
        };
        const mapped = opMap[key] || key;
        handleButtonClick(mapped, 'operator');
      }

      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleButtonClick('=', 'calculate');
      }

      if (key === 'Escape') {
        handleButtonClick('C', 'clear');
      }

      if (key === 'Backspace') {
        e.preventDefault();
        handleButtonClick('CE', 'clearEntry');
      }

      if (key === '.') {
        handleButtonClick('.', 'number');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleButtonClick]);

  const clearHistory = () => {
    setHistory([]);
    setCalculationHistory('');
  };

  return (
    <>
      <Navbar />
      <section className="pt-20 pb-20">
        <h1 className="text-3xl font-bold text-center mb-8">계산기</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md mx-auto">
          <div className="display mb-4">
            <div className="calculation-history text-sm text-gray-500 mb-1">{calculationHistory}</div>
            <div className="current-result text-2xl font-bold text-gray-800">{updateDisplay()}</div>
          </div>
          <div className="calculator-grid">
            <div className="calculator-button btn clear" onClick={() => handleButtonClick('C', 'clear')}>C</div>
            <div className="calculator-button btn clear" onClick={() => handleButtonClick('CE', 'clearEntry')}>CE</div>
            <div className="calculator-button btn operator" onClick={() => handleButtonClick('%', 'operator')}>%</div>
            <div className="calculator-button btn operator" onClick={() => handleButtonClick('÷', 'operator')}>÷</div>
            <div className="calculator-button btn function" onClick={() => handleButtonClick('√', 'function')}>√</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('7', 'number')}>7</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('8', 'number')}>8</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('9', 'number')}>9</div>
            <div className="calculator-button btn function" onClick={() => handleButtonClick('x²', 'function')}>x²</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('4', 'number')}>4</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('5', 'number')}>5</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('6', 'number')}>6</div>
            <div className="calculator-button btn operator" onClick={() => handleButtonClick('×', 'operator')}>×</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('1', 'number')}>1</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('2', 'number')}>2</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('3', 'number')}>3</div>
            <div className="calculator-button btn operator" onClick={() => handleButtonClick('-', 'operator')}>-</div>
            <div className="calculator-button btn number" onClick={() => handleButtonClick('0', 'number')}>0</div>
            <div className="calculator-button btn decimal" onClick={() => handleButtonClick('.', 'number')}>.</div>
            <div className="calculator-button btn equals" onClick={() => handleButtonClick('=', 'calculate')}>=</div>
            <div className="calculator-button btn operator" onClick={() => handleButtonClick('+', 'operator')}>+</div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-gray-800">계산 기록</h3>
              <button className="text-sm text-red-500 hover:text-red-600" onClick={clearHistory}>기록 지우기</button>
            </div>
            <ul className="history-list text-gray-600">
              {history.map((entry, index) => (
                <div key={index} className="history-entry">{entry}</div>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

