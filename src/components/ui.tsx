import { useState, type ReactNode } from 'react';
import type { Box } from '../model/types';
import type { Regel } from '../tax/calc';

const eurFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const eur = (n: number) => eurFmt.format(Math.round(n));
export const eurSigned = (n: number) => (n > 0 ? '+' : '') + eur(n);

export const BOX_KLEUR: Record<Box, string> = { 1: '#2563eb', 2: '#9333ea', 3: '#059669' };
export const BOX_NAAM: Record<Box, string> = {
  1: 'Box 1 · werk en woning',
  2: 'Box 2 · aanmerkelijk belang',
  3: 'Box 3 · sparen en beleggen',
};

export function Card({ titel, children, actie }: { titel?: ReactNode; children: ReactNode; actie?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {(titel || actie) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {titel && <h2 className="text-base font-semibold text-slate-900">{titel}</h2>}
          {actie}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, waarde, sub }: { label: string; waarde: string; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{waarde}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function GetalInput({
  waarde,
  onChange,
  suffix,
  stap = 1,
  className = '',
  label,
}: {
  waarde: number;
  onChange: (n: number) => void;
  suffix?: string;
  stap?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex items-center rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${className}`}>
      {suffix === '€' && <span className="pl-2 text-sm text-slate-400">€</span>}
      <input
        type="number"
        aria-label={label}
        step={stap}
        className="w-full min-w-0 bg-transparent px-2 py-1.5 text-right text-sm tabular-nums outline-none"
        value={Number.isFinite(waarde) ? waarde : 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
      {suffix && suffix !== '€' && <span className="pr-2 text-sm text-slate-400">{suffix}</span>}
    </div>
  );
}

export function Knop({
  children,
  onClick,
  variant = 'secundair',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primair' | 'secundair' | 'gevaar';
  type?: 'button' | 'submit';
}) {
  const stijl = {
    primair: 'bg-blue-600 text-white hover:bg-blue-700',
    secundair: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    gevaar: 'text-red-600 hover:bg-red-50',
  }[variant];
  return (
    <button type={type} onClick={onClick} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${stijl}`}>
      {children}
    </button>
  );
}

export function Uitleg({ regels }: { regels: Regel[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs font-medium text-blue-600 hover:underline">
        {open ? 'Verberg berekening' : 'Toon berekening'}
      </button>
      {open && (
        <table className="mt-2 w-full text-xs">
          <tbody>
            {regels.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1 pr-2 text-slate-600">{r.label}</td>
                <td className="py-1 text-right tabular-nums text-slate-900">{eur(r.bedrag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Leeg({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</p>;
}

/** formatter voor Recharts-tooltips (waarde kan leeg zijn) */
export const tooltipEur = (v: unknown) => eur(Number(v ?? 0));
