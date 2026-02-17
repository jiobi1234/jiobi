'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/calendar.css';
import { API_CONFIG } from '../../../../lib/api-client/config';

interface Holiday {
  name: string;
  isHoliday: boolean;
}

interface LunarDate {
  [key: number]: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<number, Holiday>>({});
  const [lunarDates, setLunarDates] = useState<LunarDate>({});
  const [showLunar, setShowLunar] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  useEffect(() => {
    fetchHolidaysAndLunar(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  const fetchHolidaysAndLunar = async (year: number, month: number) => {
    setLoading(true);
    const monthStr = String(month + 1).padStart(2, '0');
    
    // 공휴일 API 호출
    try {
      const response = await fetch(`${API_CONFIG.apiPrefix}/holidays/?year=${year}&month=${monthStr}`);
      const data = await response.json();
      
      const newHolidays: Record<number, Holiday> = {};
      if (data.response && data.response.body && data.response.body.items && data.response.body.items.item) {
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
        
        items.forEach((item: any) => {
          const day = parseInt(item.locdate.toString().slice(-2));
          if (item.isHoliday === 'Y') {
            newHolidays[day] = {
              name: item.dateName,
              isHoliday: true
            };
          } else if (item.isHoliday === 'N') {
            newHolidays[day] = {
              name: item.dateName,
              isHoliday: false
            };
          }
        });
      }
      setHolidays(newHolidays);
    } catch (error) {
      console.error('공휴일 정보를 가져오는데 실패했습니다:', error);
      setHolidays({});
    }
    
    // 음력 API 호출
    try {
      const lunarResponse = await fetch(`${API_CONFIG.apiPrefix}/lunar/?year=${year}&month=${monthStr}`);
      const lunarData = await lunarResponse.json();
      
      const newLunarDates: LunarDate = {};
      if (lunarData.response && lunarData.response.body && lunarData.response.body.items && lunarData.response.body.items.item) {
        const lunarItems = Array.isArray(lunarData.response.body.items.item) 
          ? lunarData.response.body.items.item 
          : [lunarData.response.body.items.item];
        
        lunarItems.forEach((item: any) => {
          const day = parseInt(item.solDay);
          if (item.lunMonth && item.lunDay) {
            newLunarDates[day] = `음 ${item.lunMonth}.${item.lunDay}`;
          }
        });
      }
      setLunarDates(newLunarDates);
    } catch (error) {
      console.error('음력 정보를 가져오는데 실패했습니다:', error);
      setLunarDates({});
    }
    
    setLoading(false);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[currentMonthIndex];

    const days = [];
    
    // 빈 칸 추가 (첫 번째 날짜 전)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day"></div>);
    }
    
    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const holiday = holidays[day];
      const lunarDate = lunarDates[day];
      const isSunday = (firstDay + day - 1) % 7 === 0;
      const isSaturday = (firstDay + day - 1) % 7 === 6;
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${holiday?.isHoliday ? 'holiday' : ''}`}
        >
          <div className="day-number">{day}</div>
          {holiday && (
            <div className={`holiday-name ${holiday.isHoliday ? 'holiday-text' : 'commemoration-text'}`}>
              {holiday.name}
            </div>
          )}
          {showLunar && lunarDate && (
            <div className="lunar-date">{lunarDate}</div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <>
      <Navbar />
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">달력</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col items-center mb-6">
              {/* 상단 버튼들 */}
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={goToToday}
                  className="bg-[#373e56] hover:bg-[#2a3142] text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  오늘
                </button>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showLunar}
                    onChange={(e) => setShowLunar(e.target.checked)}
                    className="w-4 h-4 text-[#373e56] bg-gray-100 border-gray-300 rounded focus:ring-[#373e56] focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">음력</span>
                </label>
              </div>
              
              {/* 월 네비게이션 */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={prevMonth}
                  className="text-2xl hover:text-[#373e56]"
                >
                  ‹
                </button>
                <div className="flex items-center">
                  <div className="bg-[#373e56] text-white px-4 py-2 rounded-lg mr-3 text-lg font-bold">
                    {String(currentMonthIndex + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{currentYear}</div>
                    <div className="text-lg text-gray-600">
                      {['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'][currentMonthIndex]}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={nextMonth}
                  className="text-2xl hover:text-[#373e56]"
                >
                  ›
                </button>
              </div>
            </div>
            
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-0 mb-4">
              <div className="text-center font-semibold py-2 bg-white text-[#ef4343]">일 SUN</div>
              <div className="text-center font-semibold py-2 bg-white text-[#373e56]">월 MON</div>
              <div className="text-center font-semibold py-2 bg-white text-[#373e56]">화 TUE</div>
              <div className="text-center font-semibold py-2 bg-white text-[#373e56]">수 WED</div>
              <div className="text-center font-semibold py-2 bg-white text-[#373e56]">목 THU</div>
              <div className="text-center font-semibold py-2 bg-white text-[#373e56]">금 FRI</div>
              <div className="text-center font-semibold py-2 bg-white text-[#ef4343]">토 SAT</div>
            </div>
            
            {/* 달력 날짜들 */}
            <div className="grid grid-cols-7 gap-0">
              {loading ? (
                <div className="col-span-7 text-center py-8">로딩 중...</div>
              ) : (
                renderCalendar()
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

