'use client';

import { useEffect, useState, useCallback } from 'react';
import { createContext, useContext, ReactNode } from 'react';
import { logError } from '../../../utils/logger';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider
 * 전역 Toast 상태 관리
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // 자동 제거
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container
 * Toast 목록을 렌더링하는 컴포넌트
 */
function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <>
      <div className="toast-container" role="region" aria-live="polite" aria-label="알림 메시지">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>

      <style jsx>{`
        .toast-container {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .toast-container {
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Toast Item
 * 개별 Toast 컴포넌트
 */
function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 애니메이션을 위한 지연
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 300);
  }, [toast.id, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <>
      <div
        className={`toast-item toast-item--${toast.type} ${isVisible ? 'toast-item--visible' : ''}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{toast.message}</div>
        <button
          className="toast-close"
          onClick={handleClose}
          aria-label="닫기"
          type="button"
        >
          ×
        </button>
      </div>

      <style jsx>{`
        .toast-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: white;
          border-radius: var(--hk-radius-lg);
          box-shadow: var(--hk-shadow-lg);
          pointer-events: auto;
          opacity: 0;
          transform: translateY(20px) scale(0.97);
          transition: all 0.3s ease;
          min-width: 280px;
          max-width: 480px;
          width: 100%;
        }

        .toast-item--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .toast-item--success {
          border-left: 4px solid var(--hk-success);
        }

        .toast-item--error {
          border-left: 4px solid var(--hk-error);
        }

        .toast-item--warning {
          border-left: 4px solid #ffc107;
        }

        .toast-item--info {
          border-left: 4px solid var(--hk-primary);
        }

        .toast-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }

        .toast-item--success .toast-icon {
          color: var(--hk-success);
        }

        .toast-item--error .toast-icon {
          color: var(--hk-error);
        }

        .toast-item--warning .toast-icon {
          color: #ffc107;
        }

        .toast-item--info .toast-icon {
          color: var(--hk-primary);
        }

        .toast-message {
          flex: 1;
          font-size: 0.95rem;
          color: var(--hk-text-primary);
          line-height: 1.5;
        }

        .toast-close {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--hk-text-secondary);
          font-size: 20px;
          line-height: 1;
          padding: 0;
          transition: color 0.2s ease;
        }

        .toast-close:hover {
          color: var(--hk-text-primary);
        }

        .toast-close:focus {
          outline: 2px solid var(--hk-primary);
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .toast-item {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

/**
 * useToast Hook
 * Toast를 표시하기 위한 커스텀 훅
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * 편의 함수들
 */
export const toast = {
  success: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: { type: 'success', message, duration },
      });
      window.dispatchEvent(event);
    }
  },
  error: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: { type: 'error', message, duration },
      });
      window.dispatchEvent(event);
    }
  },
  warning: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: { type: 'warning', message, duration },
      });
      window.dispatchEvent(event);
    }
  },
  info: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: { type: 'info', message, duration },
      });
      window.dispatchEvent(event);
    }
  },
};

