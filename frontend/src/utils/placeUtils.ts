/**
 * Place 데이터 유틸리티 함수
 * as any 제거 및 타입 안전한 데이터 접근
 */

import type { Place } from '../lib/api-client';

/**
 * Place에서 ID 추출 (place_id 우선, 없으면 id)
 */
export function getPlaceId(place: Place): string {
  return place.place_id || place.id || '';
}

/**
 * 한국어 제목 뒤에 붙은 영문 설명 제거
 * 예: "창덕궁 후원 Changdeokgung Rear Garden" -> "창덕궁 후원"
 *     "망원한강공원 (Mangwon Hangang Park)" -> "망원한강공원"
 */
function stripTrailingEnglish(title: string): string {
  if (!title) return title;

  // 한글이 하나도 없으면(순수 영문 이름이면) 그대로 둔다.
  const hasKorean = /[가-힣]/.test(title);
  if (!hasKorean) return title;

  // 패턴 1: 끝에 괄호 안에 영문만 있는 경우: "장소명 (English Name)"
  const parenMatch = title.match(/^(.*?)(\s*[\(\[]([A-Za-z0-9 ,&'\/\.\-]+)[\)\]])\s*$/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }

  // 패턴 2: "장소명 - English Name" 또는 "장소명 – English Name"
  const dashMatch = title.match(/^(.*?)(\s*[-–]\s*[A-Za-z0-9 ,&'\/\.\-]+)\s*$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }

  // 패턴 3: 한글 다음에 공백 + 영문만 이어지는 단순 케이스
  const simpleMatch = title.match(/^([\uAC00-\uD7AF0-9\s]+)[A-Za-z].*$/);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  return title;
}

/**
 * Place에서 제목 추출 (title 우선, 없으면 place_name)
 */
export function getPlaceTitle(place: Place): string {
  const raw = place.title || place.place_name || '장소명 없음';
  return stripTrailingEnglish(raw);
}

/**
 * Place에서 주소 추출 (address 우선, 없으면 address_name)
 */
export function getPlaceAddress(place: Place): string {
  return place.address || place.address_name || '주소 정보 없음';
}

/**
 * Place에서 주소 (지번 주소) 추출
 */
export function getPlaceAddr1(place: Place): string {
  return place.addr1 || '';
}

/**
 * Place에서 상세 주소 추출
 */
export function getPlaceAddr2(place: Place): string {
  return place.addr2 || '';
}

/**
 * Place에서 전화번호 추출
 */
export function getPlaceTel(place: Place): string {
  return place.tel || '';
}

/**
 * Place에서 이미지 URL 추출
 */
export function getPlaceImage(place: Place): string {
  return place.image || '';
}

/**
 * Place에서 설명 추출
 */
export function getPlaceDescription(place: Place): string {
  return place.description || '';
}

/**
 * Place에서 홈페이지 URL 추출 (HTML이면 href URL만 추출)
 */
export function getPlaceHomepage(place: Place): string {
  const raw = place.homepage || '';
  if (!raw) return '';
  // 백엔드에서 이미 정리해 주지만, HTML이 오는 경우 대비
  const hrefMatch = raw.match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1].trim() : raw;
}

/**
 * Place에서 우편번호 추출
 */
export function getPlaceZipcode(place: Place): string {
  return place.zipcode || '';
}

/**
 * Place에서 이용시간 추출
 */
export function getPlaceUsetime(place: Place): string {
  return place.usetime || '';
}

/**
 * Place에서 휴무일 추출
 */
export function getPlaceRestdate(place: Place): string {
  return place.restdate || '';
}

/**
 * Place에서 주차 정보 추출
 */
export function getPlaceParking(place: Place): string {
  return place.parking || '';
}

/**
 * Place에서 문의처 추출
 */
export function getPlaceInfocenter(place: Place): string {
  return place.infocenter || '';
}

/**
 * Place에서 대표 메뉴 추출 (음식점)
 */
export function getPlaceFirstmenu(place: Place): string {
  return place.firstmenu || '';
}

/**
 * Place에서 취급 메뉴 추출 (음식점)
 */
export function getPlaceTreatmenu(place: Place): string {
  return place.treatmenu || '';
}

/**
 * Place에서 체크인 시간 추출 (숙박)
 */
export function getPlaceCheckintime(place: Place): string {
  return place.checkintime || '';
}

/**
 * Place에서 체크아웃 시간 추출 (숙박)
 */
export function getPlaceCheckouttime(place: Place): string {
  return place.checkouttime || '';
}

/**
 * Place에서 카카오맵 URL 추출
 */
export function getKakaoMapUrl(place: Place): string | null {
  if (place.kakao_url) {
    return place.kakao_url;
  }
  
  const placeId = getPlaceId(place);
  if (placeId) {
    return `https://place.map.kakao.com/${placeId}`;
  }
  
  const title = getPlaceTitle(place);
  if (title && title !== '장소명 없음') {
    return `https://map.kakao.com/link/search/${encodeURIComponent(title)}`;
  }
  
  return null;
}

/**
 * Place가 유효한지 확인
 */
export function isValidPlace(place: Place): boolean {
  return !!(getPlaceId(place) && getPlaceTitle(place) !== '장소명 없음');
}

