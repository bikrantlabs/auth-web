import "server-only";

import { http } from "./client";
import type {
  ApiResponse,
  GetMeResponse,
  LoginUserResponse,
  RefreshTokenResponse,
  RegisterUserResponse,
  VerifyEmailResponse,
} from "./response";

type RegisterApiInput = {
  email: string;
  password: string;
};

type LoginApiInput = RegisterApiInput;

type VerifyEmailApiInput = {
  email: string;
  code: string;
};
export const authApi = {
  register: (data: RegisterApiInput) => {
    return http.post<RegisterUserResponse>("/auth/register", data);
  },
  login: (data: LoginApiInput) => {
    return http.post<LoginUserResponse>("/auth/login", data);
  },
  verifyEmail: (data: VerifyEmailApiInput) => {
    return http.post<VerifyEmailResponse>("/auth/verify-email", data);
  },
  sendVerificationEmail: (data: { email: string }) => {
    return http.post<ApiResponse<null>>("/auth/send-verification-email", data);
  },
  getMe: () => {
    return http.get<GetMeResponse>("/auth/me");
  },
  refreshTokens: (data: { refreshToken: string }) => {
    return http.post<RefreshTokenResponse>("/auth/refresh", data);
  },
  // If we dont' have refresh token in the cookies, call logout with random refreshtoken string
  // the API will still logout.
  logout: (data: { refreshToken: string }, opts?: { signal?: AbortSignal }) => {
    return http.post<ApiResponse<null>>("/auth/logout", data, opts);
  },
};
