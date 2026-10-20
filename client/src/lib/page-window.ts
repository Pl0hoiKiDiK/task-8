const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

export function pageWindow(page: number, count: number, siblings = 1): (number | "…")[] {
    if (count <= siblings * 2 + 5) return range(1, count);
    const left = Math.max(page - siblings, 1);
    const right = Math.min(page + siblings, count);
    const edge = 3 + siblings * 2;
    if (left <= 2) return [...range(1, edge), "…", count];
    if (right >= count - 1) return [1, "…", ...range(count - edge + 1, count)];
    return [1, "…", ...range(left, right), "…", count];
}
