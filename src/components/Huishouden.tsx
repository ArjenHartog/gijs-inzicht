import type { Dispatch, ReactNode } from 'react';
import { leeftijdOp1Jan, type Persoon, type PersoonId, type Situatie } from '../model/types';
import type { Actie, Lijst, State } from '../model/store';
import { HUIDIG_JAAR, ondernemersWinst, progressief } from '../tax/calc';
import { PARAMS_2026 } from '../tax/parameters';
import { Card, GetalInput, Knop, Leeg, eur } from './ui';

function Veld({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const tekstVeld = 'w-full rounded-md border border-slate-300 px-2 py-1.5';

function PersoonKaart({ wie, p, dispatch }: { wie: PersoonId; p: Persoon; dispatch: Dispatch<Actie> }) {
  const zet = (w: Partial<Persoon>) => dispatch({ type: 'persoon', wie, wijziging: w });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Veld label="Naam">
        <input className={tekstVeld} value={p.naam} onChange={(e) => zet({ naam: e.target.value })} />
      </Veld>
      <Veld label="Loon uit dienstbetrekking (bruto/jaar)" hint="Niet het DGA-loon uit je eigen BV; dat vul je bij de BV in">
        <GetalInput suffix="€" stap={1000} waarde={p.loon} onChange={(n) => zet({ loon: n })} />
      </Veld>
      <Veld label="Uitkering, pensioen, overig (bruto/jaar)">
        <GetalInput suffix="€" stap={1000} waarde={p.overigInkomen} onChange={(n) => zet({ overigInkomen: n })} />
      </Veld>
      <Veld label="Aftrekposten (per jaar)" hint="Lijfrentepremie, giften, zorgkosten">
        <GetalInput suffix="€" stap={100} waarde={p.aftrekposten} onChange={(n) => zet({ aftrekposten: n })} />
      </Veld>
    </div>
  );
}

function EigenaarSelect({ s, waarde, onChange }: { s: Situatie; waarde: PersoonId; onChange: (w: PersoonId) => void }) {
  return (
    <select aria-label="Eigenaar" className={`${tekstVeld} bg-white`} value={waarde} onChange={(e) => onChange(e.target.value as PersoonId)} disabled={!s.partner}>
      <option value="ik">{s.ik.naam}</option>
      {s.partner && <option value="partner">{s.partner.naam}</option>}
    </select>
  );
}

export function Huishouden({ state, dispatch }: { state: State; dispatch: Dispatch<Actie> }) {
  const s = state.huidig;
  const wijzig = (lijst: Lijst, id: string, wijziging: object) => dispatch({ type: 'lijstWijzigen', lijst, id, wijziging });
  const verwijder = (lijst: Lijst, id: string) => dispatch({ type: 'lijstVerwijderen', lijst, id });
  const toevoegen = (lijst: Lijst) => dispatch({ type: 'lijstToevoegen', lijst });
  const p = PARAMS_2026;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card titel="Jij">
          <PersoonKaart wie="ik" p={s.ik} dispatch={dispatch} />
        </Card>
        <Card
          titel="Fiscaal partner"
          actie={
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={!!s.partner} onChange={(e) => dispatch({ type: 'partner', aan: e.target.checked })} />
              Ik heb een fiscaal partner
            </label>
          }
        >
          {s.partner ? (
            <>
              <PersoonKaart wie="partner" p={s.partner} dispatch={dispatch} />
              <p className="mt-3 text-xs text-slate-500">
                Gezamenlijke posten (eigen woning, box 2-inkomen, box 3) verdeelt de app automatisch zo dat jullie samen zo min mogelijk betalen,
                net als in de aangifte mag.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Getrouwd, geregistreerd partner, of samenwonend met notarieel contract of samen een kind of huis? Dan ben je meestal fiscaal partner.
              Zet het vinkje aan om je partner toe te voegen.
            </p>
          )}
        </Card>
      </div>

      <Card titel="Kinderen" actie={<Knop onClick={() => toevoegen('kinderen')}>+ Kind</Knop>}>
        <p className="mb-3 text-sm text-slate-600">
          Vermogen van kinderen onder de 18 telt mee in jullie box 3. Is het jongste kind jonger dan 12, dan krijgt de minstverdienende werkende
          ouder de inkomensafhankelijke combinatiekorting (tot {eur(p.kortingen.iackMax)}). Bezittingen van een kind voeg je toe onder Bezittingen,
          met het kind als eigenaar.
        </p>
        {s.kinderen.length === 0 ? (
          <Leeg>Geen kinderen toegevoegd.</Leeg>
        ) : (
          <ul className="divide-y divide-slate-100">
            {s.kinderen.map((k) => {
              const leeftijd = leeftijdOp1Jan(k.geboortejaar, HUIDIG_JAAR);
              return (
                <li key={k.id} className="grid items-end gap-3 py-3 sm:grid-cols-[1fr_140px_auto_auto]">
                  <Veld label="Naam">
                    <input className={tekstVeld} value={k.naam} onChange={(e) => wijzig('kinderen', k.id, { naam: e.target.value })} />
                  </Veld>
                  <Veld label="Geboortejaar">
                    <GetalInput waarde={k.geboortejaar} onChange={(n) => wijzig('kinderen', k.id, { geboortejaar: Math.round(n) })} />
                  </Veld>
                  <span className="pb-2 text-sm text-slate-500">
                    {leeftijd} jaar op 1-1-{HUIDIG_JAAR}
                    {leeftijd >= 18 ? ' · telt niet meer mee' : ''}
                  </span>
                  <Knop variant="gevaar" onClick={() => verwijder('kinderen', k.id)}>
                    Verwijder
                  </Knop>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card titel="Eenmanszaken, zzp, vof" actie={<Knop onClick={() => toevoegen('ondernemingen')}>+ Onderneming</Knop>}>
        <p className="mb-3 text-sm text-slate-600">
          Winst uit onderneming valt in box 1. Met het urencriterium (1.225 uur) krijg je {eur(p.ondernemer.zelfstandigenaftrek)} zelfstandigenaftrek
          (starters +{eur(p.ondernemer.startersaftrek)}); daarna is {Math.round(p.ondernemer.mkbVrijstelling * 1000) / 10}% mkb-winstvrijstelling.
        </p>
        {s.ondernemingen.length === 0 ? (
          <Leeg>Geen ondernemingen toegevoegd.</Leeg>
        ) : (
          <ul className="divide-y divide-slate-100">
            {s.ondernemingen.map((o) => {
              const w = ondernemersWinst(o, p);
              return (
                <li key={o.id} className="py-3">
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Veld label="Naam">
                      <input className={tekstVeld} value={o.naam} onChange={(e) => wijzig('ondernemingen', o.id, { naam: e.target.value })} />
                    </Veld>
                    <Veld label="Eigenaar">
                      <EigenaarSelect s={s} waarde={o.eigenaar} onChange={(v) => wijzig('ondernemingen', o.id, { eigenaar: v })} />
                    </Veld>
                    <Veld label="Winst per jaar (vóór aftrekken)">
                      <GetalInput suffix="€" stap={1000} waarde={o.winst} onChange={(n) => wijzig('ondernemingen', o.id, { winst: n })} />
                    </Veld>
                    <Veld label="Ondernemingsvermogen">
                      <GetalInput suffix="€" stap={1000} waarde={o.vermogen} onChange={(n) => wijzig('ondernemingen', o.id, { vermogen: n })} />
                    </Veld>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={o.urencriterium} onChange={(e) => wijzig('ondernemingen', o.id, { urencriterium: e.target.checked })} />
                      Urencriterium (≥ 1.225 uur)
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={o.starter} onChange={(e) => wijzig('ondernemingen', o.id, { starter: e.target.checked })} />
                      Startersaftrek
                    </label>
                    <span className="text-slate-500">Belastbare winst 2026: {eur(w.belastbaar)}</span>
                    <span className="ml-auto">
                      <Knop variant="gevaar" onClick={() => verwijder('ondernemingen', o.id)}>
                        Verwijder
                      </Knop>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card titel="BV's (aanmerkelijk belang)" actie={<Knop onClick={() => toevoegen('bvs')}>+ BV</Knop>}>
        <p className="mb-3 text-sm text-slate-600">
          Per BV: de BV betaalt vennootschapsbelasting over de winst (19% tot €200.000, daarboven 25,8%). Wat de BV aan jou uitkeert, is
          dividend in box 2; je DGA-loon valt in box 1. Elke BV wordt apart belast (geen fiscale eenheid).
        </p>
        {s.bvs.length === 0 ? (
          <Leeg>Geen BV's toegevoegd.</Leeg>
        ) : (
          <ul className="divide-y divide-slate-100">
            {s.bvs.map((b) => (
              <li key={b.id} className="py-3">
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Veld label="Naam">
                    <input className={tekstVeld} value={b.naam} onChange={(e) => wijzig('bvs', b.id, { naam: e.target.value })} />
                  </Veld>
                  <Veld label="Aandeelhouder">
                    <EigenaarSelect s={s} waarde={b.eigenaar} onChange={(v) => wijzig('bvs', b.id, { eigenaar: v })} />
                  </Veld>
                  <Veld label="Waarde van je aandelen">
                    <GetalInput suffix="€" stap={1000} waarde={b.waarde} onChange={(n) => wijzig('bvs', b.id, { waarde: n })} />
                  </Veld>
                  <Veld label="Verwachte waardegroei">
                    <GetalInput suffix="%" stap={0.1} waarde={b.groeiPct} onChange={(n) => wijzig('bvs', b.id, { groeiPct: n })} />
                  </Veld>
                  <Veld label="Winst BV per jaar (na DGA-loon)">
                    <GetalInput suffix="€" stap={1000} waarde={b.winst} onChange={(n) => wijzig('bvs', b.id, { winst: n })} />
                  </Veld>
                  <Veld label="DGA-loon per jaar">
                    <GetalInput suffix="€" stap={1000} waarde={b.dgaLoon} onChange={(n) => wijzig('bvs', b.id, { dgaLoon: n })} />
                  </Veld>
                  <Veld label="Dividend naar privé per jaar">
                    <GetalInput suffix="€" stap={1000} waarde={b.dividend} onChange={(n) => wijzig('bvs', b.id, { dividend: n })} />
                  </Veld>
                  <div className="flex items-center justify-between gap-2 pb-1 text-sm text-slate-500">
                    <span>Vpb: {eur(progressief(b.winst, p.vpb.schijven))}</span>
                    <Knop variant="gevaar" onClick={() => verwijder('bvs', b.id)}>
                      Verwijder
                    </Knop>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
