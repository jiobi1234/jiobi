'use client';

import { useParams } from 'next/navigation';
import HKLayout from '../../../../components/hk/HKLayout';

/** 네이버 지도 검색 링크 */
function mapLink(name: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;
}

/** 옵션 카드: 이름, 위치, 가격, 링크 */
function OptionCard({
  name,
  location,
  price,
  time,
  extra,
  mapSearchName,
  locale,
}: {
  name: string;
  location?: string;
  price?: string;
  time?: string;
  extra?: string;
  mapSearchName?: string;
  locale: string;
}) {
  const searchName = mapSearchName ?? name;
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-[#e9ecef] hover:border-[#adb5bd] transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[#212529]">{name}</h3>
          {location && <p className="text-sm text-[#6c757d] mt-0.5">{location}</p>}
          <ul className="mt-2 text-sm space-y-0.5 text-[#495057]">
            {price && <li><strong>가격:</strong> {price}</li>}
            {time && <li><strong>시간:</strong> {time}</li>}
            {extra && <li><strong>비고:</strong> {extra}</li>}
          </ul>
        </div>
        <a
          href={mapLink(searchName)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium text-[#0d6efd] hover:underline whitespace-nowrap"
        >
          지도·상세 보기 →
        </a>
      </div>
    </div>
  );
}

/**
 * 가족 설문 페이지 (FS = Family Survey)
 * jiobi.kr/ko/hk/fs — 여행지·숙박·식사 옵션을 한 페이지에서 보고 링크로 선택
 */
export default function FamilySurveyPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ko';

  return (
    <HKLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-12">
        <h1 className="text-xl font-semibold text-[#212529] mb-2">
          [여수 순천 가족 여행 계획에 관한 설문]
        </h1>
        <p className="text-sm text-[#6c757d] mb-6">
          아래 관광지·숙박·식사 옵션을 확인하시고, 「지도·상세 보기」 링크로 위치와 메뉴를 보신 뒤 가족 투표로 선택해 주세요.
        </p>

        <div className="space-y-10 text-[#495057]">
          {/* ========== 1일차 ========== */}
          <section>
            <h2 className="text-lg font-semibold text-[#212529] mb-4 border-b border-[#dee2e6] pb-2">
              1일차
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#495057] mb-2">관광</h3>
              <div className="space-y-3">
                <OptionCard
                  name="순천 드라마 촬영장"
                  location="전남 순천시 비례골길 24"
                  price="성인 3,000원 / 만 65세 이상 무료(신분증 필요)"
                  time="9:00 ~ 18:00"
                  extra="주차: 소형 1,000원 / 중형 2,000원 / 대형 3,000원. 교복 1시간 8,000원, 악세사리 1개 1,000원"
                  locale={locale}
                />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#495057] mb-2">식사 (점심·저녁 후보)</h3>
              <p className="text-xs text-[#6c757d] mb-2">링크에서 메뉴·가격 확인 후 선택해 주세요.</p>
              <div className="space-y-3">
                <OptionCard
                  name="순천 맛집 (점심)"
                  location="순천 드라마촬영장 인근"
                  price="메뉴별 상이 — 링크에서 확인"
                  mapSearchName="순천 맛집"
                  locale={locale}
                />
                <OptionCard
                  name="순천 맛집 (저녁)"
                  location="순천만S호텔 인근"
                  price="메뉴별 상이 — 링크에서 확인"
                  mapSearchName="순천시 맛집"
                  locale={locale}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#495057] mb-2">숙박</h3>
              <div className="space-y-3">
                <OptionCard
                  name="순천만S호텔"
                  location="전남 순천시 팔마2길 61"
                  price="스위트(4인) 130,000원 / 스텐다드(2인) 80,000원 / 스텐다드(3인) 100,000원"
                  time="체크인 16:00, 체크아웃 11:00"
                  extra="1층 주차장 건물 뒤쪽, 2층 주차장 건물 앞쪽"
                  locale={locale}
                />
              </div>
            </div>
          </section>

          {/* ========== 2일차 ========== */}
          <section>
            <h2 className="text-lg font-semibold text-[#212529] mb-4 border-b border-[#dee2e6] pb-2">
              2일차
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#495057] mb-2">관광</h3>
              <div className="space-y-3">
                <OptionCard
                  name="순천만 국가정원"
                  location="전남 순천시 국가정원1호길 47"
                  locale={locale}
                />
                <OptionCard
                  name="낙안읍성"
                  mapSearchName="낙안읍성"
                  locale={locale}
                />
                <OptionCard
                  name="미남크루즈"
                  mapSearchName="미남크루즈"
                  locale={locale}
                />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#495057] mb-2">식사 (점심·저녁 후보)</h3>
              <div className="space-y-3">
                <OptionCard
                  name="웃장고기국밥"
                  price="국밥 메뉴 — 링크에서 확인"
                  mapSearchName="웃장고기국밥 순천"
                  locale={locale}
                />
                <OptionCard
                  name="순천·낙안 맛집 (점심/저녁)"
                  price="메뉴별 상이 — 링크에서 확인"
                  mapSearchName="낙안읍성 맛집"
                  locale={locale}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#495057] mb-2">숙박</h3>
              <div className="space-y-3">
                <OptionCard
                  name="더호텔수"
                  mapSearchName="더호텔수"
                  locale={locale}
                />
              </div>
            </div>
          </section>

          {/* ========== 3일차 ========== */}
          <section>
            <h2 className="text-lg font-semibold text-[#212529] mb-4 border-b border-[#dee2e6] pb-2">
              3일차
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#495057] mb-2">관광</h3>
              <div className="space-y-3">
                <OptionCard
                  name="아쿠아플래닛 여수"
                  location="전남 여수시 오동도로 61-11 아쿠아리움"
                  price="대인 37,900원 / 경로 34,900원 (신분증 필요)"
                  time="9:30 ~ 19:00 (매표 마감 18:00)"
                  extra="주차 가능"
                  locale={locale}
                />
                <OptionCard
                  name="여수당"
                  location="전남 여수시 중앙로 72"
                  price="쑥 아이스크림 3,000원"
                  time="매일 07:30 ~ 23:00"
                  extra="이순신광장 주변 주차장 무료 1시간"
                  locale={locale}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#495057] mb-2">식사 (점심·저녁 후보)</h3>
              <div className="space-y-3">
                <OptionCard
                  name="여수 맛집 (오동도·중앙로)"
                  location="아쿠아플래닛·여수당 인근"
                  price="메뉴별 상이 — 링크에서 확인"
                  mapSearchName="여수 오동도 맛집"
                  locale={locale}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </HKLayout>
  );
}
