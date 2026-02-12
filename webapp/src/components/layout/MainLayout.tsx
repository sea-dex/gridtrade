'use client';

import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-(--bg-base) text-(--text-primary)">
      {/* Ambient background glow — very subtle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] left-1/3 w-[700px] h-[700px] bg-(--accent) opacity-[0.018] blur-[180px] rounded-full" />
        <div className="absolute top-1/2 -right-[100px] w-[500px] h-[500px] bg-[#6366f1] opacity-[0.012] blur-[180px] rounded-full" />
      </div>

      <Header />

      <main className="relative min-h-[calc(100vh-3.5rem-33px)]">
        {children}
      </main>
    </div>
  );
}
