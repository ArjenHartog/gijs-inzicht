import { useState, type Dispatch } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Actie, State } from '../model/store';
import type { Situatie } from '../model/types';
import { vergelijk } from '../model/diff';
import { bereken, vermogenPerBox } from '../tax/calc';
import { PRESET_SCENARIOS } from '../tax/parameters';
import { BOX_KLEUR, BOX_NAAM, Card, Knop, Leeg, eur, eurSigned } from './ui';

const HUIDIG = 'huidig';
const netto = (s: Situatie) => {
  const v = vermogenPerBox(s);
  return v[1].netto + v[2].netto + v[3].netto;
};

export function Veranderingen({ state, dispatch }: { state: State; dispatch: Dispatch<Actie> }) {
  const snaps = state.snapshots;
  const [vanId, setVanId] = useState(snaps.at(-1)?.id ?? '');
  const [naarId, setNaarId] = useState(HUIDIG);

  if (snaps.length === 0) {
    return <Leeg>Nog geen momentopnames. Sla onder Invoer een momentopname op; daarna zie je hier wat er verandert.</Leeg>;
  }

  const kies = (id: string): Situatie | undefined => (id === HUIDIG ? state.huidig : snaps.find((x) => x.id === id));
  const van = kies(vanId) ?? snaps.at(-1)!;
  const naar = kies(naarId) ?? state.huidig;
  const d = vergelijk(van, naar);
  const p = PRESET_SCENARIOS[0].params;
  const belastingVerschil = bereken(naar, p).totaal - bereken(van, p).totaal;

  const reeks = [
    ...snaps.map((x) => ({ label: x.datum, netto: netto(x) })),
    { label: 'Nu', netto: netto(state.huidig) },
  ];

  const opties = (
    <>
      {snaps.map((x) => (
        <option key={x.id} value={x.id}>
          {x.datum}
          {x.notitie ? ` · ${x.notitie}` : ''}
        </option>
      ))}
      <option value={HUIDIG}>Huidige situatie</option>
    </>
  );

  return (
    <div className="space-y-5">
      <Card titel="Netto vermogen over tijd">
        <div className="h-60">
          <ResponsiveContainer>
            <LineChart data={reeks} margin={{ left: 16, right: 16, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} width={64} />
              <Tooltip formatter={(v: number) => eur(v)} />
              <Line type="monotone" dataKey="netto" name="Netto vermogen" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card titel="Wat is er veranderd?">
        <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
          <label>
            <span className="mb-1 block text-slate-600">Van</span>
            <select value={vanId} onChange={(e) => setVanId(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5">
              {opties}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-slate-600">Naar</span>
            <select value={naarId} onChange={(e) => setNaarId(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5">
              {opties}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Netto vermogen</div>
            <div className={`text-xl font-semibold tabular-nums ${d.totaal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{eurSigned(d.totaal)}</div>
          </div>
          {d.perBox.map((b) => (
            <div key={b.box} className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500" style={{ color: BOX_KLEUR[b.box] }}>
                {BOX_NAAM[b.box]}
              </div>
              <div className="text-xl font-semibold tabular-nums">{eurSigned(b.verschil)}</div>
            </div>
          ))}
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Belasting per jaar (2026-regels)</div>
            <div className="text-xl font-semibold tabular-nums">{eurSigned(belastingVerschil)}</div>
          </div>
        </div>

        {d.items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Geen verschillen in bezittingen of schulden.</p>
        ) : (
          <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Regel</th>
                  <th className="px-2 py-2">Box</th>
                  <th className="px-2 py-2 text-right">Van</th>
                  <th className="px-2 py-2 text-right">Naar</th>
                  <th className="px-2 py-2 text-right">Effect op vermogen</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((r, k) => (
                  <tr key={k} className="border-t border-slate-100">
                    <td className="px-2 py-2">
                      {r.naam}
                      {r.soort !== 'gewijzigd' && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs text-slate-600">{r.soort}</span>}
                    </td>
                    <td className="px-2 py-2">{r.box}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{eur(r.oud)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{eur(r.nieuw)}</td>
                    <td className={`px-2 py-2 text-right font-medium tabular-nums ${r.verschil >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{eurSigned(r.verschil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titel="Momentopnames">
        <ul className="divide-y divide-slate-100 text-sm">
          {snaps.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <strong>{x.datum}</strong> {x.notitie && <span className="text-slate-500">· {x.notitie}</span>}
                <span className="ml-2 tabular-nums text-slate-600">{eur(netto(x))}</span>
              </span>
              <span className="flex gap-1">
                <Knop onClick={() => dispatch({ type: 'snapshotHerstellen', id: x.id })}>Laad als huidig</Knop>
                <Knop variant="gevaar" onClick={() => dispatch({ type: 'snapshotVerwijderen', id: x.id })}>
                  Verwijder
                </Knop>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
