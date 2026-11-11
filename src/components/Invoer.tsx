import { useState, type Dispatch } from 'react';
import { CATEGORIES, type Category, type Eigenaar, type Situatie } from '../model/types';
import type { Actie, State } from '../model/store';
import { nettoVermogen } from '../tax/calc';
import { BOX_KLEUR, Card, GetalInput, Knop, Leeg, eur } from './ui';

const CATS = Object.keys(CATEGORIES) as Category[];

export function eigenaarOpties(s: Situatie): { waarde: Eigenaar; label: string }[] {
  const opties: { waarde: Eigenaar; label: string }[] = s.partner
    ? [
        { waarde: 'samen', label: 'Samen' },
        { waarde: 'ik', label: s.ik.naam },
        { waarde: 'partner', label: s.partner.naam },
      ]
    : [{ waarde: 'samen', label: s.ik.naam }];
  return [...opties, ...s.kinderen.map((k) => ({ waarde: `kind:${k.id}` as Eigenaar, label: k.naam }))];
}

export function Invoer({ state, dispatch }: { state: State; dispatch: Dispatch<Actie> }) {
  const s = state.huidig;
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [notitie, setNotitie] = useState('');
  const [opgeslagen, setOpgeslagen] = useState(false);
  const opties = eigenaarOpties(s);
  const waardeEigenaar = (e: Eigenaar) => (!s.partner && (e === 'ik' || e === 'partner') ? 'samen' : e);

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
          Kies per regel de soort; de box volgt daaruit. Vul schulden als positief bedrag in. <strong>Direct %</strong> is rente, dividend of huur per
          jaar; <strong>groei %</strong> is verwachte waardestijging (nodig voor werkelijk rendement en de toekomstprojectie). BV's en eenmanszaken
          voeg je toe onder Huishouden.
        </p>
        {s.items.length === 0 ? (
          <Leeg>Nog geen regels. Voeg je spaarrekening, beleggingen, woning of hypotheek toe.</Leeg>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Box</th>
                  <th className="px-2 py-2">Omschrijving</th>
                  <th className="px-2 py-2">Soort</th>
                  <th className="px-2 py-2">Van</th>
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
                      <td className="w-36 px-2 py-2">
                        <select
                          aria-label="Eigenaar"
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
                          value={waardeEigenaar(i.eigenaar)}
                          onChange={(e) => dispatch({ type: 'itemWijzigen', id: i.id, wijziging: { eigenaar: e.target.value as Eigenaar } })}
                        >
                          {opties.map((o) => (
                            <option key={o.waarde} value={o.waarde}>
                              {o.label}
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

      <Card titel="Momentopname opslaan">
        <p className="mb-3 text-sm text-slate-600">
          Sla je huidige situatie (inclusief huishouden, BV's en ondernemingen) op met een datum. Onder <strong>Veranderingen</strong> zie je daarna wat
          er tussen twee momenten veranderd is.
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
        <p className="mt-3 text-xs text-slate-500">Netto vermogen nu: {eur(nettoVermogen(s))}</p>
      </Card>
    </div>
  );
}
