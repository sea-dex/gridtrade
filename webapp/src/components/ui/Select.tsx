'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useMemo,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

/* ─── Context ─── */
interface SelectContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  onValueChange: (v: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  registeredItems: string[];
  registerItem: (value: string) => void;
  listboxId: string;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within <Select>');
  return ctx;
}

/* ─── Root ─── */
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpenState] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [registeredItems, setRegisteredItems] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const setOpen = useCallback(
    (v: boolean) => {
      if (disabled) return;
      setOpenState(v);
      if (!v) {
        setActiveIndex(-1);
      }
    },
    [disabled]
  );

  const handleValueChange = useCallback(
    (v: string) => {
      onValueChange(v);
      setOpenState(false);
      setActiveIndex(-1);
      // Return focus to trigger after paint to avoid layout thrash
      requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [onValueChange]
  );

  const registerItem = useCallback((itemValue: string) => {
    setRegisteredItems((prev) => {
      if (prev.includes(itemValue)) return prev;
      return [...prev, itemValue];
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      value,
      onValueChange: handleValueChange,
      triggerRef,
      activeIndex,
      setActiveIndex,
      registeredItems,
      registerItem,
      listboxId,
    }),
    [open, setOpen, value, handleValueChange, activeIndex, registeredItems, registerItem, listboxId]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

/* ─── Trigger ─── */
interface SelectTriggerProps {
  className?: string;
  placeholder?: string;
  children?: ReactNode;
  disabled?: boolean;
}

export function SelectTrigger({ className, placeholder, children, disabled }: SelectTriggerProps) {
  const { open, setOpen, triggerRef, registeredItems, setActiveIndex, value, listboxId } = useSelectContext();

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      const idx = registeredItems.indexOf(value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={() => setOpen(!open)}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex h-10 w-full items-center justify-between px-3.5',
        'rounded-(--radius-md)',
        'bg-(--bg-inset) border border-(--border-default)',
        'text-sm text-(--text-primary)',
        'hover:border-(--border-strong)',
        'focus:border-(--accent-muted) focus:outline-none',
        'transition-colors duration-150',
        'cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-(--border-default)',
        className
      )}
    >
      <span className={cn('truncate', !children && 'text-(--text-disabled)')}>
        {children || placeholder || 'Select...'}
      </span>
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-(--text-tertiary) transition-transform duration-200',
          open && 'rotate-180'
        )}
      />
    </button>
  );
}

/* ─── Content (dropdown) ─── */
interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

export function SelectContent({ className, children }: SelectContentProps) {
  const { open, setOpen, triggerRef, activeIndex, setActiveIndex, registeredItems, onValueChange, listboxId } =
    useSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const content = contentRef.current;
      const trigger = triggerRef.current;
      if (
        content &&
        !content.contains(e.target as Node) &&
        trigger &&
        !trigger.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  // Keyboard navigation inside dropdown
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const count = registeredItems.length;
      if (!count) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(activeIndex < count - 1 ? activeIndex + 1 : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(activeIndex > 0 ? activeIndex - 1 : count - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < count) {
          onValueChange(registeredItems[activeIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, activeIndex, setActiveIndex, registeredItems, onValueChange]);

  // Scroll active item into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const content = contentRef.current;
    const el = content?.querySelector(`[data-select-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  // Always render children so items stay registered; hide visually when closed
  return (
    <div
      ref={contentRef}
      id={listboxId}
      role="listbox"
      className={cn(
        'absolute z-50 mt-1 w-full',
        'max-h-[220px] overflow-y-auto',
        'rounded-(--radius-md)',
        'bg-(--bg-elevated) border border-(--border-default)',
        'shadow-(--shadow-lg)',
        'py-1',
        'transition-opacity duration-150 ease-out',
        open
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none invisible',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── Item ─── */
interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  description?: string;
}

export function SelectItem({ value: itemValue, children, className, description }: SelectItemProps) {
  const { value, onValueChange, registerItem, activeIndex, registeredItems } = useSelectContext();

  // Register on mount (never unregister — items are stable)
  useEffect(() => {
    registerItem(itemValue);
  }, [itemValue, registerItem]);

  const isSelected = value === itemValue;
  const itemIndex = registeredItems.indexOf(itemValue);
  const isActive = activeIndex === itemIndex;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-select-index={itemIndex}
      onClick={() => onValueChange(itemValue)}
      className={cn(
        'relative flex items-center px-3 py-2 cursor-pointer select-none',
        'text-sm text-(--text-primary)',
        'transition-colors duration-100',
        'hover:bg-[rgba(136,150,171,0.08)]',
        isActive && 'bg-[rgba(136,150,171,0.08)]',
        isSelected && 'text-(--accent)',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="truncate">{children}</div>
        {description && (
          <div className="text-[11px] text-(--text-tertiary) truncate mt-0.5">
            {description}
          </div>
        )}
      </div>
      {isSelected && <Check className="h-4 w-4 shrink-0 ml-2 text-(--accent)" />}
    </div>
  );
}
