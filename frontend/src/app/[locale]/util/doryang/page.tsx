'use client';

import { useState } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';

export default function DoryangPage() {
  const [activeTab, setActiveTab] = useState('length');
  
  // 길이 변환
  const [lengthFromUnit, setLengthFromUnit] = useState('cm');
  const [lengthToUnit, setLengthToUnit] = useState('inch');
  const [lengthInput, setLengthInput] = useState('5');
  const [lengthResult, setLengthResult] = useState('');
  
  // 넓이 변환
  const [areaFromUnit, setAreaFromUnit] = useState('cm2');
  const [areaToUnit, setAreaToUnit] = useState('m2');
  const [areaInput, setAreaInput] = useState('1');
  const [areaResult, setAreaResult] = useState('');
  
  // 무게 변환
  const [weightFromUnit, setWeightFromUnit] = useState('g');
  const [weightToUnit, setWeightToUnit] = useState('kg');
  const [weightInput, setWeightInput] = useState('1000');
  const [weightResult, setWeightResult] = useState('');
  
  // 부피 변환
  const [volumeFromUnit, setVolumeFromUnit] = useState('l');
  const [volumeToUnit, setVolumeToUnit] = useState('m3');
  const [volumeInput, setVolumeInput] = useState('1');
  const [volumeResult, setVolumeResult] = useState('');

  const conversionRates = {
    length: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      inch: 0.0254,
      feet: 0.3048,
      yard: 0.9144,
      mile: 1609.344
    },
    area: {
      mm2: 0.000001,
      cm2: 0.0001,
      m2: 1,
      km2: 1000000,
      inch2: 0.00064516,
      feet2: 0.092903,
      yard2: 0.836127,
      acre: 4046.86
    },
    weight: {
      mg: 0.000001,
      g: 0.001,
      kg: 1,
      ton: 1000,
      ounce: 0.0283495,
      pound: 0.453592
    },
    volume: {
      ml: 0.001,              // 1 ml = 0.001 m³
      l: 0.001,               // 1 l = 0.001 m³
      m3: 1,                  // 1 m³ = 1 m³
      gal: 0.00378541,        // 1 gal = 0.00378541 m³
      qt: 0.000946353,        // 1 qt = 0.000946353 m³
      pt: 0.000473176         // 1 pt = 0.000473176 m³
    }
  };

  const unitNames = {
    length: {
      mm: 'mm (밀리미터)',
      cm: 'cm (센티미터)',
      m: 'm (미터)',
      km: 'km (킬로미터)',
      inch: 'inch (인치)',
      feet: 'feet (피트)',
      yard: 'yard (야드)',
      mile: 'mile (마일)'
    },
    area: {
      mm2: 'mm² (제곱밀리미터)',
      cm2: 'cm² (제곱센티미터)',
      m2: 'm² (제곱미터)',
      km2: 'km² (제곱킬로미터)',
      inch2: 'inch² (제곱인치)',
      feet2: 'feet² (제곱피트)',
      yard2: 'yard² (제곱야드)',
      acre: 'acre (에이커)'
    },
    weight: {
      mg: 'mg (밀리그램)',
      g: 'g (그램)',
      kg: 'kg (킬로그램)',
      ton: 'ton (톤)',
      ounce: 'ounce (온스)',
      pound: 'pound (파운드)'
    },
    volume: {
      ml: 'ml (밀리리터)',
      l: 'l (리터)',
      m3: 'm³ (세제곱미터)',
      gal: 'gal (갤런)',
      qt: 'qt (쿼트)',
      pt: 'pt (파인트)'
    }
  };

  const convertLength = () => {
    const inputValue = parseFloat(lengthInput);
    const fromRate = conversionRates.length[lengthFromUnit as keyof typeof conversionRates.length];
    const toRate = conversionRates.length[lengthToUnit as keyof typeof conversionRates.length];
    const meters = inputValue * fromRate;
    const result = meters / toRate;
    setLengthResult(result.toFixed(4));
  };

  const convertArea = () => {
    const inputValue = parseFloat(areaInput);
    const fromRate = conversionRates.area[areaFromUnit as keyof typeof conversionRates.area];
    const toRate = conversionRates.area[areaToUnit as keyof typeof conversionRates.area];
    const squareMeters = inputValue * fromRate;
    const result = squareMeters / toRate;
    setAreaResult(result.toFixed(4));
  };

  const convertWeight = () => {
    const inputValue = parseFloat(weightInput);
    const fromRate = conversionRates.weight[weightFromUnit as keyof typeof conversionRates.weight];
    const toRate = conversionRates.weight[weightToUnit as keyof typeof conversionRates.weight];
    const kilograms = inputValue * fromRate;
    const result = kilograms / toRate;
    setWeightResult(result.toFixed(4));
  };

  const convertVolume = () => {
    const inputValue = parseFloat(volumeInput);
    const fromRate = conversionRates.volume[volumeFromUnit as keyof typeof conversionRates.volume];
    const toRate = conversionRates.volume[volumeToUnit as keyof typeof conversionRates.volume];
    const cubicMeters = inputValue * fromRate;
    const result = cubicMeters / toRate;
    setVolumeResult(result.toFixed(4));
  };

  return (
    <>
      <Navbar />
      <section className="py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">도량형 계산기</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* 카테고리 탭 */}
            <div className="flex justify-center space-x-2 mb-6">
              <button 
                onClick={() => setActiveTab('length')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'length' 
                    ? 'bg-[#373e56] text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                길이
              </button>
              <button 
                onClick={() => setActiveTab('area')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'area' 
                    ? 'bg-[#373e56] text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                넓이
              </button>
              <button 
                onClick={() => setActiveTab('weight')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'weight' 
                    ? 'bg-[#373e56] text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                무게
              </button>
              <button 
                onClick={() => setActiveTab('volume')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'volume' 
                    ? 'bg-[#373e56] text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                부피
              </button>
            </div>

            {/* 길이 변환 섹션 */}
            {activeTab === 'length' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">현재 단위</label>
                    <select 
                      value={lengthFromUnit}
                      onChange={(e) => setLengthFromUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mm">밀리미터 (mm)</option>
                      <option value="cm">센티미터 (cm)</option>
                      <option value="m">미터 (m)</option>
                      <option value="km">킬로미터 (km)</option>
                      <option value="inch">인치 (inch)</option>
                      <option value="feet">피트 (feet)</option>
                      <option value="yard">야드 (yard)</option>
                      <option value="mile">마일 (mile)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 단위</label>
                    <select 
                      value={lengthToUnit}
                      onChange={(e) => setLengthToUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mm">밀리미터 (mm)</option>
                      <option value="cm">센티미터 (cm)</option>
                      <option value="m">미터 (m)</option>
                      <option value="km">킬로미터 (km)</option>
                      <option value="inch">인치 (inch)</option>
                      <option value="feet">피트 (feet)</option>
                      <option value="yard">야드 (yard)</option>
                      <option value="mile">마일 (mile)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 값</label>
                  <input 
                    type="number" 
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                  />
                </div>
                
                <div>
                  <button 
                    onClick={convertLength}
                    className="w-full bg-[#373e56] text-white py-2 px-8 rounded-lg hover:bg-[#2a3142] transition-colors"
                  >
                    계산하기
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">결과값</label>
                  <div className="flex items-center justify-center space-x-2">
                    <input 
                      type="text" 
                      value={lengthResult}
                      readOnly 
                      className="w-52 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="text-sm text-gray-600 font-medium min-w-[120px]">
                      {unitNames.length[lengthToUnit as keyof typeof unitNames.length]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 넓이 변환 섹션 */}
            {activeTab === 'area' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">현재 단위</label>
                    <select 
                      value={areaFromUnit}
                      onChange={(e) => setAreaFromUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mm2">제곱밀리미터 (mm²)</option>
                      <option value="cm2">제곱센티미터 (cm²)</option>
                      <option value="m2">제곱미터 (m²)</option>
                      <option value="km2">제곱킬로미터 (km²)</option>
                      <option value="inch2">제곱인치 (inch²)</option>
                      <option value="feet2">제곱피트 (feet²)</option>
                      <option value="yard2">제곱야드 (yard²)</option>
                      <option value="acre">에이커 (acre)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 단위</label>
                    <select 
                      value={areaToUnit}
                      onChange={(e) => setAreaToUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mm2">제곱밀리미터 (mm²)</option>
                      <option value="cm2">제곱센티미터 (cm²)</option>
                      <option value="m2">제곱미터 (m²)</option>
                      <option value="km2">제곱킬로미터 (km²)</option>
                      <option value="inch2">제곱인치 (inch²)</option>
                      <option value="feet2">제곱피트 (feet²)</option>
                      <option value="yard2">제곱야드 (yard²)</option>
                      <option value="acre">에이커 (acre)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 값</label>
                  <input 
                    type="number" 
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                  />
                </div>
                
                <div>
                  <button 
                    onClick={convertArea}
                    className="w-full bg-[#373e56] text-white py-2 px-8 rounded-lg hover:bg-[#2a3142] transition-colors"
                  >
                    계산하기
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">결과값</label>
                  <div className="flex items-center justify-center space-x-2">
                    <input 
                      type="text" 
                      value={areaResult}
                      readOnly 
                      className="w-52 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="text-sm text-gray-600 font-medium min-w-[120px]">
                      {unitNames.area[areaToUnit as keyof typeof unitNames.area]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 무게 변환 섹션 */}
            {activeTab === 'weight' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">현재 단위</label>
                    <select 
                      value={weightFromUnit}
                      onChange={(e) => setWeightFromUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mg">밀리그램 (mg)</option>
                      <option value="g">그램 (g)</option>
                      <option value="kg">킬로그램 (kg)</option>
                      <option value="ton">톤 (ton)</option>
                      <option value="ounce">온스 (ounce)</option>
                      <option value="pound">파운드 (pound)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 단위</label>
                    <select 
                      value={weightToUnit}
                      onChange={(e) => setWeightToUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="mg">밀리그램 (mg)</option>
                      <option value="g">그램 (g)</option>
                      <option value="kg">킬로그램 (kg)</option>
                      <option value="ton">톤 (ton)</option>
                      <option value="ounce">온스 (ounce)</option>
                      <option value="pound">파운드 (pound)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 값</label>
                  <input 
                    type="number" 
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                  />
                </div>
                
                <div>
                  <button 
                    onClick={convertWeight}
                    className="w-full bg-[#373e56] text-white py-2 px-8 rounded-lg hover:bg-[#2a3142] transition-colors"
                  >
                    계산하기
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">결과값</label>
                  <div className="flex items-center justify-center space-x-2">
                    <input 
                      type="text" 
                      value={weightResult}
                      readOnly 
                      className="w-52 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="text-sm text-gray-600 font-medium min-w-[120px]">
                      {unitNames.weight[weightToUnit as keyof typeof unitNames.weight]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 부피 변환 섹션 */}
            {activeTab === 'volume' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">현재 단위</label>
                    <select 
                      value={volumeFromUnit}
                      onChange={(e) => setVolumeFromUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="ml">밀리리터 (ml)</option>
                      <option value="l">리터 (l)</option>
                      <option value="m3">세제곱미터 (m³)</option>
                      <option value="gal">갤런 (gal)</option>
                      <option value="qt">쿼트 (qt)</option>
                      <option value="pt">파인트 (pt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 단위</label>
                    <select 
                      value={volumeToUnit}
                      onChange={(e) => setVolumeToUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                    >
                      <option value="ml">밀리리터 (ml)</option>
                      <option value="l">리터 (l)</option>
                      <option value="m3">세제곱미터 (m³)</option>
                      <option value="gal">갤런 (gal)</option>
                      <option value="qt">쿼트 (qt)</option>
                      <option value="pt">파인트 (pt)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">변환할 값</label>
                  <input 
                    type="number" 
                    value={volumeInput}
                    onChange={(e) => setVolumeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#373e56]"
                  />
                </div>
                
                <div>
                  <button 
                    onClick={convertVolume}
                    className="w-full bg-[#373e56] text-white py-2 px-8 rounded-lg hover:bg-[#2a3142] transition-colors"
                  >
                    계산하기
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">결과값</label>
                  <div className="flex items-center justify-center space-x-2">
                    <input 
                      type="text" 
                      value={volumeResult}
                      readOnly 
                      className="w-52 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="text-sm text-gray-600 font-medium min-w-[120px]">
                      {unitNames.volume[volumeToUnit as keyof typeof unitNames.volume]}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

