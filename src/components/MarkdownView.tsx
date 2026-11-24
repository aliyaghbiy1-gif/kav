import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

/**
 * Safe React-based renderer for Persian/English prose, fenced code blocks,
 * bold inline text, and pipe-delimited Markdown tables (zero raw HTML injection).
 */
export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const segments = content.split(/(```[\s\S]*?```)/g);

  const handleCopyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // Clipboard blocked in restricted frame
    }
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            dir="ltr"
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-xs font-mono text-[#4F8CFF]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const renderBlockText = (block: string, blockIdx: number) => {
    const lines = block.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detect Markdown table
      if (
        line.trim().startsWith('|') &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].includes('-')
      ) {
        const headerCells = line
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        const rows: string[][] = [];
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(
            lines[i]
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean)
          );
          i++;
        }
        elements.push(
          <div key={`tbl-${blockIdx}-${i}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-[#151B2B]">
                <tr>
                  {headerCells.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-600 dark:text-slate-300 tabular-nums">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={`h4-${blockIdx}-${i}`} className="text-sm font-bold mt-3 mb-1 text-slate-900 dark:text-white">
            {renderInline(line.slice(4))}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={`h3-${blockIdx}-${i}`} className="text-base font-bold mt-3 mb-1.5 text-slate-900 dark:text-white">
            {renderInline(line.slice(3))}
          </h3>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={`sp-${blockIdx}-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${blockIdx}-${i}`} className="leading-7 text-sm text-slate-700 dark:text-slate-200">
            {renderInline(line)}
          </p>
        );
      }
      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-1">
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const inner = seg.slice(3, -3);
          const firstBreak = inner.indexOf('\n');
          const lang = firstBreak > -1 ? inner.slice(0, firstBreak).trim() : 'code';
          const code = firstBreak > -1 ? inner.slice(firstBreak + 1) : inner;

          return (
            <div
              key={idx}
              dir="ltr"
              className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono">{lang || 'text'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(code, idx)}
                  className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors"
                  aria-label="کپی کد"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <React.Fragment key={idx}>{renderBlockText(seg, idx)}</React.Fragment>;
      })}
    </div>
  );
};
