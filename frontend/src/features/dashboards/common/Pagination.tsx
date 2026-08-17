import React from 'react';

const IconChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 15 7.5 10l5-5" />
  </svg>
);

const IconChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 5l5 5-5 5" />
  </svg>
);

// Builds a compact page number sequence with ellipsis gaps.
// Always shows the first and last page, plus a window of two pages around

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];

  const left  = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2)       pages.push('…');
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push('…');

  pages.push(total);
  return pages;
}


export interface PaginationProps {
  currentPage:  number;
  totalPages:   number;
  totalItems:   number;
  pageSize:     number;
  onPageChange: (page: number) => void;
  /** Plural noun displayed in the summary label — defaults to "records" */
  itemLabel?:   string;
  className?:   string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'records',
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const from  = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const to    = Math.min(currentPage * pageSize, totalItems);
  const pages = buildPageRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={[
        'flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      ].join(' ')}
    >
      {/* Summary label */}
      <p className="select-none text-xs text-slate-500">
        Showing{' '}
        <span className="font-semibold text-slate-700">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span>
        {' '}{itemLabel}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">

        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition
            hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700
            disabled:cursor-not-allowed disabled:opacity-40
            disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-500"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>

        {/* Page number buttons */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-8 w-8 select-none items-center justify-center text-xs font-medium text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              className={[
                'flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold transition',
                p === currentPage
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
              ].join(' ')}
            >
              {p}
            </button>
          ),
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition
            hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700
            disabled:cursor-not-allowed disabled:opacity-40
            disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-500"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>

      </div>
    </nav>
  );
};

export default Pagination;