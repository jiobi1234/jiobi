/**
 * 카카오맵 API 타입 정의
 * 카카오맵 JavaScript SDK의 타입을 정의하여 타입 안정성 확보
 */

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
        Polyline: new (options: KakaoPolylineOptions) => KakaoPolyline;
        event: {
          addListener: (
            target: KakaoMarker | KakaoMap,
            type: string,
            callback: () => void
          ) => void;
          removeListener: (
            target: KakaoMarker | KakaoMap,
            type: string,
            callback: () => void
          ) => void;
        };
        services: {
          Geocoder: new () => KakaoGeocoder;
          Places: new () => KakaoPlaces;
        };
      };
    };
  }
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  panTo: (latlng: KakaoLatLng) => void;
  relayout: () => void;
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  title?: string;
  image?: KakaoMarkerImage;
  clickable?: boolean;
  zIndex?: number;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
  setPosition: (position: KakaoLatLng) => void;
  setTitle: (title: string) => void;
  setImage: (image: KakaoMarkerImage) => void;
  setZIndex: (zIndex: number) => void;
}

export interface KakaoMarkerImage {
  src: string;
  size: KakaoSize;
  options?: {
    offset?: KakaoPoint;
    spriteOrigin?: KakaoPoint;
    spriteSize?: KakaoSize;
  };
}

export interface KakaoSize {
  width: number;
  height: number;
}

export interface KakaoPoint {
  x: number;
  y: number;
}

export interface KakaoInfoWindowOptions {
  content: string | HTMLElement;
  removable?: boolean;
  disableAutoPan?: boolean;
  zIndex?: number;
}

export interface KakaoInfoWindow {
  open: (map: KakaoMap, marker?: KakaoMarker) => void;
  close: () => void;
  setContent: (content: string | HTMLElement) => void;
  setPosition: (position: KakaoLatLng) => void;
  setZIndex: (zIndex: number) => void;
}

export interface KakaoPolylineOptions {
  path: KakaoLatLng[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
}

export interface KakaoPolyline {
  setMap: (map: KakaoMap | null) => void;
}

export interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
  coord2Address: (
    lng: number,
    lat: number,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
}

export interface KakaoGeocoderResult {
  address: {
    address_name: string;
    y: string;
    x: string;
    address_type: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    region_3depth_h_name: string;
    h_code: string;
    b_code: string;
    mountain_yn: string;
    main_address_no: string;
    sub_address_no: string;
    x: string;
    y: string;
  };
  road_address?: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: string;
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string;
    x: string;
    y: string;
  };
}

export interface KakaoPlaces {
  keywordSearch: (
    keyword: string,
    callback: (data: KakaoPlaceResult[], status: string) => void,
    options?: KakaoPlacesSearchOptions
  ) => void;
  categorySearch: (
    category: string,
    callback: (data: KakaoPlaceResult[], status: string) => void,
    options?: KakaoPlacesSearchOptions
  ) => void;
}

export interface KakaoPlacesSearchOptions {
  category_group_code?: string;
  x?: number;
  y?: number;
  radius?: number;
  bounds?: KakaoLatLngBounds;
  rect?: string;
  size?: number;
  page?: number;
  sort?: string;
}

export interface KakaoLatLngBounds {
  sw: KakaoLatLng;
  ne: KakaoLatLng;
}

export interface KakaoPlaceResult {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export {};

