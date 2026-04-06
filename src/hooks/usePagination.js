import { useMemo, useState } from "react";

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  return useMemo(
    () => ({
      page,
      pageSize,
      setPage,
      resetPage() {
        setPage(1);
      },
    }),
    [page, pageSize],
  );
}
