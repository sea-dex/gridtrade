'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { DocsSidebar } from './_components/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile sidebar toggle */}
        <div className="sticky top-0 z-30 flex items-center gap-2 px-5 py-2 bg-(--bg-base)/95 backdrop-blur-sm border-b border-(--border-subtle) md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-(--text-secondary)">Documentation</span>
        </div>

        <div className="max-w-4xl mx-auto px-5 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
