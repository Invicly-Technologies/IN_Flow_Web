export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponseBody<T> = ApiSuccessBody<T> | ApiErrorBody;
