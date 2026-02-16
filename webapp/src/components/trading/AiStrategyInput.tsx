'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useAiStrategy, type AiStrategyResult, type AiStrategyResponse } from '@/hooks/useAiStrategy';

interface AiStrategyInputProps {
  baseToken?: {
    address: string;
    symbol: string;
    decimals: number;
  };
  quoteToken?: {
    address: string;
    symbol: string;
    decimals: number;
  };
  currentPrice: number | null;
  onStrategyGenerated: (strategy: AiStrategyResult) => void;
}

export function AiStrategyInput({
  baseToken,
  quoteToken,
  currentPrice,
  onStrategyGenerated,
}: AiStrategyInputProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const { generate, isLoading, error } = useAiStrategy();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const canSubmit =
    prompt.trim().length > 0 &&
    !isLoading &&
    !!baseToken &&
    !!quoteToken &&
    currentPrice !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setQuestions(null);
    setAnalysis(null);

    const result: AiStrategyResponse | undefined = await generate({
      prompt: prompt.trim(),
      baseToken: baseToken!,
      quoteToken: quoteToken!,
      currentPrice: currentPrice!,
    });

    if (result) {
      if (result.status === 'success') {
        onStrategyGenerated(result.strategy);
        setAnalysis(result.analysis);
        setQuestions(null);
      } else if (result.status === 'clarify') {
        setQuestions(result.questions);
        setAnalysis(result.analysis);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Scroll analysis into view when it appears
  useEffect(() => {
    if ((analysis || questions) && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [analysis, questions]);

  return (
    <div className="mt-3 space-y-2">
      {/* Input area */}
      <div className="relative">
        <div className="absolute left-3 top-3 text-(--text-disabled)">
          <Sparkles size={16} />
        </div>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('ai.input_placeholder')}
          disabled={isLoading}
          rows={4}
          className={cn(
            'w-full rounded-md border bg-(--bg-inset) pl-9 pr-3.5 py-2.5',
            'text-sm text-(--text-primary) placeholder-(--text-disabled)',
            'border-(--border-default) transition-colors duration-150',
            'focus:border-(--accent-muted) focus:outline-none',
            'hover:border-(--border-strong)',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none',
          )}
        />
        <div className="absolute right-2 bottom-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              canSubmit
                ? 'bg-(--accent) text-(--bg-base) hover:opacity-90 active:scale-[0.97]'
                : 'bg-(--bg-elevated) text-(--text-disabled) cursor-not-allowed border border-(--border-default)',
            )}
          >
            {isLoading ? (
              <>
                <Sparkles size={14} className="animate-spin" />
                <span>{t('ai.generating')}</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>{t('ai.generate')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-(--red)">
          <AlertCircle size={14} className="shrink-0" />
          <span>{t('ai.error')}</span>
        </div>
      )}

      {/* Clarifying questions */}
      {questions && questions.length > 0 && (
        <div
          ref={!analysis ? analysisRef : undefined}
          className="px-4 py-3 rounded-md border border-amber-500/30 bg-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-500">
              {t('ai.clarify_title')}
            </span>
          </div>
          {analysis && (
            <p className="text-sm text-(--text-secondary) leading-relaxed mb-2">
              {analysis}
            </p>
          )}
          <ul className="space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-(--text-primary)">
                <span className="text-(--text-disabled) shrink-0 mt-0.5">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-(--text-disabled)">
            {t('ai.clarify_hint')}
          </p>
        </div>
      )}

      {/* Analysis result (success mode) */}
      {analysis && !questions && (
        <div
          ref={analysisRef}
          className="px-4 py-3 rounded-md border border-(--accent-muted)/30 bg-(--accent)/5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-(--accent)" />
            <span className="text-xs font-medium text-(--accent)">
              {t('ai.analysis_title')}
            </span>
          </div>
          <p className="text-sm text-(--text-secondary) leading-relaxed">
            {analysis}
          </p>
          <div className="mt-2 text-[10px] text-(--text-disabled)">
            {t('ai.powered_by')}
          </div>
        </div>
      )}
    </div>
  );
}
