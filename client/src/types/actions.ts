export type ActionResponse<T = null> = {
  success: boolean;
  error: string | null;
  data: T;
};
