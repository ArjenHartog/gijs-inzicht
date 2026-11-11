import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { State } from '../model/store';
import { projecteer } from '../tax/calc';
import { Card, GetalInput, Leeg, eur, eurSigned, tooltipEur } from './ui';
import { alleScenarios } from './Scenarios';

const KLEUREN = ['#0f172a', '#2563eb', '#059669', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#65a30d'];

export function Toekomst({ state }: { state: State }) {
  const alle = alleScenarios(state);
  const [gekozen, setGekozen] = useState<string[]>(['huidig-2026', 'box3-2027', 'wwr-2028-kabinet', 'vwb-2030-kabinet3']);
  const [jaren, setJaren] = useState(15);
  const s = state.huidig;
  if (s.items.length === 0 && s.bvs.length === 0) return <Leeg>Vul eerst je bezittingen in onder Bezittingen of Huishouden.</Leeg>;

  const startJaar = new Date().getFullYear() + 1;
  const actief = alle.filter((x) => gekozen.includes(x.id));
  const projecties = actief.map((sc) => ({ sc, rijen: projecteer(s, sc.params, startJaar, jaren) }));
  const data = Array.from({ length: jaren + 1 }, (_, j) => {
    const r: Record<string, number> = { jaar: startJaar + j };
    projecties.forEach(({ sc, rijen }) => (r[sc.naam] = rijen.at(j)!.nettoVermogen));
    return r;
  });
  const basis = projecties.at(0);

  return (
    <div className="space-y-5">
      <Card
        titel="Netto vermogen in de toekomst per scenario"
        actie={
          <label className="flex items-center gap-2 text-sm">
            Jaren
            <GetalInput className="w-20" waarde={jaren} onChange={(n) => setJaren(Math.min(40, Math.max(1, Math.round(n))))} />
          </label>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Elk scenario wordt alsof het vanaf {startJaar} geldt. Opbrengsten in box 3 worden herbelegd, box 3-belasting gaat van je vermogen af,
          inkomen, BV-winst en schulden blijven gelijk. Kinderen worden ouder: vanaf 18 telt hun vermogen niet meer mee en vanaf 12 vervalt de
          combinatiekorting. Gebruikt de groei-% uit je invoer.
        </p>
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 16, right: 16, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="jaar" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} width={72} domain={['auto', 'auto']} />
              <Tooltip formatter={tooltipEur} />
              <Legend />
              {actief.map((sc, i) => (
                <Line key={sc.id} type="monotone" dataKey={sc.naam} stroke={KLEUREN[i % KLEUREN.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {basis && (
          <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Scenario</th>
                  <th className="px-2 py-2 text-right">Vermogen {startJaar + jaren}</th>
                  <th className="px-2 py-2 text-right">Totale belasting {jaren} jr</th>
                  <th className="px-2 py-2 text-right">Verschil vermogen t.o.v. {basis.sc.naam}</th>
                </tr>
              </thead>
              <tbody>
                {projecties.map(({ sc, rijen }) => {
                  const eind = rijen.at(-1)!;
                  return (
                    <tr key={sc.id} className="border-t border-slate-100">
                      <td className="px-2 py-2">{sc.naam}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{eur(eind.nettoVermogen)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{eur(eind.cumulatieveBelasting)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{eurSigned(eind.nettoVermogen - basis.rijen.at(-1)!.nettoVermogen)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titel="Scenario's in de projectie">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {alle.map((sc) => (
            <label key={sc.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={gekozen.includes(sc.id)}
                onChange={() => setGekozen((g) => (g.includes(sc.id) ? g.filter((x) => x !== sc.id) : [...g, sc.id]))}
              />
              {sc.naam}
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
