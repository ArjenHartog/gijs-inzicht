import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Box } from '../model/types';
import type { State } from '../model/store';
import { bereken, vermogenPerBox } from '../tax/calc';
import { PRESET_SCENARIOS } from '../tax/parameters';
import { BOX_KLEUR, BOX_NAAM, Card, Kpi, Leeg, Uitleg, eur } from './ui';

export function Dashboard({ state, naarInvoer }: { state: State; naarInvoer: () => void }) {
  const s = state.huidig;
  if (s.items.length === 0 && !s.inkomen.arbeid && !s.inkomen.box2Inkomen) {
    return (
      <Leeg>
        Nog geen gegevens. Ga naar{' '}
        <button className="font-medium text-blue-600 underline" onClick={naarInvoer}>
          Invoer
        </button>{' '}
        om je bezittingen, schulden en inkomen in te vullen, of laad de voorbeelddata.
      </Leeg>
    );
  }
  const basis = PRESET_SCENARIOS[0];
  const u = bereken(s, basis.params);
  const v = vermogenPerBox(s);
  const totaalNetto = v[1].netto + v[2].netto + v[3].netto;
  const totaalBezit = v[1].bezit + v[2].bezit + v[3].bezit;
  const totaalSchuld = v[1].schuld + v[2].schuld + v[3].schuld;
  const boxen: Box[] = [1, 2, 3];
  const taart = boxen.map((b) => ({ name: BOX_NAAM[b], box: b, value: Math.max(0, v[b].netto) })).filter((d) => d.value > 0);
  const effectief = u.box3WerkelijkRendement > 0 ? u.box3.belasting / u.box3WerkelijkRendement : null;
  const uitkomst = { 1: u.box1, 2: u.box2, 3: u.box3 } as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Netto vermogen" waarde={eur(totaalNetto)} sub={`${eur(totaalBezit)} bezit · ${eur(totaalSchuld)} schuld`} />
        <Kpi label="Belasting 2026 (schatting)" waarde={eur(u.totaal)} sub="Box 1 + 2 + 3, per jaar" />
        <Kpi label="Box 3-belasting" waarde={eur(u.box3.belasting)} sub={s.fiscaalPartner ? 'Met fiscaal partner' : 'Zonder fiscaal partner'} />
        <Kpi
          label="Box 3 als % van echt rendement"
          waarde={effectief === null ? '–' : `${Math.round(effectief * 100)}%`}
          sub={`Echt rendement box 3: ${eur(u.box3WerkelijkRendement)}`}
        />
      </div>

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
                <Tooltip formatter={(x: number) => eur(x)} />
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
              actie={<span className="text-lg font-semibold tabular-nums">{eur(uitkomst[b].belasting)}</span>}
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
              <Uitleg regels={uitkomst[b].regels} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
