'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/calendar.css';
import { API_CONFIG } from '../../../../lib/api-client/config';
import calendar from 'solar2lunar';

interface Holiday {
  name: string;
  isHoliday: boolean;
}

interface LunarDate {
  [key: number]: string;
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<number, Holiday>>({});
  const [lunarDates, setLunarDates] = useState<LunarDate>({});
  const [showLunar, setShowLunar] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const solarMonth = currentMonthIndex + 1;

  useEffect(() => {
    fetchHolidays(currentYear, solarMonth);
  }, [currentYear, solarMonth]);

  // 해당 연·월의 음력은 클라이언트에서 계산 (solar2lunar)
  useEffect(() => {
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const next: LunarDate = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const result = calendar.solar2lunar(currentYear, solarMonth, day);
      if (result && typeof result.lMonth === 'number' && typeof result.lDay === 'number') {
        next[day] = `음 ${result.lMonth}.${result.lDay}`;
      }
    }
    setLunarDates(next);
  }, [currentYear, currentMonthIndex, solarMonth]);

  const fetchHolidays = async (year: number, month: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.apiPrefix}/holidays/?year=${year}&month=${month}`);
      const data = await response.json();

      const newHolidays: Record<number, Holiday> = {};
      const list = data?.holidays;
      if (Array.isArray(list)) {
        list.forEach((item: { date: string; name: string }) => {
          const dateStr = String(item.date);
          if (dateStr.length >= 8) {
            const day = parseInt(dateStr.slice(-2), 10);
            if (day >= 1 && day <= 31) {
              newHolidays[day] = { name: item.name, isHoliday: true };
            }
          }
        });
      }
      setHolidays(newHolidays);
    } catch (error) {
      console.error('공휴일 정보를 가져오는데 실패했습니다:', error);
      setHolidays({});
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

    const days = [];

    // 빈 칸 추가 (첫 번째 날짜 전)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day calendar-day-empty"></div>);
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
      <section className="py-12 util-calendar-wrap">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">달력</h1>

          <div className="util-calendar-card">
            <div className="util-calendar-header">
              <div className="util-calendar-actions">
                <button type="button" onClick={goToToday} className="btn-today">
                  오늘
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={showLunar}
                    onChange={(e) => setShowLunar(e.target.checked)}
                  />
                  <span>음력 표시</span>
                </label>
              </div>
              <div className="util-calendar-nav">
                <button type="button" onClick={prevMonth} aria-label="이전 달">‹</button>
                <div className="util-calendar-title">
                  <span className="year">{currentYear}년</span>
                  {MONTH_NAMES[currentMonthIndex]}
                </div>
                <button type="button" onClick={nextMonth} aria-label="다음 달">›</button>
              </div>
            </div>

            <div className="util-calendar-weekdays">
              <div className="weekday-sun">일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div className="weekday-sat">토</div>
            </div>

            <div className="util-calendar-grid">
              {loading ? (
                <div className="util-calendar-loading">로딩 중...</div>
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

