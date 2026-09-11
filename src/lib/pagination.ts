export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePagination(searchParams: URLSearchParams): { limit: number; offset: number } {
  const limitRaw = Number(searchParams.get("limit"));
  const offsetRaw = Number(searchParams.get("offset"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}
