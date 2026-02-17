// 인증 관련 API 타입 정의

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserResponse {
  user_id: string;
  email: string;
  username: string;
  is_admin?: boolean;
}

