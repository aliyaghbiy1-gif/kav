import React from 'react';
import { CheckCircle2, Clock3, FlaskConical } from 'lucide-react';
import type { FeatureStatus } from '../types/vorta';

interface StatusTextProps {
  status: FeatureStatus;
  lang?: 'fa' | 'en';
}

export const StatusText: React.FC<StatusTextProps> = ({ status, lang = 'fa' }) => {
  if (status === 'functional') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{lang === 'fa' ? 'متصل و آماده' : 'Functional'}</span>
      </span>
    );
  }
  if (status === 'demo') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
        <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{lang === 'fa' ? 'حالت دمو' : 'Demo'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
      <Clock3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{lang === 'fa' ? 'به‌زودی' : 'Coming Soon'}</span>
    </span>
  );
};
