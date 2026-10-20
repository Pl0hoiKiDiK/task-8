type PaginationProps = {
    page: number;
    pageCount: number;
    onChange: (page: number) => void;
    label?: string;
};

const arrowClass =
    "grid size-10 place-items-center rounded-full border border-(--border) text-xl leading-none text-(--text) " +
    "hover:bg-(--sidebar-active) disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * В макете номеров страниц нет, поэтому только стрелки «назад / вперёд».
 * Показываются, только когда страниц больше одной (требование notion: пагинация по необходимости).
 */
export function Pagination({ page, pageCount, onChange, label = "Pages" }: PaginationProps) {
    if (pageCount <= 1) return null;

    return (
        <nav className="mt-4 flex items-center justify-end gap-2" aria-label={label}>
            <button type="button" className={arrowClass} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">‹</button>
            <button type="button" className={arrowClass} disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">›</button>
        </nav>
    );
}
