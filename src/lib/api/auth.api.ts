import "server-only";

import { http } from "./client";
import type {
  ApiResponse,
  RegisterUserResponse,
  VerifyEmailResponse,
} from "./response";

type RegisterApiInput = {
  email: string;
  password: string;
};

type VerifyEmailApiInput = {
  email: string;
  code: string;
};
export const authApi = {
  register: (data: RegisterApiInput) => {
    return http.post<RegisterUserResponse>("/auth/register", data);
  },
  verifyEmail: (data: VerifyEmailApiInput) => {
    return http.post<VerifyEmailResponse>("/auth/verify-email", data);
  },
  sendVerificationEmail: (data: { email: string }) => {
    return http.post<ApiResponse<null>>("/auth/send-verification-email", data);
  },
};
