export type ApiResponse<T> = {
  status: "success";
  message: string;
  timestamp: string; // ISO 8601
  data: T;
};

export type User = {
  id: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

export type Token = {
  accessToken: string;
  refreshToken: string;
};
export type RegisterUserResponse = ApiResponse<{ user: User }>;
export type VerifyEmailResponse = ApiResponse<{ user: User; tokens: Token }>;
