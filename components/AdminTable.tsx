"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowUpDown,
  Search,
  ListFilter,
  Inbox
} from 'lucide-react';
import { Skeleton } from './Skeleton';
import EmptyState from './EmptyState';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  selectedId?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Production-Level Admin DataTable
 * Features: Zebra striping, Hover highlights, Responsive design, 
 * Motion-enhanced rows, and Premium pagination.
 */
export default function AdminTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  onRowClick,
  selectedId,
  currentPage,
  totalPages,
  onPageChange,
  emptyTitle = "No data found",
  emptyDescription = "No records match the current criteria.",
  className = ""
}: AdminTableProps<T>) {
  return (
    <div className={`bg-card rounded-[24px] border border-border shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/20 border-b border-border/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-[11px] font-bold uppercase text-text-hint tracking-wider ${col.className || ""}`}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && (
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 w-12 text-right text-[11px] font-bold uppercase text-slate-500 tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-5">
                      <Skeleton className="h-4 w-3/4 rounded-md opacity-20" />
                    </td>
                  ))}
                  <td className="px-6 py-5"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-20">
                  <div className="flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Inbox className="text-slate-300 w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{emptyTitle}</h3>
                    <p className="text-xs text-slate-500 max-w-xs">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {data.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.3 }}
                      onClick={() => onRowClick?.(item)}
                      className={`group cursor-pointer transition-all ${
                        idx % 2 === 0 ? "bg-card" : "bg-muted/5"
                      } hover:bg-primary/5 ${
                        selectedId === item.id ? "bg-primary/10 ring-1 ring-inset ring-primary/20" : ""
                      }`}
                    >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-6 py-4 text-sm font-medium text-foreground group-hover:text-primary transition-colors ${col.className || ""}`}
                      >
                        <div className="flex items-center min-h-[40px]">
                          {typeof col.accessor === "function"
                            ? col.accessor(item)
                            : (item[col.accessor] as React.ReactNode)}
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          onClick={(e) => { e.stopPropagation(); onRowClick?.(item); }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={(e) => { e.stopPropagation(); onPageChange(currentPage! - 1); }}
              className="px-4 h-10 flex items-center gap-2 rounded-xl bg-white border border-border shadow-sm text-[11px] font-bold text-slate-600 hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            
            <div className="flex items-center gap-1.5 mx-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1; // Simplistic for now
                    return (
                        <button
                            key={pageNum}
                            onClick={(e) => { e.stopPropagation(); onPageChange(pageNum); }}
                            className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-all ${
                                currentPage === pageNum 
                                ? "bg-primary text-white shadow-md shadow-primary/20" 
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {pageNum}
                        </button>
                    )
                })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={(e) => { e.stopPropagation(); onPageChange(currentPage! + 1); }}
              className="px-4 h-10 flex items-center gap-2 rounded-xl bg-white border border-border shadow-sm text-[11px] font-bold text-slate-600 hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
