import { z } from "zod";

// Add API specific error codes here to handle them accordingly in server actions.
// If an API endpoint returns different unique error, we can simply use status codes.
export type ApiErrorCode = "UNVERIFIED_USER" | (string & {});

export type ApiFieldErrors = Record<string, string[]>;

/**
 * The error envelope returned by the API:
 *
 * {
 *   "success": false,
 *   "error": {
 *     "code": "CONFLICT",
 *     "message": "An account with this email already exists."
 *     "fields":  { "password": [...], "email": [...] }
 *   }
 * }
 */
export type ApiErrorBody = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: ApiFieldErrors;
  };
};

const apiErrorBodySchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export function parseApiErrorBody(value: unknown): ApiErrorBody | null {
  const result = apiErrorBodySchema.safeParse(value);
  return result.success ? result.data : null;
}

export class ApiError extends Error {
  readonly body: ApiErrorBody;

  constructor(
    public status: number,
    body: unknown,
    message?: string,
  ) {
    const parsed = parseApiErrorBody(body) ?? {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: `API error ${status}`,
      },
    };

    super(message ?? parsed.error.message);
    this.name = "ApiError";
    this.body = parsed;
  }

  get code() {
    return this.body.error.code;
  }

  get fieldErrors() {
    return this.body.error.fields;
  }

  get isValidation() {
    return this.status === 422;
  }

  get isBadRequest() {
    return this.status === 400;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}
