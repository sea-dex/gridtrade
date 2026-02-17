'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { docsNavigation, type NavPage } from '../_lib/docsNav';
import { cn } from '@/lib/utils';

export function DocsSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Find the currently active page
  const activePage = docsNavigation.find((p) => p.href === pathname) ?? docsNavigation[0];

  // Scroll-spy: observe heading elements for the active page
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const headings = activePage.sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    );

    headings.forEach((el) => observerRef.current!.observe(el));
  }, [activePage.sections]);

  useEffect(() => {
    // Small delay to let page render
    const timer = setTimeout(setupObserver, 100);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  // Reset active section on page change
  useEffect(() => {
    setActiveSection('');
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#0b1221]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-(--bg-surface) border-r border-(--border-subtle) overflow-y-auto pt-32 pb-8 px-3 transition-transform duration-200 md:sticky md:top-0 md:z-0 md:translate-x-0 md:pt-6 md:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <nav className="space-y-1">
          {docsNavigation.map((page) => (
            <PageNavItem
              key={page.href}
              page={page}
              isActive={page.href === pathname}
              activeSection={activeSection}
              onLinkClick={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function PageNavItem({
  page,
  isActive,
  activeSection,
  onLinkClick,
}: {
  page: NavPage;
  isActive: boolean;
  activeSection: string;
  onLinkClick: () => void;
}) {
  return (
    <div className="mb-1">
      {/* Page-level link */}
      <Link
        href={page.href}
        onClick={onLinkClick}
        className={cn(
          'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'text-(--text-primary) bg-(--bg-elevated)'
            : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)/50',
        )}
      >
        {page.title}
      </Link>

      {/* Section anchors — only show for the active page */}
      {isActive && page.sections.length > 0 && (
        <div className="ml-3 mt-1 border-l border-(--border-subtle) pl-3 space-y-0.5">
          {page.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={onLinkClick}
              className={cn(
                'block px-2 py-1.5 rounded text-xs transition-colors',
                activeSection === section.id
                  ? 'text-(--text-primary) bg-(--accent-dim)'
                  : 'text-(--text-tertiary) hover:text-(--text-secondary)',
              )}
            >
              {section.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
