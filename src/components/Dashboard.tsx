import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Box } from '../model/types';
import type { State } from '../model/store';
import { bereken, vermogenPerBox } from '../tax/calc';
import { PRESET_SCENARIOS } from '../tax/parameters';
import { BOX_KLEUR, BOX_NAAM, Card, Kpi, Leeg, Uitleg, eur, tooltipEur } from './ui';

export function Dashboard({ state, naar }: { state: State; naar: (tab: 'Huishouden' | 'Bezittingen') => void }) {
  const s = state.huidig;
  const leeg = s.items.length === 0 && s.bvs.length === 0 && s.ondernemingen.length === 0 && !s.ik.loon && !s.ik.overigInkomen;
  if (leeg) {
    return (
      <Leeg>
        Nog geen gegevens. Begin bij{' '}
        <button className="font-medium text-blue-600 underline" onClick={() => naar('Huishouden')}>
          Huishouden
        </button>{' '}
        (inkomen, partner, kinderen, BV's, eenmanszaak) en{' '}
        <button className="font-medium text-blue-600 underline" onClick={() => naar('Bezittingen')}>
          Bezittingen
        </button>
        , of laad de voorbeelddata.
      </Leeg>
    );
  }
  const u = bereken(s, PRESET_SCENARIOS[0].params);
  const v = vermogenPerBox(s);
  const totaalNetto = v[1].netto + v[2].netto + v[3].netto;
  const boxen: Box[] = [1, 2, 3];
  const taart = boxen.map((b) => ({ name: BOX_NAAM[b], box: b, value: Math.max(0, v[b].netto) })).filter((d) => d.value > 0);
  const effectief = u.box3WerkelijkRendement > 0 ? u.box3 / u.box3WerkelijkRendement : null;
  const perBox = { 1: u.box1, 2: u.box2, 3: u.box3 } as const;
  const regels = { 1: u.regels.box1, 2: u.regels.box2, 3: u.regels.box3 } as const;
  const pctTekst = (f: number) => `${Math.round(f * 100)}%`;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Netto vermogen" waarde={eur(totaalNetto)} sub={s.partner ? `Huishouden ${s.ik.naam} en ${s.partner.naam}` : undefined} />
        <Kpi label="Inkomstenbelasting 2026" waarde={eur(u.inkomstenbelasting)} sub={`Box 1+2+3, na ${eur(u.kortingen)} heffingskortingen`} />
        <Kpi label="Vennootschapsbelasting" waarde={eur(u.vpbTotaal)} sub={s.bvs.length ? `${s.bvs.length} BV('s)` : 'Geen BV'} />
        <Kpi
          label="Box 3 als % van echt rendement"
          waarde={effectief === null ? '–' : `${Math.round(effectief * 100)}%`}
          sub={`Echt rendement box 3: ${eur(u.box3WerkelijkRendement)}`}
        />
      </div>

      {u.signalen.length > 0 && (
        <Card titel="Let op">
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {u.signalen.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card titel="Belasting per persoon (2026)">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2" />
                {u.personen.map((p) => (
                  <th key={p.id} className="px-2 py-2 text-right">
                    {p.naam}
                  </th>
                ))}
                {u.personen.length > 1 && <th className="px-2 py-2 text-right">Samen</th>}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Box 1', (p) => p.box1Belasting],
                  ['Box 2', (p) => p.box2Belasting],
                  ['Box 3', (p) => p.box3Belasting],
                  ['Heffingskortingen', (p) => -p.kortingenBenut],
                  ['Inkomstenbelasting', (p) => p.totaal],
                ] as [string, (p: (typeof u.personen)[number]) => number][]
              ).map(([label, f], i, arr) => (
                <tr key={label} className={`border-t border-slate-100 ${i === arr.length - 1 ? 'font-semibold' : ''}`}>
                  <td className="px-2 py-2">{label}</td>
                  {u.personen.map((p) => (
                    <td key={p.id} className="px-2 py-2 text-right tabular-nums">
                      {eur(f(p))}
                    </td>
                  ))}
                  {u.personen.length > 1 && <td className="px-2 py-2 text-right tabular-nums">{eur(u.personen.reduce((t, p) => t + f(p), 0))}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {u.verdeling && s.partner && (
          <p className="mt-3 text-xs text-slate-500">
            Gunstigste verdeling bij {s.ik.naam}: eigen woning {pctTekst(u.verdeling.woning)}, box 2-inkomen {pctTekst(u.verdeling.box2)}, box 3{' '}
            {pctTekst(u.verdeling.box3)} (rest bij {s.partner.naam}). Deze verdeling kies je in de aangifte zelf.
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card titel="Vermogen per box">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={taart} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {taart.map((d) => (
                    <Cell key={d.box} fill={BOX_KLEUR[d.box]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipEur} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-sm">
            {boxen.map((b) => (
              <li key={b} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: BOX_KLEUR[b] }} />
                  {BOX_NAAM[b]}
                </span>
                <span className="tabular-nums">{eur(v[b].netto)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          {boxen.map((b) => (
            <Card
              key={b}
              titel={
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: BOX_KLEUR[b] }} />
                  {BOX_NAAM[b]}
                </span>
              }
              actie={<span className="text-lg font-semibold tabular-nums">{eur(perBox[b])}</span>}
            >
              <div className="mb-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                <div>
                  Bezit <div className="text-sm font-medium tabular-nums text-slate-900">{eur(v[b].bezit)}</div>
                </div>
                <div>
                  Schuld <div className="text-sm font-medium tabular-nums text-slate-900">{eur(v[b].schuld)}</div>
                </div>
                <div>
                  Netto <div className="text-sm font-medium tabular-nums text-slate-900">{eur(v[b].netto)}</div>
                </div>
              </div>
              {b === 1 && <p className="mb-1 text-xs text-slate-500">Bedrag rechtsboven is na aftrek van heffingskortingen.</p>}
              <Uitleg regels={regels[b]} />
            </Card>
          ))}
          {s.bvs.length > 0 && (
            <Card titel="Vennootschapsbelasting (BV's)" actie={<span className="text-lg font-semibold tabular-nums">{eur(u.vpbTotaal)}</span>}>
              <Uitleg regels={u.regels.vpb} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
