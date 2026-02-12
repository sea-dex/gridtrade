import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-150 ease-out',
      'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
      'disabled:opacity-40 disabled:pointer-events-none',
      'select-none cursor-pointer',
    ].join(' ');

    const variants: Record<string, string> = {
      primary: [
        'bg-(--accent) text-(--bg-base) font-semibold',
        'hover:bg-(--accent-muted) hover:shadow-[0_2px_16px_rgba(255,255,255,0.12)]',
        'active:brightness-95 active:scale-[0.98]',
        'rounded-(--radius-md)',
      ].join(' '),
      secondary: [
        'bg-(--bg-elevated) text-(--text-primary)',
        'border border-(--border-default)',
        'hover:bg-(--bg-surface) hover:border-(--border-strong)',
        'active:scale-[0.98]',
        'rounded-(--radius-md)',
      ].join(' '),
      outline: [
        'bg-transparent text-(--accent)',
        'border border-(--accent-border-hover)',
        'hover:bg-(--accent-dim) hover:border-(--accent)',
        'active:scale-[0.98]',
        'rounded-(--radius-md)',
      ].join(' '),
      ghost: [
        'bg-transparent text-(--text-secondary)',
        'hover:text-(--text-primary) hover:bg-[rgba(136,150,171,0.06)]',
        'active:scale-[0.98]',
        'rounded-(--radius-sm)',
      ].join(' '),
      danger: [
        'bg-(--red-dim) text-(--red)',
        'border border-[rgba(248,113,113,0.15)]',
        'hover:bg-[rgba(248,113,113,0.18)] hover:border-[rgba(248,113,113,0.3)]',
        'active:scale-[0.98]',
        'rounded-(--radius-md)',
      ].join(' '),
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-[15px] gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
