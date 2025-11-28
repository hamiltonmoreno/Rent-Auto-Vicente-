import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Translation } from '../types';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: Translation;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  t 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">{t.pagination.prev}</span>
      </button>

      <div className="flex items-center gap-1">
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900">
           {t.pagination.page} {currentPage} {t.pagination.of} {totalPages}
        </span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="hidden sm:inline">{t.pagination.next}</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};