// 유틸리티 API 클라이언트

import { BaseApiClient } from './base-client';
import type {
  ExchangeRateResponse,
  HolidaysResponse,
  LunarResponse,
  IpResponse,
} from './types';

export class UtilClient extends BaseApiClient {
  /**
   * 환율 조회
   */
  async getExchangeRate(
    fromCurrency: string = 'USD',
    toCurrency: string = 'KRW'
  ): Promise<ExchangeRateResponse> {
    return this.get<ExchangeRateResponse>('/util/exchange-rate/', {
      from_currency: fromCurrency,
      to_currency: toCurrency,
    }, false);
  }

  /**
   * 공휴일 조회
   */
  async getHolidays(
    year?: number,
    month?: number
  ): Promise<HolidaysResponse> {
    return this.get<HolidaysResponse>('/util/holidays/', {
      year,
      month,
    }, false);
  }

  /**
   * 음력 변환
   */
  async convertLunar(
    year: number,
    month: number,
    day: number
  ): Promise<LunarResponse> {
    return this.get<LunarResponse>('/util/lunar/', {
      year,
      month,
      day,
    }, false);
  }

  /**
   * IP 주소 조회
   */
  async getIp(): Promise<IpResponse> {
    return this.get<IpResponse>('/util/ip/', undefined, false);
  }
}

