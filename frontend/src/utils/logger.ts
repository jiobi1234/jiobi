/**
 * 통합 로깅 시스템
 * 개발/프로덕션 환경에 따라 다른 로깅 레벨 제공
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${contextStr} [${level.toUpperCase()}] ${message}`;
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    this.addToHistory(entry);

    // 프로덕션에서는 error와 warn만 로깅
    if (!this.isDevelopment && level !== 'error' && level !== 'warn') {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data, context);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage, data || '');
        }
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        // 프로덕션에서는 에러를 외부 서비스로 전송할 수 있음
        if (!this.isDevelopment) {
          // TODO: 에러 리포팅 서비스 연동 (예: Sentry, LogRocket 등)
          // this.reportError(entry);
        }
        break;
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: any, context?: string) {
    this.log('error', message, error, context);
  }

  /**
   * 로그 히스토리 조회 (디버깅용)
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * 로그 히스토리 초기화
   */
  clearHistory() {
    this.logHistory = [];
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 편의 함수들
export const logDebug = (message: string, data?: any, context?: string) => {
  logger.debug(message, data, context);
};

export const logInfo = (message: string, data?: any, context?: string) => {
  logger.info(message, data, context);
};

export const logWarn = (message: string, data?: any, context?: string) => {
  logger.warn(message, data, context);
};

export const logError = (message: string, error?: any, context?: string) => {
  logger.error(message, error, context);
};

