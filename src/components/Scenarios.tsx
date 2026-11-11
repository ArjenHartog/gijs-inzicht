import { useState, type Dispatch } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIES, type Category } from '../model/types';
import { nieuwId, type Actie, type State } from '../model/store';
import { bereken } from '../tax/calc';
import { PRESET_SCENARIOS, pct, type Scenario, type TaxParams } from '../tax/parameters';
import { BOX_KLEUR, Card, GetalInput, Knop, Leeg, Uitleg, eur, eurSigned, tooltipEur } from './ui';

const STATUS_LABEL: Record<Scenario['status'], string> = {
  geldend: 'Geldend recht',
  voorstel: 'Wetsvoorstel',
  kabinetsoptie: 'Kabinetsoptie',
  hypothetisch: 'Hypothetisch',
  eigen: 'Eigen scenario',
};
const STATUS_KLEUR: Record<Scenario['status'], string> = {
  geldend: 'bg-emerald-100 text-emerald-800',
  voorstel: 'bg-blue-100 text-blue-800',
  kabinetsoptie: 'bg-amber-100 text-amber-800',
  hypothetisch: 'bg-slate-100 text-slate-700',
  eigen: 'bg-purple-100 text-purple-800',
};

export const alleScenarios = (s: State) => [...PRESET_SCENARIOS, ...s.eigenScenarios];

export function Scenarios({ state, dispatch }: { state: State; dispatch: Dispatch<Actie> }) {
  const alle = alleScenarios(state);
  const [gekozen, setGekozen] = useState<string[]>(['huidig-2026', 'box3-2027', 'wwr-2028-kabinet', 'vwb-2030-kabinet3', 'woning-box3']);
  const [bewerk, setBewerk] = useState<Scenario | null>(null);
  const s = state.huidig;

  if (s.items.length === 0 && s.bvs.length === 0 && s.ondernemingen.length === 0 && !s.ik.loon) return <Leeg>Vul eerst je situatie in onder Huishouden en Bezittingen.</Leeg>;

  const basis = bereken(s, PRESET_SCENARIOS[0].params);
  const actief = alle.filter((x) => gekozen.includes(x.id));
  const rijen = actief.map((sc) => ({ sc, u: bereken(s, sc.params) }));
  const grafiek = rijen.map(({ sc, u }) => ({
    naam: sc.naam,
    'Box 1 (na kortingen)': Math.round(u.box1),
    'Box 2': Math.round(u.box2),
    'Box 3': Math.round(u.box3),
    Vpb: Math.round(u.vpbTotaal),
  }));

  const toggle = (id: string) => setGekozen((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <div className="space-y-5">
      <Card titel="Belasting per jaar per scenario, op je huidige situatie">
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={grafiek} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="naam" tick={{ fontSize: 11 }} interval={0} height={70} tickFormatter={(n: string) => (n.length > 28 ? n.slice(0, 27) + '…' : n)} angle={-12} textAnchor="end" />
              <YAxis tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} width={56} />
              <Tooltip formatter={tooltipEur} />
              <Legend />
              <Bar dataKey="Box 1 (na kortingen)" stackId="a" fill={BOX_KLEUR[1]} />
              <Bar dataKey="Box 2" stackId="a" fill={BOX_KLEUR[2]} />
              <Bar dataKey="Box 3" stackId="a" fill={BOX_KLEUR[3]} />
              {s.bvs.length > 0 && <Bar dataKey="Vpb" stackId="a" fill="#64748b" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Scenario</th>
                <th className="px-2 py-2 text-right">Box 1*</th>
                <th className="px-2 py-2 text-right">Box 2</th>
                <th className="px-2 py-2 text-right">Box 3</th>
                <th className="px-2 py-2 text-right">Vpb</th>
                <th className="px-2 py-2 text-right">Totaal</th>
                <th className="px-2 py-2 text-right">t.o.v. nu</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map(({ sc, u }) => (
                <tr key={sc.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2">
                    <div className="font-medium">{sc.naam}</div>
                    <div className="mt-1">
                      <Uitleg regels={[...u.regels.box3, ...u.regels.box1]} />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{eur(u.box1)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{eur(u.box2)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{eur(u.box3)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{eur(u.vpbTotaal)}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{eur(u.totaal)}</td>
                  <td className={`px-2 py-2 text-right font-medium tabular-nums ${u.totaal - basis.totaal > 0 ? 'text-red-700' : u.totaal < basis.totaal ? 'text-emerald-700' : ''}`}>
                    {eurSigned(u.totaal - basis.totaal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          * Box 1 na aftrek van heffingskortingen. Alle scenario's rekenen met je huidige situatie en de leeftijd van je kinderen nu
          {s.partner ? ', met per scenario de gunstigste verdeling tussen partners' : ''}.
        </p>
      </Card>

      {bewerk && (
        <ScenarioEditor
          scenario={bewerk}
          onAnnuleer={() => setBewerk(null)}
          onOpslaan={(sc) => {
            dispatch({ type: 'scenarioOpslaan', scenario: sc });
            setGekozen((g) => (g.includes(sc.id) ? g : [...g, sc.id]));
            setBewerk(null);
          }}
        />
      )}

      <Card titel="Kies scenario's">
        <p className="mb-3 text-sm text-slate-600">
          Vink aan wat je wilt vergelijken. Met <strong>Aanpassen</strong> maak je een eigen kopie waarin je elk tarief, forfait en elke
          vrijstelling kunt wijzigen. Zo reken je elk denkbaar scenario door.
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {alle.map((sc) => (
            <li key={sc.id} className={`rounded-lg border p-3 ${gekozen.includes(sc.id) ? 'border-blue-400 bg-blue-50/40' : 'border-slate-200'}`}>
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={gekozen.includes(sc.id)} onChange={() => toggle(sc.id)} />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{sc.naam}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_KLEUR[sc.status]}`}>
                      {STATUS_LABEL[sc.status]} · {sc.jaar}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">{sc.toelichting}</span>
                </span>
              </label>
              <div className="mt-2 flex gap-1 pl-6">
                <Knop
                  onClick={() =>
                    setBewerk(
                      sc.status === 'eigen'
                        ? structuredClone(sc)
                        : { ...structuredClone(sc), id: nieuwId(), naam: `${sc.naam} (eigen)`, status: 'eigen' },
                    )
                  }
                >
                  Aanpassen
                </Knop>
                {sc.status === 'eigen' && (
                  <Knop variant="gevaar" onClick={() => dispatch({ type: 'scenarioVerwijderen', id: sc.id })}>
                    Verwijder
                  </Knop>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PctVeld({ label, waarde, onChange }: { label: string; waarde: number; onChange: (f: number) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      <GetalInput suffix="%" stap={0.01} waarde={Math.round(waarde * 10000) / 100} onChange={(n) => onChange(n / 100)} />
    </label>
  );
}
function EurVeld({ label, waarde, onChange }: { label: string; waarde: number; onChange: (n: number) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      <GetalInput suffix="€" stap={100} waarde={waarde} onChange={onChange} />
    </label>
  );
}

function ScenarioEditor({ scenario, onOpslaan, onAnnuleer }: { scenario: Scenario; onOpslaan: (s: Scenario) => void; onAnnuleer: () => void }) {
  const [sc, setSc] = useState<Scenario>(scenario);
  const p = sc.params;
  const zet = (f: (p: TaxParams) => void) =>
    setSc((x) => {
      const n = structuredClone(x);
      f(n.params);
      return n;
    });
  const box3Cats = (Object.keys(CATEGORIES) as Category[]).filter((c) => CATEGORIES[c].box === 3 && !CATEGORIES[c].isSchuld);

  return (
    <Card titel="Scenario aanpassen" actie={<span className="text-xs text-slate-500">Wijzigingen gelden alleen voor dit eigen scenario</span>}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Naam</span>
            <input className="w-full rounded-md border border-slate-300 px-2 py-1.5" value={sc.naam} onChange={(e) => setSc({ ...sc, naam: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Jaar</span>
            <GetalInput waarde={sc.jaar} onChange={(n) => setSc({ ...sc, jaar: n })} />
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: BOX_KLEUR[1] }}>
            Box 1
          </legend>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.box1.schijven.map((s, i) => (
              <div key={i} className="contents">
                <PctVeld label={`Tarief schijf ${i + 1}`} waarde={s.tarief} onChange={(f) => zet((q) => void (q.box1.schijven[i].tarief = f))} />
                {s.tot !== null && <EurVeld label={`Grens schijf ${i + 1}`} waarde={s.tot} onChange={(n) => zet((q) => void (q.box1.schijven[i].tot = n))} />}
              </div>
            ))}
            <PctVeld label="Eigenwoningforfait" waarde={p.box1.ewf} onChange={(f) => zet((q) => void (q.box1.ewf = f))} />
            <PctVeld label="Max. aftrektarief hypotheekrente" waarde={p.box1.hraMaxTarief} onChange={(f) => zet((q) => void (q.box1.hraMaxTarief = f))} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={p.box1.eigenWoningNaarBox3} onChange={(e) => zet((q) => void (q.box1.eigenWoningNaarBox3 = e.target.checked))} />
              Eigen woning naar box 3
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: BOX_KLEUR[1] }}>
            Heffingskortingen en ondernemers
          </legend>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <EurVeld label="Algemene heffingskorting max." waarde={p.kortingen.ahkMax} onChange={(n) => zet((q) => void (q.kortingen.ahkMax = n))} />
            <EurVeld label="AHK-afbouw vanaf (verzamelinkomen)" waarde={p.kortingen.ahkAfbouwVanaf} onChange={(n) => zet((q) => void (q.kortingen.ahkAfbouwVanaf = n))} />
            <PctVeld label="AHK-afbouw %" waarde={p.kortingen.ahkAfbouwPct} onChange={(f) => zet((q) => void (q.kortingen.ahkAfbouwPct = f))} />
            <EurVeld label="Arbeidskorting max." waarde={p.kortingen.akMax} onChange={(n) => zet((q) => void (q.kortingen.akMax = n))} />
            <PctVeld label="Arbeidskorting afbouw %" waarde={p.kortingen.akAfbouwPct} onChange={(f) => zet((q) => void (q.kortingen.akAfbouwPct = f))} />
            <EurVeld label="Combinatiekorting max." waarde={p.kortingen.iackMax} onChange={(n) => zet((q) => void (q.kortingen.iackMax = n))} />
            <EurVeld label="Zelfstandigenaftrek" waarde={p.ondernemer.zelfstandigenaftrek} onChange={(n) => zet((q) => void (q.ondernemer.zelfstandigenaftrek = n))} />
            <EurVeld label="Startersaftrek" waarde={p.ondernemer.startersaftrek} onChange={(n) => zet((q) => void (q.ondernemer.startersaftrek = n))} />
            <PctVeld label="Mkb-winstvrijstelling" waarde={p.ondernemer.mkbVrijstelling} onChange={(f) => zet((q) => void (q.ondernemer.mkbVrijstelling = f))} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: BOX_KLEUR[2] }}>
            Box 2 en vennootschapsbelasting
          </legend>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.box2.schijven.map((s, i) => (
              <div key={`b2-${i}`} className="contents">
                <PctVeld label={`Box 2 tarief schijf ${i + 1}`} waarde={s.tarief} onChange={(f) => zet((q) => void (q.box2.schijven[i].tarief = f))} />
                {s.tot !== null && <EurVeld label={`Box 2 grens schijf ${i + 1} (p.p.)`} waarde={s.tot} onChange={(n) => zet((q) => void (q.box2.schijven[i].tot = n))} />}
              </div>
            ))}
            {p.vpb.schijven.map((s, i) => (
              <div key={`vpb-${i}`} className="contents">
                <PctVeld label={`Vpb tarief schijf ${i + 1}`} waarde={s.tarief} onChange={(f) => zet((q) => void (q.vpb.schijven[i].tarief = f))} />
                {s.tot !== null && <EurVeld label={`Vpb grens schijf ${i + 1}`} waarde={s.tot} onChange={(n) => zet((q) => void (q.vpb.schijven[i].tot = n))} />}
              </div>
            ))}
            <EurVeld label="Gebruikelijk loon DGA" waarde={p.vpb.gebruikelijkLoon} onChange={(n) => zet((q) => void (q.vpb.gebruikelijkLoon = n))} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: BOX_KLEUR[3] }}>
            Box 3
          </legend>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            {(['forfaitair', 'werkelijk'] as const).map((st) => (
              <label key={st} className="flex items-center gap-2">
                <input type="radio" name="stelsel" checked={p.box3.stelsel === st} onChange={() => zet((q) => void (q.box3.stelsel = st))} />
                {st === 'forfaitair' ? 'Forfaitair (fictief rendement)' : 'Werkelijk rendement'}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <PctVeld label="Tarief box 3" waarde={p.box3.tarief} onChange={(f) => zet((q) => void (q.box3.tarief = f))} />
            {p.box3.stelsel === 'forfaitair' ? (
              <>
                <EurVeld label="Heffingsvrij vermogen p.p." waarde={p.box3.heffingsvrijVermogen} onChange={(n) => zet((q) => void (q.box3.heffingsvrijVermogen = n))} />
                <EurVeld label="Schuldendrempel p.p." waarde={p.box3.schuldendrempel} onChange={(n) => zet((q) => void (q.box3.schuldendrempel = n))} />
                <PctVeld label="Forfait spaargeld" waarde={p.box3.forfaitSparen} onChange={(f) => zet((q) => void (q.box3.forfaitSparen = f))} />
                <PctVeld label="Forfait overige bezittingen" waarde={p.box3.forfaitOverig} onChange={(f) => zet((q) => void (q.box3.forfaitOverig = f))} />
                <PctVeld label="Forfait schulden" waarde={p.box3.forfaitSchulden} onChange={(f) => zet((q) => void (q.box3.forfaitSchulden = f))} />
                <EurVeld label="Vrijstelling groen p.p." waarde={p.box3.groenVrijstelling} onChange={(n) => zet((q) => void (q.box3.groenVrijstelling = n))} />
              </>
            ) : (
              <>
                <EurVeld label="Heffingsvrij resultaat p.p." waarde={p.box3.heffingsvrijResultaat} onChange={(n) => zet((q) => void (q.box3.heffingsvrijResultaat = n))} />
                <PctVeld label="Deel waardegroei dat je jaarlijks verkoopt" waarde={p.box3.realisatieFractie} onChange={(f) => zet((q) => void (q.box3.realisatieFractie = Math.min(1, Math.max(0, f))))} />
                <div className="sm:col-span-3 lg:col-span-4">
                  <span className="mb-1 block text-sm text-slate-600">Waardegroei pas belast bij verkoop (vermogenswinstbelasting) voor:</span>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {box3Cats.map((c) => (
                      <label key={c} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={p.box3.vermogenswinstCategorieen.includes(c)}
                          onChange={(e) =>
                            zet((q) => {
                              const l = q.box3.vermogenswinstCategorieen.filter((x) => x !== c);
                              q.box3.vermogenswinstCategorieen = e.target.checked ? [...l, c] : l;
                            })
                          }
                        />
                        {CATEGORIES[c].label}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Huidig box 3-tarief: {pct(p.box3.tarief)}.</p>
        </fieldset>

        <div className="flex gap-2">
          <Knop variant="primair" onClick={() => onOpslaan({ ...sc, toelichting: sc.toelichting || 'Eigen scenario' })}>
            Opslaan en vergelijken
          </Knop>
          <Knop onClick={onAnnuleer}>Annuleren</Knop>
        </div>
      </div>
    </Card>
  );
}
