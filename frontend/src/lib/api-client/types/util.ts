// 유틸리티 API 타입 정의

export interface ExchangeRateResponse {
  from: string;
  to: string;
  rate: number;
  date: string;
}

export interface HolidaysResponse {
  year: number;
  month?: number;
  holidays: Array<{
    date: string;
    name: string;
  }>;
}

export interface LunarResponse {
  solar: {
    year: number;
    month: number;
    day: number;
  };
  lunar: {
    year: number;
    month: number;
    day: number;
  };
}

export interface IpResponse {
  ip: string;
}

