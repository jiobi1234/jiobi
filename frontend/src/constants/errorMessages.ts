/**
 * 에러 메시지 상수
 * 앱 전체에서 사용되는 에러 메시지를 중앙에서 관리
 */

export const ERROR_MESSAGES = {
  // 네트워크 에러
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',

  // 인증 에러
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',

  // API 에러
  API_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다.',

  // 폼 검증 에러
  REQUIRED_FIELD: (field: string) => `${field}을(를) 입력해주세요.`,
  INVALID_EMAIL: '올바른 이메일 형식을 입력해주세요.',
  INVALID_PASSWORD: '비밀번호는 최소 8자 이상이어야 합니다.',
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
  MIN_LENGTH: (field: string, min: number) => `${field}은(는) 최소 ${min}자 이상이어야 합니다.`,
  MAX_LENGTH: (field: string, max: number) => `${field}은(는) 최대 ${max}자까지 입력 가능합니다.`,

  // 데이터 로딩 에러
  LOAD_FAILED: '데이터를 불러오는데 실패했습니다.',
  PLACE_NOT_FOUND: '장소 정보를 찾을 수 없습니다.',
  SEARCH_FAILED: '검색에 실패했습니다. 다시 시도해주세요.',

  // 카카오맵 에러
  KAKAO_MAP_LOAD_FAILED: '지도를 불러오는데 실패했습니다.',
  KAKAO_MAP_TIMEOUT: '지도 로딩 시간이 초과되었습니다.',

  // 사용자 액션 에러
  LOGIN_FAILED: '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.',
  SIGNUP_FAILED: '회원가입에 실패했습니다. 다시 시도해주세요.',
  UPDATE_FAILED: '정보 수정에 실패했습니다.',
  DELETE_FAILED: '삭제에 실패했습니다.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  SIGNUP_SUCCESS: '회원가입이 완료되었습니다.',
  UPDATE_SUCCESS: '정보가 수정되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  SUBMIT_SUCCESS: '제출되었습니다.',
} as const;

export const INFO_MESSAGES = {
  LOADING: '로딩 중...',
  NO_DATA: '표시할 데이터가 없습니다.',
  NO_SEARCH_RESULTS: '검색 결과가 없습니다.',
  FEATURE_COMING_SOON: '준비 중인 기능입니다.',
} as const;

