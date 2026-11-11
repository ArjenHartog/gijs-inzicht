import { useState, type Dispatch } from 'react';
import { CATEGORIES, type Category } from '../model/types';
import type { Actie, State } from '../model/store';
import { BOX_KLEUR, Card, GetalInput, Knop, Leeg, eur } from './ui';

const CATS = Object.keys(CATEGORIES) as Category[];

export function Invoer({ state, dispatch }: { state: State; dispatch: Dispatch<Actie> }) {
  const s = state.huidig;
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [notitie, setNotitie] = useState('');
  const [opgeslagen, setOpgeslagen] = useState(false);

  return (
    <div className="space-y-5">
      <Card
        titel="Bezittingen en schulden"
        actie={
          <Knop variant="primair" onClick={() => dispatch({ type: 'itemToevoegen' })}>
            + Regel toevoegen
          </Knop>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Kies per regel de soort; de box volgt daaruit. Vul schulden als positief bedrag in. <strong>Direct %</strong> is rente,
          dividend of huur per jaar; <strong>groei %</strong> is verwachte waardestijging. Die twee zijn alleen nodig voor de
          scenario's met werkelijk rendement en de toekomstprojectie.
        </p>
        {s.items.length === 0 ? (
          <Leeg>Nog geen regels. Voeg je spaarrekening, beleggingen, woning, hypotheek of BV toe.</Leeg>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Box</th>
                  <th className="px-2 py-2">Omschrijving</th>
                  <th className="px-2 py-2">Soort</th>
                  <th className="px-2 py-2 text-right">Waarde</th>
                  <th className="px-2 py-2 text-right">Direct %</th>
                  <th className="px-2 py-2 text-right">Groei %</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.items.map((i) => {
                  const c = CATEGORIES[i.categorie];
                  return (
                    <tr key={i.id} className="border-t border-slate-100 align-middle">
                      <td className="px-2 py-2">
                        <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ background: BOX_KLEUR[c.box] }}>
                          {c.box}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          aria-label="Omschrijving"
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                          value={i.naam}
                          onChange={(e) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { naam: e.target.value } })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          aria-label="Soort"
                          title={c.hint}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
                          value={i.categorie}
                          onChange={(e) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { categorie: e.target.value as Category } })}
                        >
                          {CATS.map((k) => (
                            <option key={k} value={k}>
                              {CATEGORIES[k].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="w-40 px-2 py-2">
                        <GetalInput label="Waarde" suffix="€" stap={1000} waarde={i.waarde} onChange={(n) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { waarde: n } })} />
                      </td>
                      <td className="w-24 px-2 py-2">
                        <GetalInput label="Direct %" suffix="%" stap={0.1} waarde={i.directPct} onChange={(n) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { directPct: n } })} />
                      </td>
                      <td className="w-24 px-2 py-2">
                        <GetalInput
                          label="Groei %"
                          suffix="%"
                          stap={0.1}
                          waarde={c.isSchuld ? 0 : i.groeiPct}
                          onChange={(n) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { groeiPct: n } })}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Knop variant="gevaar" onClick={() => dispatch({ type: 'itemVerwijderen', id: i.id })}>
                          Verwijder
                        </Knop>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card titel="Inkomen per jaar">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Bruto inkomen uit werk/pensioen (box 1)</span>
              <GetalInput suffix="€" stap={1000} waarde={s.inkomen.arbeid} onChange={(n) => dispatch({ type: 'inkomen', wijziging: { arbeid: n } })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Heffingskortingen (box 1)</span>
              <GetalInput suffix="€" stap={100} waarde={s.inkomen.heffingskortingen} onChange={(n) => dispatch({ type: 'inkomen', wijziging: { heffingskortingen: n } })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Dividend/winst uit eigen BV (box 2)</span>
              <GetalInput suffix="€" stap={1000} waarde={s.inkomen.box2Inkomen} onChange={(n) => dispatch({ type: 'inkomen', wijziging: { box2Inkomen: n } })} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={s.fiscaalPartner} onChange={(e) => dispatch({ type: 'partner', waarde: e.target.checked })} className="h-4 w-4" />
              Ik heb een fiscaal partner
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Heffingskortingen (algemene heffingskorting, arbeidskorting) staan op je jaaropgaaf of aangifte. Met fiscaal partner verdubbelen
            het heffingsvrij vermogen en de schuldendrempel in box 3; vul dan het gezamenlijke box 3-vermogen in.
          </p>
        </Card>

        <Card titel="Momentopname opslaan">
          <p className="mb-3 text-sm text-slate-600">
            Sla je huidige situatie op met een datum. Onder <strong>Veranderingen</strong> zie je daarna precies wat er tussen twee momenten
            veranderd is.
          </p>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'snapshotOpslaan', datum, notitie });
              setNotitie('');
              setOpgeslagen(true);
              setTimeout(() => setOpgeslagen(false), 2500);
            }}
          >
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Datum</span>
              <input type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="min-w-40 flex-1 text-sm">
              <span className="mb-1 block text-slate-600">Notitie</span>
              <input value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Bijv. na verkoop aandelen" className="w-full rounded-md border border-slate-300 px-2 py-1.5" />
            </label>
            <Knop type="submit" variant="primair">
              Opslaan
            </Knop>
          </form>
          {opgeslagen && <p className="mt-2 text-sm text-emerald-700">Opgeslagen.</p>}
          <p className="mt-3 text-xs text-slate-500">Netto vermogen nu: {eur(s.items.reduce((t, i) => t + (CATEGORIES[i.categorie].isSchuld ? -i.waarde : i.waarde), 0))}</p>
        </Card>
      </div>
    </div>
  );
}
