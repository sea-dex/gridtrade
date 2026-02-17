'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { docsNavigation } from '../_lib/docsNav';

export function DocsPageNav() {
  const pathname = usePathname();
  const currentIndex = docsNavigation.findIndex((p) => p.href === pathname);

  const prev = currentIndex > 0 ? docsNavigation[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < docsNavigation.length - 1
      ? docsNavigation[currentIndex + 1]
      : null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-stretch gap-4 mt-12 pt-8 border-t border-(--border-subtle)">
      {prev ? (
        <Link
          href={prev.href}
          className="flex-1 group flex items-center gap-3 p-4 rounded-lg border border-(--border-subtle) hover:border-(--border-default) hover:bg-(--bg-elevated)/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-(--text-disabled) group-hover:text-(--text-secondary) shrink-0 transition-colors" />
          <div className="text-right flex-1">
            <div className="text-xs text-(--text-tertiary) mb-0.5">Previous</div>
            <div className="text-sm font-medium text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="flex-1 group flex items-center gap-3 p-4 rounded-lg border border-(--border-subtle) hover:border-(--border-default) hover:bg-(--bg-elevated)/50 transition-colors"
        >
          <div className="flex-1">
            <div className="text-xs text-(--text-tertiary) mb-0.5">Next</div>
            <div className="text-sm font-medium text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
              {next.title}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-(--text-disabled) group-hover:text-(--text-secondary) shrink-0 transition-colors" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
