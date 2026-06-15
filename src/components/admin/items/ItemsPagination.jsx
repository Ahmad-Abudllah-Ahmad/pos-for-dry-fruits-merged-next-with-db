"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/common/button";

/**
 * @param {{
 *   page: number;
 *   pageSize: number;
 *   total: number;
 *   onPageChange: (page: number) => void;
 * }} props
 */
export function ItemsPagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <p>
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft />
          Previous
        </Button>
        <span className="min-w-20 text-center font-medium text-foreground">
          Page {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
