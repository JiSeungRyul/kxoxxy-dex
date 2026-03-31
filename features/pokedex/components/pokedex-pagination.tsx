"use client";

type PokedexPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalResults: number;
  pageStart: number;
  pageEnd: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const normalizedStart = Math.max(1, end - 4);

  return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
}

export function PokedexPagination({
  currentPage,
  totalPages,
  pageSize,
  totalResults,
  pageStart,
  pageEnd,
  onPageChange,
}: PokedexPaginationProps) {
  if (totalResults === 0) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const buttonClassName =
    "inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-border bg-card px-6 py-4 shadow-card">
      <div>
        <p className="text-sm font-semibold text-foreground">
          총 {totalResults}마리 중 {pageStart}-{pageEnd} 표시 중
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          페이지당 {pageSize}마리
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={buttonClassName}
        >
          이전
        </button>

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={
              page === currentPage
                ? "inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
                : buttonClassName
            }
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={buttonClassName}
        >
          다음
        </button>
      </div>
    </section>
  );
}
