import React from 'react';

export interface FormattedTextProps {
  text?: string | null;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

function parseInline(content: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = content.split(tokenRegex);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={key} className="font-semibold text-slate-100">
          {parseInline(inner, `${key}-b`)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={key} className="italic text-slate-200">
          {parseInline(inner, `${key}-i`)}
        </em>
      );
    }

    return part;
  });
}

export function FormattedText({ text, className, as: Component = 'span' }: FormattedTextProps) {
  if (!text) return null;
  return <Component className={className}>{parseInline(text, 'ft')}</Component>;
}
