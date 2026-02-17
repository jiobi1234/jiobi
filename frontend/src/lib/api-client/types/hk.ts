// HK (여행) 관련 API 타입 정의

export interface Place {
  id?: string;
  place_id?: string;
  title?: string;
  place_name?: string;
  address?: string;
  address_name?: string;
  addr1?: string;  // 주소 (지번 주소)
  addr2?: string;  // 상세 주소
  tel?: string;  // 전화번호
  description?: string;
  image?: string;
  kakao_url?: string;
  region?: string;
  district?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  // TourAPI 추가 정보
  homepage?: string;  // 홈페이지
  zipcode?: string;  // 우편번호
  usetime?: string;  // 이용시간
  restdate?: string;  // 휴무일
  parking?: string;  // 주차 정보
  infocenter?: string;  // 문의처
  firstmenu?: string;  // 대표 메뉴 (음식점)
  treatmenu?: string;  // 취급 메뉴 (음식점)
  checkintime?: string;  // 체크인 시간 (숙박)
  checkouttime?: string;  // 체크아웃 시간 (숙박)
}

export interface SearchPlacesResponse {
  places: Place[];
  page: number;
  limit: number;
  total: number;
}

export interface WishlistItem {
  id: string;
  place_id: string;
  title: string;
  address?: string;
  image?: string;
  created_at: string;
}

export interface WishlistListResponse {
  items: WishlistItem[];
}

export interface PlanItem {
  place_id: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface Plan {
  id: string;
  user_id?: string;
  title: string;
  start_date?: string;
  end_date?: string;
  items?: PlanItem[];
  created_at?: string;
  [key: string]: any;
}

export interface PlansResponse {
  plans: Plan[];
  page: number;
  limit: number;
  total: number;
}

export interface ThemePlace {
  place_id: string;
  title: string;
  address?: string;
  image?: string;
}

export interface Theme {
  id: string;
  name_ko: string;
  name_en: string;
  places: ThemePlace[];
  created_at?: string;
}

export interface CreateThemeRequest {
  name_ko: string;
  name_en: string;
  places: ThemePlace[];
}

export interface UpdateThemeRequest {
  name_ko?: string;
  name_en?: string;
  places?: ThemePlace[];
}

export interface ThemesResponse {
  themes: Theme[];
}

