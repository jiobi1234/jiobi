'use client';

import { useState } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';

export default function HeartratePage() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [restingHeartRate, setRestingHeartRate] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [maxHeartRate, setMaxHeartRate] = useState(0);
  const [targetHeartRate, setTargetHeartRate] = useState('');
  const [ageError, setAgeError] = useState(false);
  const [restingHeartRateError, setRestingHeartRateError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ageNum = parseInt(age);
    const restingNum = parseInt(restingHeartRate);
    
    if (!ageNum || !gender || !restingNum) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    if (ageNum < 1 || ageNum > 120) {
      alert('나이는 1-120 사이의 값이어야 합니다.');
      return;
    }
    
    if (restingNum < 40 || restingNum > 200) {
      alert('안정시 심박수는 40-200 사이의 값이어야 합니다.');
      return;
    }
    
    // 최대 심박수 계산 (카르보넨 공식)
    let maxHR;
    if (gender === 'male') {
      maxHR = 220 - ageNum; // 남성: 220 - 나이
    } else {
      maxHR = 226 - ageNum; // 여성: 226 - 나이
    }
    
    // 목표 심박수 범위 계산 (보통 강도 60-70%)
    const targetMin = Math.round((maxHR - restingNum) * 0.6 + restingNum);
    const targetMax = Math.round((maxHR - restingNum) * 0.7 + restingNum);
    
    setMaxHeartRate(maxHR);
    setTargetHeartRate(`${targetMin} - ${targetMax} bpm`);
    setShowResults(true);
    
    // 결과로 스크롤
    setTimeout(() => {
      const resultsDiv = document.getElementById('results');
      if (resultsDiv) {
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <Navbar />
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">심박수 계산기</h1>
          
          {/* 심박수 계산기 폼 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2">
            
            <form id="heartRateForm" className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
              {/* 나이 입력 */}
              <div className="flex items-center space-x-4">
                <label htmlFor="age" className="text-lg font-semibold w-32 text-left">나이</label>
                <input 
                  type="number" 
                  id="age" 
                  name="age" 
                  min="1" 
                  max="120" 
                  value={age}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setAge(e.target.value);
                    if (value < 1 || value > 120) {
                      setAgeError(true);
                    } else {
                      setAgeError(false);
                    }
                  }}
                  className={`border rounded-lg px-4 py-2 text-lg focus:outline-none focus:border-[#373e56] ${ageError ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              
              {/* 성별 선택 */}
              <div className="flex items-center space-x-4">
                <label className="text-lg font-semibold w-32 text-left">성별</label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male" 
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2 text-[#373e56] focus:ring-[#373e56]"
                    />
                    <span className="text-lg">남자</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2 text-[#373e56] focus:ring-[#373e56]"
                    />
                    <span className="text-lg">여자</span>
                  </label>
                </div>
              </div>
              
              {/* 안정시 심박수 입력 */}
              <div className="flex items-center space-x-4">
                <label htmlFor="restingHeartRate" className="text-lg font-semibold w-32 text-left">안정시 심박수</label>
                <input 
                  type="number" 
                  id="restingHeartRate" 
                  name="restingHeartRate" 
                  min="40" 
                  max="200" 
                  value={restingHeartRate}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setRestingHeartRate(e.target.value);
                    if (value < 40 || value > 200) {
                      setRestingHeartRateError(true);
                    } else {
                      setRestingHeartRateError(false);
                    }
                  }}
                  className={`border rounded-lg px-4 py-2 text-lg focus:outline-none focus:border-[#373e56] ${restingHeartRateError ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              
              {/* 계산하기 버튼 */}
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  className="bg-[#373e56] hover:bg-[#2a3142] text-white font-medium py-3 px-8 rounded-lg text-lg transition-colors"
                >
                  계산하기
                </button>
              </div>
            </form>
            
            {/* 결과 표시 영역 */}
            <div id="results" className={`mt-8 ${showResults ? '' : 'hidden'}`}>
              <h3 className="text-xl font-bold text-center mb-4">계산 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-2">최대 심박수</h4>
                  <p id="maxHeartRate" className="text-2xl font-bold text-[#373e56]">{maxHeartRate || '-'} bpm</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-2">목표 심박수 범위</h4>
                  <p id="targetHeartRate" className="text-lg text-[#373e56]">{targetHeartRate || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 운동 강도 설명 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-4">운동 강도 설명</h2>
            <p className="text-center text-gray-600 mb-2">측정 방법은 카르보넨 공식을 따릅니다.</p>
            <p className="text-center text-gray-600 mb-6">여성의 경우 [226 - 나이] 공식을 적용합니다.</p>
            
            <div className="space-y-3">
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-1">가벼운 강도 (최대 심박수 기준 50-60%)</h3>
                <p className="text-gray-700">워밍업 또는 회복 운동에 적합합니다.</p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-1">보통 강도 (최대 심박수 기준 60-70%)</h3>
                <p className="text-gray-700">지구력과 지방 연소를 향상시키는 데 도움이 됩니다.</p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-1">상당한 강도 (최대 심박수 기준 70-80%)</h3>
                <p className="text-gray-700">심혈관 건강을 개선하고 지구력을 높이는 데 이상적입니다.</p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-1">고강도 (최대 심박수 기준 80-90%)</h3>
                <p className="text-gray-700">운동 능력과 최대 운동 성능을 향상시키는 데 도움이 됩니다.</p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-1">매우 고강도 (최대 심박수 기준 90-100%)</h3>
                <p className="text-gray-700">고급 운동 선수들이 사용하는 강도로, 짧은 기간 동안 최대 성능을 발휘하는 데 사용됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

