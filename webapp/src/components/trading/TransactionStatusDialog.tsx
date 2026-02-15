'use client';

import { useEffect, useMemo } from 'react';
import { X, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useChains } from 'wagmi';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TxStepStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped';

export interface TxStep {
  /** i18n key or plain label */
  label: string;
  /** Hash once the on-chain tx is submitted */
  hash?: `0x${string}`;
  status: TxStepStatus;
}

export interface TransactionStatusDialogProps {
  open: boolean;
  onClose: () => void;
  /** Title shown at the top of the dialog */
  title: string;
  /** Ordered list of transaction steps */
  steps: TxStep[];
  /** Overall error message (e.g. user rejected) */
  error?: string | null;
  /** The chain id – used to build explorer links */
  chainId?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TransactionStatusDialog(props: TransactionStatusDialogProps) {
  if (!props.open) return null;
  return <TransactionStatusDialogInner key="tx-dialog-open" {...props} />;
}

function TransactionStatusDialogInner({
  onClose,
  title,
  steps,
  error,
  chainId,
}: TransactionStatusDialogProps) {
  const { t } = useTranslation();
  const chains = useChains();

  // Derive explorer base URL from wagmi chain definitions
  const explorerUrl = useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.id === chainId);
    return chain?.blockExplorers?.default?.url;
  }, [chainId, chains]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll while dialog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const allDone = steps.length > 0 && steps.every((s) => s.status === 'done' || s.status === 'skipped');
  const hasError = !!error || steps.some((s) => s.status === 'error');
  const finalHash = steps.filter((s) => s.hash).at(-1)?.hash;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mt-[15vh] w-full max-w-[420px] mx-4 rounded-(--radius-xl) border border-(--border-default) bg-(--bg-surface) shadow-(--shadow-lg) animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-(--text-primary)">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--bg-inset) transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 pb-2 space-y-1">
          {steps.map((step, idx) => (
            <StepRow
              key={idx}
              step={step}
              index={idx}
              explorerUrl={explorerUrl}
              t={t}
            />
          ))}
        </div>

        {/* Error banner */}
        {hasError && (
          <div className="mx-5 mb-3 px-3.5 py-2.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-md flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <span className="text-[13px] text-red-400 leading-snug">
              {error || t('errors.transaction_failed')}
            </span>
          </div>
        )}

        {/* Success banner */}
        {allDone && !hasError && (
          <div className="mx-5 mb-3 px-3.5 py-2.5 bg-(--green-dim) border border-[rgba(52,211,153,0.15)] rounded-md flex items-start gap-2.5">
            <Check size={16} className="text-(--green) mt-0.5 shrink-0" />
            <span className="text-[13px] text-(--green) leading-snug">
              {t('tx_dialog.order_success')}
            </span>
          </div>
        )}

        {/* Footer with explorer link */}
        <div className="px-5 pb-5 pt-1 flex items-center justify-between">
          {finalHash && explorerUrl ? (
            <a
              href={`${explorerUrl}/tx/${finalHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-(--accent) hover:underline"
            >
              {t('common.view_on_explorer')}
              <ExternalLink size={13} />
            </a>
          ) : (
            <span />
          )}

          {(allDone || hasError) && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-(--accent) text-(--green) hover:opacity-90 transition-opacity"
            >
              {t('tx_dialog.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step Row                                                           */
/* ------------------------------------------------------------------ */

function StepRow({
  step,
  index,
  explorerUrl,
  t,
}: {
  step: TxStep;
  index: number;
  explorerUrl?: string;
  t: (key: string) => string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        step.status === 'active' && 'bg-(--bg-inset)',
        step.status === 'done' && 'opacity-70',
        step.status === 'skipped' && 'opacity-40',
      )}
    >
      {/* Status icon */}
      <div className="shrink-0 w-6 h-6 flex items-center justify-center">
        {step.status === 'pending' && (
          <div className="w-2.5 h-2.5 rounded-full border-2 border-(--border-default)" />
        )}
        {step.status === 'active' && (
          <Loader2 size={18} className="text-(--accent) animate-spin" />
        )}
        {step.status === 'done' && (
          <div className="w-5 h-5 rounded-full bg-(--green) flex items-center justify-center">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
        {step.status === 'error' && (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <X size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
        {step.status === 'skipped' && (
          <div className="w-2.5 h-2.5 rounded-full bg-(--text-tertiary)" />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm flex-1',
          step.status === 'active'
            ? 'text-(--text-primary) font-medium'
            : 'text-(--text-secondary)',
        )}
      >
        {step.label}
      </span>

      {/* Tx link */}
      {step.hash && explorerUrl && (step.status === 'done' || step.status === 'active') && (
        <a
          href={`${explorerUrl}/tx/${step.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--accent) hover:opacity-80 transition-opacity"
          title={t('common.view_on_explorer')}
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
