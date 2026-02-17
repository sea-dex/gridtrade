import React from 'react';

/* ─── Headings ─── */

export function DocH1({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h1
      id={id}
      className="text-2xl font-bold text-(--text-primary) mb-4 mt-0 scroll-mt-24"
    >
      {children}
    </h1>
  );
}

export function DocH2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xl font-semibold text-(--text-primary) mb-3 mt-10 first:mt-0 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

export function DocH3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="text-base font-semibold text-(--text-primary) mb-2 mt-6 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

/* ─── Text ─── */

export function DocP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-(--text-secondary) leading-relaxed mb-4">
      {children}
    </p>
  );
}

export function DocStrong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-(--text-primary)">{children}</strong>;
}

export function DocLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="text-(--accent) hover:text-(--accent-muted) underline underline-offset-2 transition-colors"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

/* ─── Lists ─── */

export function DocUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-inside text-sm text-(--text-secondary) space-y-1.5 mb-4 ml-1">
      {children}
    </ul>
  );
}

export function DocOl({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-inside text-sm text-(--text-secondary) space-y-1.5 mb-4 ml-1">
      {children}
    </ol>
  );
}

export function DocLi({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

/* ─── Table ─── */

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto mb-6 rounded-lg border border-(--border-subtle)">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-(--bg-elevated)">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-4 py-2.5 text-(--text-primary) font-semibold border-b border-(--border-subtle) whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-(--border-subtle) last:border-b-0 hover:bg-(--bg-elevated)/40 transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2.5 text-(--text-secondary) align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Code ─── */

export function DocCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-(--bg-elevated) text-(--text-primary) text-[13px] font-mono">
      {children}
    </code>
  );
}

export function DocCodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  return (
    <div className="mb-6 rounded-lg border border-(--border-subtle) overflow-hidden">
      {language && (
        <div className="px-4 py-1.5 bg-(--bg-elevated) border-b border-(--border-subtle) text-xs text-(--text-tertiary) font-mono">
          {language}
        </div>
      )}
      <pre className="p-4 bg-(--bg-inset) overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-(--text-secondary) font-mono whitespace-pre">
          {children}
        </code>
      </pre>
    </div>
  );
}

/* ─── Misc ─── */

export function DocBlockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-(--accent-dim) pl-4 py-1 mb-4 text-sm text-(--text-secondary) italic">
      {children}
    </blockquote>
  );
}

export function DocHr() {
  return <hr className="border-t border-(--border-subtle) my-8" />;
}

export function DocMethodBadge({
  method,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}) {
  const colors: Record<string, string> = {
    GET: 'bg-(--green-dim) text-(--green)',
    POST: 'bg-[rgba(99,102,241,0.10)] text-[#818cf8]',
    PUT: 'bg-(--amber-dim) text-(--amber)',
    DELETE: 'bg-(--red-dim) text-(--red)',
    PATCH: 'bg-[rgba(168,85,247,0.10)] text-[#a855f7]',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${colors[method] ?? ''}`}
    >
      {method}
    </span>
  );
}

export function DocEndpoint({
  method,
  path,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3 p-3 rounded-lg bg-(--bg-elevated) border border-(--border-subtle)">
      <DocMethodBadge method={method} />
      <code className="text-sm font-mono text-(--text-primary)">{path}</code>
    </div>
  );
}
