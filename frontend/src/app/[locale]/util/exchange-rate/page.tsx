'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { API_CONFIG } from '../../../../lib/api-client/config';

interface Currency {
  code: string;
  apiCode: string;
  name: string;
  flag: string;
  rate: number;
}

export default function ExchangeRatePage() {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [exchangeDate, setExchangeDate] = useState('환율 정보를 불러오는 중...');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  
  const [currencyOne, setCurrencyOne] = useState('USD');
  const [currencyTwo, setCurrencyTwo] = useState('KRW');
  const [amountOne, setAmountOne] = useState('1');
  const [amountTwo, setAmountTwo] = useState('1');
  
  const [currencyOneDropdownOpen, setCurrencyOneDropdownOpen] = useState(false);
  const [currencyTwoDropdownOpen, setCurrencyTwoDropdownOpen] = useState(false);
  
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const currencyMapping: Record<string, { name: string; flag: string; code?: string }> = {
    'USD': { name: '미국', flag: 'https://flagcdn.com/us.svg' },
    'KRW': { name: '한국', flag: 'https://flagcdn.com/kr.svg' },
    'EUR': { name: '유럽연합', flag: 'https://flagcdn.com/eu.svg' },
    'JPY(100)': { name: '일본', flag: 'https://flagcdn.com/jp.svg', code: 'JPY' },
    'GBP': { name: '영국', flag: 'https://flagcdn.com/gb.svg' },
    'CNH': { name: '중국', flag: 'https://flagcdn.com/cn.svg', code: 'CNY' },
    'CAD': { name: '캐나다', flag: 'https://flagcdn.com/ca.svg' },
    'AUD': { name: '호주', flag: 'https://flagcdn.com/au.svg' },
    'CHF': { name: '스위스', flag: 'https://flagcdn.com/ch.svg' },
    'SGD': { name: '싱가포르', flag: 'https://flagcdn.com/sg.svg' },
    'HKD': { name: '홍콩', flag: 'https://flagcdn.com/hk.svg' },
    'THB': { name: '태국', flag: 'https://flagcdn.com/th.svg' },
    'MYR': { name: '말레이시아', flag: 'https://flagcdn.com/my.svg' },
    'IDR(100)': { name: '인도네시아', flag: 'https://flagcdn.com/id.svg', code: 'IDR' },
    'SAR': { name: '사우디아라비아', flag: 'https://flagcdn.com/sa.svg' },
    'AED': { name: '아랍에미리트', flag: 'https://flagcdn.com/ae.svg' },
    'NZD': { name: '뉴질랜드', flag: 'https://flagcdn.com/nz.svg' },
    'SEK': { name: '스웨덴', flag: 'https://flagcdn.com/se.svg' },
    'NOK': { name: '노르웨이', flag: 'https://flagcdn.com/no.svg' },
    'DKK': { name: '덴마크', flag: 'https://flagcdn.com/dk.svg' },
    'BHD': { name: '바레인', flag: 'https://flagcdn.com/bh.svg' },
    'BND': { name: '브루나이', flag: 'https://flagcdn.com/bn.svg' },
    'KWD': { name: '쿠웨이트', flag: 'https://flagcdn.com/kw.svg' }
  };

  useEffect(() => {
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (exchangeRates && typeof exchangeRates === 'object' && Object.keys(exchangeRates).length > 0) {
      createCurrencyOptions();
      // 초기 계산 (미국 1달러 -> 한국 원화)
      calculate(true);
    }
  }, [exchangeRates]);

  const loadExchangeRates = async () => {
    try {
      const response = await fetch(`${API_CONFIG.apiPrefix}/exchange-rate/`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // 안전장치: rates가 없거나 null인 경우 빈 객체로 설정
      if (data.rates && typeof data.rates === 'object') {
        setExchangeRates(data.rates);
      } else {
        setExchangeRates({});
        console.warn('환율 데이터 형식이 올바르지 않습니다:', data);
      }
      
      if (data.date) {
        const date = data.date;
        const formattedDate = `${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`;
        setExchangeDate(`${formattedDate} 기준 환율 정보`);
      } else {
        setExchangeDate('환율 정보');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('환율 데이터 로드 실패:', error);
      setExchangeDate('환율 정보를 불러올 수 없습니다.');
      setExchangeRates({}); // 빈 객체로 설정하여 에러 방지
      setIsLoading(false);
    }
  };

  const createCurrencyOptions = () => {
    const currencyList: Currency[] = [];
    
    if (!exchangeRates || typeof exchangeRates !== 'object') {
      return;
    }
    
    for (const [apiCode, rate] of Object.entries(exchangeRates)) {
      if (currencyMapping[apiCode]) {
        const mapping = currencyMapping[apiCode];
        currencyList.push({
          code: mapping.code || apiCode,
          apiCode: apiCode,
          name: mapping.name,
          flag: mapping.flag,
          rate: rate
        });
      }
    }
    
    // 한국 원을 맨 위로 이동
    const krwIndex = currencyList.findIndex(c => c.code === 'KRW');
    if (krwIndex > -1) {
      const krw = currencyList.splice(krwIndex, 1)[0];
      currencyList.unshift(krw);
    }
    
    // 미국 달러를 두 번째로 이동
    const usdIndex = currencyList.findIndex(c => c.code === 'USD');
    if (usdIndex > -1) {
      const usd = currencyList.splice(usdIndex, 1)[0];
      currencyList.splice(1, 0, usd);
    }
    
    setCurrencies(currencyList);
  };

  const calculate = (fromTop: boolean) => {
    if (isLoading || Object.keys(exchangeRates).length === 0) {
      return;
    }

    const rate1 = exchangeRates[currencyOne] || 1;
    const rate2 = exchangeRates[currencyTwo] || 1;

    if (fromTop) {
      const amount = parseFloat(amountOne) || 0;
      const krwAmount = amount * rate1;
      const convertedAmount = krwAmount / rate2;
      
      if (currencyTwo === 'JPY(100)' || currencyTwo === 'IDR(100)') {
        setAmountTwo(Math.round(convertedAmount).toString());
      } else {
        setAmountTwo(convertedAmount.toFixed(2));
      }
    } else {
      const amount = parseFloat(amountTwo) || 0;
      const krwAmount = amount * rate2;
      const convertedAmount = krwAmount / rate1;
      
      if (currencyOne === 'JPY(100)' || currencyOne === 'IDR(100)') {
        setAmountOne(Math.round(convertedAmount).toString());
      } else {
        setAmountOne(convertedAmount.toFixed(2));
      }
    }
  };


  const toggleExchangeDetails = () => {
    setIsDetailsVisible(!isDetailsVisible);
  };

  const getCurrencyInfo = (apiCode: string) => {
    return currencies.find(c => c.apiCode === apiCode);
  };

  const createExchangeRatesList = () => {
    if (!exchangeRates || typeof exchangeRates !== 'object') {
      return [];
    }
    
    const sortedRates = Object.entries(exchangeRates)
      .filter(([code]) => currencyMapping[code])
      .sort((a, b) => a[1] - b[1]);

    return sortedRates.map(([code, rate]) => {
      const mapping = currencyMapping[code];
      const displayRate = code === 'JPY(100)' || code === 'IDR(100)' 
        ? `${rate.toFixed(2)}원 (100단위)`
        : `${rate.toFixed(2)}원`;
      
      return (
        <div key={code} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-3">{mapping.flag}</span>
            <span className="font-medium text-sm">{mapping.name}</span>
          </div>
          <span className="text-blue-600 font-semibold text-sm">{displayRate}</span>
        </div>
      );
    });
  };

  const currencyOneInfo = getCurrencyInfo(currencyOne);
  const currencyTwoInfo = getCurrencyInfo(currencyTwo);

  return (
    <>
      <Navbar />
      <section className="py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-10">환율 계산기</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* 상단 통화 입력 */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="flex-1">
                <input 
                  type="number" 
                  value={amountOne}
                  onChange={(e) => {
                    setAmountOne(e.target.value);
                    calculate(true);
                  }}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56] text-xl" 
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'textfield', appearance: 'textfield' }}
                />
              </div>
              <div className="currency-select-wrapper relative">
                <div 
                  className="currency-selected bg-[#373e56] text-white px-6 py-4 rounded-lg w-[280px] cursor-pointer flex items-center"
                  onClick={() => setCurrencyOneDropdownOpen(!currencyOneDropdownOpen)}
                >
                  {currencyOneInfo && (
                    <>
                      <img src={currencyOneInfo.flag} alt={currencyOneInfo.name} className="w-5 h-5 inline mr-3 flex-shrink-0" />
                      <span className="truncate">{currencyOneInfo.name} ({currencyOneInfo.code})</span>
                    </>
                  )}
                </div>
                {currencyOneDropdownOpen && (
                  <div className="currency-dropdown absolute bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10 w-[280px] max-h-[320px] overflow-y-auto">
                    {currencies.map((currency) => (
                      <div
                        key={currency.apiCode}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center h-10"
                        onClick={() => {
                          setCurrencyOne(currency.apiCode);
                          setCurrencyOneDropdownOpen(false);
                          calculate(true);
                        }}
                      >
                        <img src={currency.flag} alt={currency.name} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{currency.name} ({currency.code})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 중앙 구분선 */}
            <div className="flex justify-center mb-8">
              <div className="text-5xl font-bold text-[#373e56]">||</div>
            </div>

            {/* 하단 통화 결과 */}
            <div className="flex items-center space-x-6">
              <div className="flex-1">
                <input 
                  type="number" 
                  value={amountTwo}
                  onChange={(e) => {
                    setAmountTwo(e.target.value);
                    calculate(false);
                  }}
                  className="w-full px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56] text-xl" 
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'textfield', appearance: 'textfield' }}
                />
              </div>
              <div className="currency-select-wrapper relative">
                <div 
                  className="currency-selected bg-[#373e56] text-white px-6 py-4 rounded-lg w-[280px] cursor-pointer flex items-center"
                  onClick={() => setCurrencyTwoDropdownOpen(!currencyTwoDropdownOpen)}
                >
                  {currencyTwoInfo && (
                    <>
                      <img src={currencyTwoInfo.flag} alt={currencyTwoInfo.name} className="w-5 h-5 inline mr-3 flex-shrink-0" />
                      <span className="truncate">{currencyTwoInfo.name} ({currencyTwoInfo.code})</span>
                    </>
                  )}
                </div>
                {currencyTwoDropdownOpen && (
                  <div className="currency-dropdown absolute bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10 w-[280px] max-h-[320px] overflow-y-auto">
                    {currencies.map((currency) => (
                      <div
                        key={currency.apiCode}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center h-10"
                        onClick={() => {
                          setCurrencyTwo(currency.apiCode);
                          setCurrencyTwoDropdownOpen(false);
                          calculate(false);
                        }}
                      >
                        <img src={currency.flag} alt={currency.name} className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{currency.name} ({currency.code})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 환율 정보 섹션 */}
          <div className="mt-10 bg-white rounded-xl shadow-lg p-8">
            <div 
              className="text-center cursor-pointer" 
              onClick={toggleExchangeDetails}
            >
              <div className="text-base text-blue-600 hover:text-blue-800 transition-colors">
                <span>{exchangeDate}</span>
                <span className="ml-2 text-sm">{isDetailsVisible ? '▲' : '▼'}</span>
              </div>
            </div>
            
            {/* 상세 환율 정보 */}
            {isDetailsVisible && (
              <div className="mt-6">
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">전체 환율 정보</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {createExchangeRatesList()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
      
      <style jsx>{`
        .currency-select-wrapper {
          position: relative;
        }
        .currency-dropdown {
          max-height: 320px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .currency-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .currency-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .currency-dropdown::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .currency-dropdown::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
}

