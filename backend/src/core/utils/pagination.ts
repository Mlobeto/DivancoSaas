export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function toSkipTake({ page, limit }: PaginationInput): {
  skip: number;
  take: number;
} {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function buildPaginationMeta(
  input: PaginationInput,
  total: number,
): PaginationMeta {
  const page = Number.isFinite(input.page) && input.page > 0 ? input.page : 1;
  const limit =
    Number.isFinite(input.limit) && input.limit > 0 ? input.limit : 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
