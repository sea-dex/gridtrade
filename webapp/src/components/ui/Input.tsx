import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  inputPrefix?: React.ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, suffix, inputPrefix, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-(--text-secondary) mb-1.5 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative group">
          {inputPrefix && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-tertiary)">
              {inputPrefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-(--radius-md) border bg-(--bg-inset) px-3.5 py-2.5',
              'text-sm text-(--text-primary) placeholder-(--text-disabled)',
              'border-(--border-default) transition-colors duration-150',
              'focus:border-(--accent-muted) focus:outline-none',
              'hover:border-(--border-strong)',
              inputPrefix && 'pl-10',
              suffix && 'pr-14',
              error && 'border-(--red) focus:border-(--red)',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--text-tertiary) text-xs font-medium">
              {suffix}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1 text-[11px] text-(--text-disabled)">{hint}</p>
        )}
        {error && <p className="mt-1 text-[11px] text-(--red)">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Token amount input — Kamino style
interface TokenInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  balance?: string;
  tokenSymbol?: string;
  tokenIcon?: React.ReactNode;
  onMax?: () => void;
  onHalf?: () => void;
}

export const TokenInput = forwardRef<HTMLInputElement, TokenInputProps>(
  ({ className, label, balance, tokenSymbol, tokenIcon, onMax, onHalf, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label className="text-xs text-(--text-tertiary)">{label}</label>
          )}
          {balance && (
            <span className="text-[11px] text-(--text-disabled)">
              Available: <span className="text-(--text-secondary)">{balance}</span>
            </span>
          )}
        </div>
        <div className="relative bg-(--bg-inset) rounded-(--radius-lg) border border-(--border-default) p-4 transition-colors duration-150 focus-within:border-(--accent-muted)">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              {tokenIcon || (
                <div className="w-7 h-7 rounded-full bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-(--text-secondary)">
                    {tokenSymbol?.slice(0, 2) || '??'}
                  </span>
                </div>
              )}
              <span className="text-sm font-semibold text-(--text-primary)">{tokenSymbol || 'Select'}</span>
            </div>
            <input
              ref={ref}
              type="number"
              className={cn(
                'flex-1 bg-transparent text-right text-xl font-semibold text-(--text-primary) placeholder-(--text-disabled) focus:outline-none min-w-0',
                className
              )}
              placeholder="0"
              {...props}
            />
          </div>
          {(onHalf || onMax) && (
            <div className="flex items-center justify-end gap-1.5 mt-2.5">
              {onHalf && (
                <button
                  type="button"
                  onClick={onHalf}
                  className="px-2.5 py-0.5 text-[11px] font-medium text-(--text-secondary) bg-(--bg-elevated) border border-(--border-default) rounded-(--radius-sm) hover:text-(--text-primary) hover:border-(--border-strong) transition-colors duration-150"
                >
                  Half
                </button>
              )}
              {onMax && (
                <button
                  type="button"
                  onClick={onMax}
                  className="px-2.5 py-0.5 text-[11px] font-medium text-(--text-secondary) bg-(--bg-elevated) border border-(--border-default) rounded-(--radius-sm) hover:text-(--text-primary) hover:border-(--border-strong) transition-colors duration-150"
                >
                  Max
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TokenInput.displayName = 'TokenInput';
