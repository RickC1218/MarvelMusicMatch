import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={isFirst}
        onClick={() => onChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FontAwesomeIcon icon="arrow-left" className="h-4 w-4" />
      </button>

      <span aria-current="page" className="text-secondary text-primary">
        {page}
      </span>

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={isLast}
        onClick={() => onChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-onSuccess shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FontAwesomeIcon icon="arrow-right" className="h-4 w-4" />
      </button>
    </nav>
  );
};
