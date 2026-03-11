'use client';

import HKLayout from '../../../../components/hk/HKLayout';

function mapLink(name: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;
}

const BUDGET_9 = 2819100;
const BUDGET_8 = 2382200;

const costItems = [
  { day: 1, label: '순천 통합 입장권', note: '드라마촬영장, 국가정원, 순천만습지, 낙안읍성', w9: 252000, w8: 224000 },
  { day: 1, label: '순천만S호텔', w9: 310000, w8: 260000 },
  { day: 1, label: '참조은시골집 한정식', w9: 306000, w8: 272000 },
  { day: 1, label: '맥주집', w9: 200000, w8: 200000 },
  { day: 2, label: '순천만 국가정원', w9: 0, w8: 0, zeroNote: true },
  { day: 2, label: '웃장고기국밥 (점심)', w9: 108000, w8: 96000 },
  { day: 2, label: '낙안읍성', w9: 0, w8: 0, zeroNote: true },
  { day: 2, label: '미남크루즈', w9: 387000, w8: 344000 },
  { day: 2, label: '낭만밤바다펜션리조트', w9: 350000, w8: 260000 },
  { day: 2, label: '낭만조개포차 여수본점 (저녁)', w9: 433000, w8: 306000 },
  { day: 3, label: '아쿠아플래닛', w9: 338100, w8: 300200 },
  { day: 3, label: '순이네 밥상', w9: 135000, w8: 120000 },
];

const scheduleDay1 = [
  { name: '순천 드라마 촬영장', location: '전남 순천시 비례골길 24', price: '성인 3,000원 / 65세↑ 무료', time: '9:00~18:00', parking: '소형 1,000 / 중형 2,000 / 대형 3,000', note: '교복 1시간 8,000원, 악세사리 1개 1,000원', mapUrl: null as string | null, travelFromPrev: null as string | null },
  { name: '참조은시골집 한정식', location: '전남 순천시 해룡면 해룡로 579', price: '와온밥상 34,000원 (인당)', time: '11:30~21:00 (브레이크 15~17시, 라스트오더 19:30)', parking: '앞 17대, 뒤 30대, 제2주차장 무료', mapUrl: null as string | null, travelFromPrev: '19분 · 13km' },
  { name: '순천만S호텔', location: '전남 순천시 팔마2길 61', price: '스위트(4인) 130,000 / 스텐다드(2인) 80,000 / (3인) 100,000', time: '체크인 16:00, 체크아웃 11:00', parking: '1층 뒤·2층 앞', mapUrl: null as string | null, travelFromPrev: '15분 · 8.5km' },
  { name: '숙소 근처 맥주집', location: null, price: null, time: null, parking: null, note: '역전할머니맥주, 김복남맥주, 1도씨맥주, 크라운호프', mapUrl: null as string | null, travelFromPrev: '숙소에서 도보로 4분거리' },
];

const scheduleDay2 = [
  { name: '순천만 국가 정원', location: '전남 순천시 국가정원1호길 47', price: '10,000원 (19~64세)', time: '8:00~19:00', parking: null, note: '홈페이지 참조', mapUrl: null as string | null, travelFromPrev: null as string | null },
  { name: '웃장고기국밥 (점심)', location: '전남 순천시 동외동 (국밥골목)', price: null, time: null, parking: null, note: null, mapUrl: 'https://naver.me/GJTIjscM', travelFromPrev: '11분 · 4.2km' },
  { name: '낙안읍성', location: '전남 순천시 낙안면 충민길 30', price: '성인 4,000원', time: null, parking: null, note: '홈페이지 참조', mapUrl: null as string | null, travelFromPrev: '33분 · 2.3km' },
  { name: '미남크루즈', location: '전남 여수시 돌산읍 돌산로 3617-22', price: '성인 43,000원', time: '19:40 출항', parking: '돌산대교 밑 300대 무료', note: '예약페이지 참조', mapUrl: null as string | null, travelFromPrev: '55분 · 63km' },
  { name: '낭만밤바다펜션리조트', location: '전남 여수시 이순신광장로 159', price: '오션디럭스(4인) 130,000 / (3인) 110,000', time: null, parking: null, note: null, mapUrl: null as string | null, travelFromPrev: '8분 · 4km' },
  { name: '낭만조개포차 여수본점 (저녁)', location: '전남 여수시 이순신광장로 159 주1동 203호', price: '37,000원', time: null, parking: null, note: null, mapUrl: 'https://naver.me/xeAfsnsq', travelFromPrev: '같은건물' },
];

const NAVER_MAP_SUNINE = 'https://map.naver.com/p/search/%EC%88%9C%EC%9D%B4%EB%84%A4%EB%B0%A5%EC%83%81/place/1586505402';

const scheduleDay3 = [
  { name: '아쿠아플래닛', location: '전남 여수시 오동도로 61-11', price: '대인 37,900 / 경로 34,900 (신분증)', time: '9:30~19:00 (매표 18:00)', parking: '주차 가능', note: null, mapUrl: null as string | null, travelFromPrev: null as string | null },
  { name: '순이네 밥상', location: null, price: '15,000원 (인당)', time: null, parking: null, note: null, mapUrl: NAVER_MAP_SUNINE, travelFromPrev: '6분 · 2.1km' },
];

function formatWon(n: number) {
  if (n === 0) return '—';
  return n.toLocaleString() + '원';
}

function PlaceCard({
  name,
  location,
  price,
  time,
  parking,
  note,
  showMap = true,
  mapUrl = null,
}: {
  name: string;
  location: string | null;
  price: string | null;
  time: string | null;
  parking: string | null;
  note: string | null;
  showMap?: boolean;
  mapUrl?: string | null;
}) {
  const hasDetail = location || price || time || parking || note;
  const showMapLink = showMap || !!mapUrl;
  const mapHref = mapUrl || (showMap ? mapLink(name) : '');
  return (
    <article className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 transition-shadow hover:shadow-md hover:border-slate-300 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
        <h3 className="text-base font-semibold text-slate-900 leading-tight break-words">{name}</h3>
        {showMapLink && mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium text-sky-500 hover:underline"
          >
            지도 보기
          </a>
        )}
      </div>
      {hasDetail && (
        <dl className="grid grid-cols-[auto_1fr] sm:gap-x-4 gap-x-3 gap-y-0.5 text-[13px] m-0 min-w-0 [&>dd]:break-words [&>dd]:min-w-0">
          {location && (
            <>
              <dt className="text-slate-500 font-medium shrink-0">위치</dt>
              <dd className="text-slate-700">{location}</dd>
            </>
          )}
          {price && (
            <>
              <dt className="text-slate-500 font-medium shrink-0">가격</dt>
              <dd className="text-slate-700">{price}</dd>
            </>
          )}
          {time && (
            <>
              <dt className="text-slate-500 font-medium shrink-0">시간</dt>
              <dd className="text-slate-700">{time}</dd>
            </>
          )}
          {parking && (
            <>
              <dt className="text-slate-500 font-medium shrink-0">주차</dt>
              <dd className="text-slate-700">{parking}</dd>
            </>
          )}
          {note && (
            <>
              <dt className="text-slate-500 font-medium shrink-0">비고</dt>
              <dd className="text-slate-700">{note}</dd>
            </>
          )}
        </dl>
      )}
    </article>
  );
}

export default function FamilySurveyPage() {
  return (
    <HKLayout>
      <div className="flex justify-center">
        <div className="max-w-[64rem] w-full px-3 sm:px-5 py-4 sm:py-6 pb-10 sm:pb-12 text-slate-700 text-[15px] leading-relaxed min-w-0">
        <header className="text-center py-6 sm:py-8 pb-7 sm:pb-9 mb-2">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0 mb-1">
            여수 · 순천
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 m-0">가족 여행 계획</p>
        </header>

        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 pb-2 border-b-2 border-slate-200">
            예상 경비
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl py-4 sm:py-5 px-4 text-center shadow-lg">
              <span className="block text-[13px] font-medium text-slate-400 mb-1">9명 기준</span>
              <span className="text-lg sm:text-2xl font-bold tracking-tight">{formatWon(BUDGET_9)}</span>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl py-4 sm:py-5 px-4 text-center shadow-lg">
              <span className="block text-[13px] font-medium text-slate-400 mb-1">8명 기준</span>
              <span className="text-lg sm:text-2xl font-bold tracking-tight">{formatWon(BUDGET_8)}</span>
            </div>
          </div>
          {/* 모바일: 카드형 리스트 / 데스크톱: 테이블형 */}
          <ul className="list-none m-0 p-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* 데스크톱: 헤더 행 */}
            <li className="hidden sm:grid grid-cols-[3.5rem_1fr_5.5rem_5.5rem] gap-3 items-center py-2.5 px-4 text-[13px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-200">
              <span className="font-semibold text-slate-600">일정</span>
              <span>항목</span>
              <span className="text-right">9명 기준</span>
              <span className="text-right">8명 기준</span>
            </li>
            {costItems.map((item, i) => (
              <li
                key={i}
                className={`border-b border-slate-100 last:border-b-0 ${
                  i % 2 === 1 ? 'bg-slate-50' : ''
                }`}
              >
                {/* 모바일: 카드형 (세로 배치) */}
                <div className="sm:hidden py-3 px-3 flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-slate-600 text-[13px] shrink-0">Day {item.day}</span>
                    <span className="text-slate-700 text-sm break-words min-w-0">
                      {item.label}
                      {item.note && <em className="not-italic text-slate-500 text-[12px]"> ({item.note})</em>}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] tabular-nums">
                    <span><span className="text-slate-500">9명</span> <span className="text-slate-900 font-medium">{item.zeroNote ? '—' : formatWon(item.w9)}</span></span>
                    <span><span className="text-slate-500">8명</span> <span className="text-slate-900 font-medium">{item.zeroNote ? '—' : formatWon(item.w8)}</span></span>
                  </div>
                </div>
                {/* 데스크톱: 테이블 행 */}
                <div className="hidden sm:grid grid-cols-[3.5rem_1fr_5.5rem_5.5rem] gap-3 items-baseline py-2.5 px-4 text-sm">
                  <span className="font-semibold text-slate-600">Day {item.day}</span>
                  <span className="text-slate-700 break-words min-w-0">
                    {item.label}
                    {item.note && <em className="not-italic text-slate-500 text-[13px]"> ({item.note})</em>}
                  </span>
                  <span className="text-right tabular-nums text-slate-900 font-medium">
                    {item.zeroNote ? '—' : formatWon(item.w9)}
                  </span>
                  <span className="text-right tabular-nums text-slate-900 font-medium">
                    {item.zeroNote ? '—' : formatWon(item.w8)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] sm:text-[13px] text-slate-500 leading-snug">
            ※ 통합 입장권에 2일차 국가정원·낙안읍성 포함. 주차·통행료·주유비 미포함.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 pb-2 border-b-2 border-slate-200">
            여행 일정
          </h2>

          {[
            { label: '1일차', places: scheduleDay1, travelToFirst: null as string | null },
            { label: '2일차', places: scheduleDay2, travelToFirst: '4분 · 1.3km' },
            { label: '3일차', places: scheduleDay3, travelToFirst: '5분 · 2.3km' },
          ].map((day) => (
            <div key={day.label} className="mb-6 sm:mb-8 last:mb-0">
              <div className="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3 pl-2 border-l-4 border-sky-500">
                {day.label}
              </div>
              {day.travelToFirst && (
                <div className="flex items-center justify-center gap-2 py-1.5 px-3 mb-2 text-[13px] text-slate-500 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <span className="text-slate-400">🚗</span>
                  <span>{day.travelToFirst}</span>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:gap-3">
                {day.places.map((place, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:gap-3">
                    {place.travelFromPrev && (
                      <div className="flex items-center justify-center gap-2 py-1.5 px-3 text-[13px] text-slate-500 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        {place.travelFromPrev !== '같은건물' && (
                          <span className="text-slate-400">{place.travelFromPrev.includes('도보') ? '👣' : '🚗'}</span>
                        )}
                        <span>{place.travelFromPrev}</span>
                      </div>
                    )}
                    <PlaceCard
                      name={place.name}
                      location={place.location}
                      price={place.price}
                      time={place.time}
                      parking={place.parking}
                      note={place.note}
                      showMap={!!place.location}
                      mapUrl={place.mapUrl}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        </div>
      </div>
    </HKLayout>
  );
}
