'use client';

import { useState } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/bmi_calculator.css';

export default function BMICalculatorPage() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [bmiValue, setBmiValue] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');
  const [bmiCategoryColor, setBmiCategoryColor] = useState('');
  const [bmiPosition, setBmiPosition] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const heightM = parseFloat(height) / 100; // cm → m
    const weightNum = parseFloat(weight);
    
    if (!(heightM > 0) || !(weightNum > 0)) {
      alert('키와 몸무게를 올바르게 입력해주세요.');
      return;
    }
    
    const bmi = parseFloat((weightNum / (heightM * heightM)).toFixed(2));
    
    let category = '';
    let categoryColor = '';
    if (bmi < 18.5) {
      category = '저체중';
      categoryColor = 'text-green-600';
    } else if (bmi >= 18.5 && bmi < 24.9) {
      category = '정상 체중';
      categoryColor = 'text-blue-600';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = '과체중';
      categoryColor = 'text-purple-600';
    } else if (bmi >= 30 && bmi < 34.9) {
      category = '1단계 비만';
      categoryColor = 'text-red-500';
    } else if (bmi >= 35 && bmi < 39.9) {
      category = '2단계 비만';
      categoryColor = 'text-red-600';
    } else {
      category = '3단계 비만';
      categoryColor = 'text-red-700';
    }
    
    setBmiValue(bmi);
    setBmiCategory(category);
    setBmiCategoryColor(categoryColor);
    
    // BMI 위치 계산 (0-50 범위에서의 위치)
    const position = Math.min(Math.max((bmi / 50) * 100, 0), 100);
    setBmiPosition(position);
    
    setShowResult(true);
  };

  return (
    <>
      <Navbar />
      <section className="py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">BMI 계산기</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form id="bmiForm" className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">키 (cm)</label>
                <input 
                  type="number" 
                  id="height" 
                  name="height" 
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#373e56]" 
                  placeholder="예: 170"
                />
              </div>
              
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">몸무게 (kg)</label>
                <input 
                  type="number" 
                  id="weight" 
                  name="weight" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#373e56]" 
                  placeholder="예: 65"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-[#373e56] text-white py-2 px-4 rounded-md hover:bg-[#2a3142] transition-colors"
              >
                BMI 계산하기
              </button>
            </form>
            
            <div id="result" className={`mt-6 ${showResult ? '' : 'hidden'} w-full max-w-sm mx-auto`}>
              <div className="bg-[#373e56] text-white text-center rounded-t-md py-2">결과</div>
              <div className="bg-white border rounded-b-md px-6 py-4">
                {/* BMI 결과 텍스트 */}
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div id="bmiCategory" className={`${bmiCategoryColor} font-semibold`}>{bmiCategory || '-'}</div>
                  <div id="bmiValue" className="text-[#373e56] text-xl font-bold">{bmiValue || '-'}</div>
                </div>
                
                {/* BMI 위치 표시기 */}
                <div className="relative">
                  {/* BMI 범위 막대 */}
                  <div className="h-8 bg-gray-200 rounded-lg overflow-hidden relative">
                    {/* 저체중 (0-18.5) */}
                    <div className="absolute left-0 top-0 h-full bg-green-500" style={{ width: '37%' }}></div>
                    {/* 정상체중 (18.5-24.9) */}
                    <div className="absolute left-0 top-0 h-full bg-blue-400" style={{ width: '12.8%', left: '37%' }}></div>
                    {/* 과체중 (25-29.9) */}
                    <div className="absolute left-0 top-0 h-full bg-purple-500" style={{ width: '9.8%', left: '49.8%' }}></div>
                    {/* 1단계 비만 (30-34.9) */}
                    <div className="absolute left-0 top-0 h-full bg-red-500" style={{ width: '9.8%', left: '59.6%' }}></div>
                    {/* 2단계 비만 (35-39.9) */}
                    <div className="absolute left-0 top-0 h-full bg-red-600" style={{ width: '9.8%', left: '69.4%' }}></div>
                    {/* 3단계 비만 (40-50) */}
                    <div className="absolute left-0 top-0 h-full bg-red-800" style={{ width: '20%', left: '79.2%' }}></div>
                    
                    {/* 현재 BMI 위치 표시 */}
                    <div 
                      id="currentBMIPosition" 
                      className="absolute top-0 h-full w-1 bg-red-500 transform -translate-x-1/2" 
                      style={{ left: `${bmiPosition}%` }}
                    ></div>
                  </div>
                  
                  {/* BMI 값 라벨 */}
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                  </div>
                  
                  {/* 범위 라벨 */}
                  <div className="relative text-xs text-gray-500 mt-1">
                    <span className="absolute text-green-600" style={{ left: '0%' }}>저체중</span>
                    <span className="absolute text-blue-500" style={{ left: '25%' }}>정상체중</span>
                    <span className="absolute text-purple-600" style={{ left: '55%' }}>과체중</span>
                    <span className="absolute text-red-500" style={{ left: '75%' }}>비만</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-[#373e56] mb-4">BMI 분류</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">저체중</span>
                <span className="text-gray-600">18.5 미만</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-medium">정상 체중</span>
                <span className="text-gray-600">18.5 ~ 24.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600 font-medium">과체중</span>
                <span className="text-gray-600">25.0 ~ 29.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 font-medium">비만</span>
                <span className="text-gray-600">30.0 이상</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-500 font-medium">1단계 비만</span>
                <span className="text-gray-600">30.0 ~ 34.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 font-medium">2단계 비만</span>
                <span className="text-gray-600">35.0 ~ 39.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700 font-medium">3단계 비만 (고도비만)</span>
                <span className="text-gray-600">40.0 이상</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

