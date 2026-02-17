// HK API 클라이언트 (여행 관련)

import { BaseApiClient } from './base-client';
import type {
  Place,
  SearchPlacesResponse,
  Plan,
  PlansResponse,
  CreateThemeRequest,
  UpdateThemeRequest,
  Theme,
  ThemesResponse,
  WishlistItem,
  WishlistListResponse,
} from './types';

export class HkClient extends BaseApiClient {
  /**
   * 섹션 데이터 새로고침
   */
  async refreshSection(
    sectionType: string,
    limit: number = 6
  ): Promise<any> {
    return this.get('/hk/refresh-section/', {
      section_type: sectionType,
      limit,
    });
  }

  /**
   * 장소 검색
   */
  async searchPlaces(
    keyword: string = "",
    page: number = 1,
    limit: number = 10,
    region?: string,
    district?: string
  ): Promise<SearchPlacesResponse> {
    const params: any = {
      page,
      limit,
    };
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    if (region) params.region = region;
    if (district) params.district = district;
    
    return this.get<SearchPlacesResponse>('/hk/search', params);
  }

  /**
   * 장소 상세 정보
   */
  async getPlaceDetail(placeId: string): Promise<Place> {
    return this.get<Place>(`/hk/place/${placeId}`);
  }

  /**
   * 테마별 장소 조회
   */
  async getThemePlaces(
    themeName: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchPlacesResponse> {
    return this.get<SearchPlacesResponse>(`/hk/theme/${themeName}`, {
      page,
      limit,
    });
  }

  /**
   * 여행 계획 생성
   */
  async createPlan(planData: Partial<Plan>): Promise<Plan> {
    return this.post<Plan>('/hk/plan', planData);
  }

  /**
   * 여행 계획 조회
   */
  async getPlan(planId: string): Promise<Plan> {
    return this.get<Plan>(`/hk/plan/${planId}`);
  }

  /**
   * 여행 계획 수정
   */
  async updatePlan(planId: string, data: Partial<Plan>): Promise<Plan> {
    return this.put<Plan>(`/hk/plan/${planId}`, data);
  }

  /**
   * 사용자 여행 계획 목록
   */
  async getUserPlans(
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PlansResponse> {
    return this.get<PlansResponse>('/hk/plans', {
      user_id: userId,
      page,
      limit,
    });
  }

  /**
   * 테마 생성 (관리자만)
   */
  async createTheme(themeData: CreateThemeRequest): Promise<Theme> {
    return this.post<Theme>('/hk/themes', themeData);
  }

  /**
   * 테마 목록 조회
   */
  async getThemes(): Promise<ThemesResponse> {
    return this.get<ThemesResponse>('/hk/themes');
  }

  /**
   * 특정 테마 조회
   */
  async getTheme(themeId: string): Promise<Theme> {
    return this.get<Theme>(`/hk/themes/${themeId}`);
  }

  /**
   * 테마 수정 (관리자만) - 이름 및 장소 수정
   */
  async updateTheme(
    id: string,
    data: UpdateThemeRequest
  ): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(`/hk/themes/${id}`, data);
  }

  /**
   * 테마 삭제 (관리자만)
   */
  async deleteTheme(id: string): Promise<{ success: boolean }> {
    return this.delete(`/hk/themes/${id}`);
  }

  /**
   * 위시리스트 조회 (로그인 필요)
   */
  async getWishlist(): Promise<WishlistListResponse> {
    return this.get<WishlistListResponse>('/hk/wishlist');
  }

  /**
   * 위시리스트에 장소 추가 (로그인 필요)
   */
  async addToWishlist(place: Place): Promise<WishlistItem> {
    const body = {
      place_id: place.place_id || place.id || '',
      title: place.title || place.place_name || '',
      address: place.address || place.address_name || '',
      image: place.image || '',
    };
    return this.post<WishlistItem>('/hk/wishlist', body);
  }

  /**
   * 위시리스트에서 장소 제거 (로그인 필요)
   */
  async removeFromWishlist(placeId: string): Promise<{ success: boolean; deleted_count: number }> {
    return this.delete<{ success: boolean; deleted_count: number }>(`/hk/wishlist/${placeId}`);
  }

  /**
   * 여행 계획 삭제
   */
  async deletePlan(planId: string): Promise<{ success: boolean; deleted_count: number }> {
    return this.delete<{ success: boolean; deleted_count: number }>(`/hk/plan/${planId}`);
  }

  /**
   * Day 단위 길찾기 경로 조회
   * - points: 순서가 정해진 장소 목록
   */
  async getRoute(points: {
    place_id?: string;
    name?: string;
    latitude: number;
    longitude: number;
  }[]): Promise<{
    summary: { distance_meters: number; duration_seconds: number };
    path: { latitude: number; longitude: number }[];
  }> {
    return this.post('/hk/route', {
      points,
    });
  }
}

