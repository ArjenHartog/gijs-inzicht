import { useEffect, useReducer } from 'react';
import {
  CATEGORIES,
  legeSituatie,
  nieuwPersoon,
  type BV,
  type Category,
  type Item,
  type Kind,
  type Onderneming,
  type Persoon,
  type PersoonId,
  type Situatie,
  type Snapshot,
} from './types';
import { normaliseerParams, type Scenario } from '../tax/parameters';

export interface State {
  versie: 2;
  huidig: Situatie;
  snapshots: Snapshot[];
  eigenScenarios: Scenario[];
}

const KEY = 'vermogensinzicht.v1';

export const nieuwId = () => Math.random().toString(36).slice(2, 10);

export const nieuwItem = (categorie: Category = 'spaargeld'): Item => ({
  id: nieuwId(),
  naam: CATEGORIES[categorie].label,
  categorie,
  eigenaar: 'samen',
  waarde: 0,
  directPct: CATEGORIES[categorie].defaultDirect,
  groeiPct: CATEGORIES[categorie].defaultGroei,
});

export const nieuwKind = (): Kind => ({ id: nieuwId(), naam: 'Kind', geboortejaar: new Date().getFullYear() - 5 });
export const nieuweOnderneming = (): Onderneming => ({ id: nieuwId(), naam: 'Eenmanszaak', eigenaar: 'ik', winst: 0, urencriterium: true, starter: false, vermogen: 0 });
export const nieuweBV = (): BV => ({ id: nieuwId(), naam: 'BV', eigenaar: 'ik', waarde: 0, groeiPct: 4, winst: 0, dgaLoon: 0, dividend: 0 });

export const leegState = (): State => ({ versie: 2, huidig: legeSituatie(), snapshots: [], eigenScenarios: [] });

export const voorbeeldState = (): State => {
  const kind1 = { id: nieuwId(), naam: 'Sam', geboortejaar: 2017 };
  const kind2 = { id: nieuwId(), naam: 'Noor', geboortejaar: 2021 };
  const items: Item[] = [
    { ...nieuwItem('eigen_woning'), naam: 'Woning', waarde: 525000 },
    { ...nieuwItem('hypotheek'), naam: 'Hypotheek', waarde: 310000, directPct: 3.6 },
    { ...nieuwItem('spaargeld'), naam: 'Spaarrekening', waarde: 65000 },
    { ...nieuwItem('beleggingen'), naam: 'ETF-portefeuille', waarde: 140000, eigenaar: 'ik' },
    { ...nieuwItem('crypto'), naam: 'Bitcoin', waarde: 8000, eigenaar: 'partner' },
    { ...nieuwItem('lijfrente'), naam: 'Lijfrenterekening', waarde: 30000, eigenaar: 'partner' },
    { ...nieuwItem('spaargeld'), naam: 'Spaarrekening Sam', waarde: 9000, eigenaar: `kind:${kind1.id}` },
    { ...nieuwItem('spaargeld'), naam: 'Spaarrekening Noor', waarde: 4000, eigenaar: `kind:${kind2.id}` },
  ];
  const huidig: Situatie = {
    ik: { naam: 'Ik', loon: 0, overigInkomen: 0, aftrekposten: 0 },
    partner: { naam: 'Partner', loon: 46000, overigInkomen: 0, aftrekposten: 1500 },
    kinderen: [kind1, kind2],
    ondernemingen: [{ ...nieuweOnderneming(), naam: 'Advieswerk (zzp)', eigenaar: 'partner', winst: 18000, vermogen: 6000 }],
    bvs: [
      { ...nieuweBV(), naam: 'Holding BV', waarde: 220000, winst: 95000, dgaLoon: 0, dividend: 30000 },
      { ...nieuweBV(), naam: 'Werk BV', waarde: 60000, winst: 40000, dgaLoon: 62000, dividend: 0 },
    ],
    items,
  };
  const vorig: Snapshot = {
    ...structuredClone(huidig),
    id: nieuwId(),
    datum: '2026-01-01',
    notitie: 'Begin 2026 (voorbeeld)',
    items: huidig.items.map((i) =>
      i.categorie === 'beleggingen' ? { ...i, waarde: 121000 } : i.naam === 'Spaarrekening' ? { ...i, waarde: 72000 } : i.categorie === 'hypotheek' ? { ...i, waarde: 316000 } : i,
    ),
    bvs: huidig.bvs.map((b) => (b.naam === 'Holding BV' ? { ...b, waarde: 205000 } : b)),
  };
  return { versie: 2, huidig, snapshots: [vorig], eigenScenarios: [] };
};

export type Lijst = 'kinderen' | 'ondernemingen' | 'bvs';
type LijstItem = { kinderen: Kind; ondernemingen: Onderneming; bvs: BV };

export type Actie =
  | { type: 'vervang'; state: State }
  | { type: 'itemToevoegen'; categorie?: Category }
  | { type: 'itemWijzigen'; id: string; wijziging: Partial<Item> }
  | { type: 'itemVerwijderen'; id: string }
  | { type: 'persoon'; wie: PersoonId; wijziging: Partial<Persoon> }
  | { type: 'partner'; aan: boolean }
  | { type: 'lijstToevoegen'; lijst: Lijst }
  | { type: 'lijstWijzigen'; lijst: Lijst; id: string; wijziging: Partial<LijstItem[Lijst]> }
  | { type: 'lijstVerwijderen'; lijst: Lijst; id: string }
  | { type: 'snapshotOpslaan'; datum: string; notitie: string }
  | { type: 'snapshotVerwijderen'; id: string }
  | { type: 'snapshotHerstellen'; id: string }
  | { type: 'scenarioOpslaan'; scenario: Scenario }
  | { type: 'scenarioVerwijderen'; id: string };

const metHuidig = (s: State, f: (h: Situatie) => Situatie): State => ({ ...s, huidig: f(s.huidig) });

const nieuwInLijst = { kinderen: nieuwKind, ondernemingen: nieuweOnderneming, bvs: nieuweBV };

export function reducer(s: State, a: Actie): State {
  switch (a.type) {
    case 'vervang':
      return a.state;
    case 'itemToevoegen':
      return metHuidig(s, (h) => ({ ...h, items: [...h.items, nieuwItem(a.categorie)] }));
    case 'itemWijzigen':
      return metHuidig(s, (h) => ({
        ...h,
        items: h.items.map((i) => {
          if (i.id !== a.id) return i;
          const n = { ...i, ...a.wijziging };
          if (a.wijziging.categorie && a.wijziging.categorie !== i.categorie) {
            const c = CATEGORIES[a.wijziging.categorie];
            n.directPct = c.defaultDirect;
            n.groeiPct = c.defaultGroei;
            if (i.naam === CATEGORIES[i.categorie].label) n.naam = c.label;
          }
          return n;
        }),
      }));
    case 'itemVerwijderen':
      return metHuidig(s, (h) => ({ ...h, items: h.items.filter((i) => i.id !== a.id) }));
    case 'persoon':
      return metHuidig(s, (h) =>
        a.wie === 'ik' ? { ...h, ik: { ...h.ik, ...a.wijziging } } : h.partner ? { ...h, partner: { ...h.partner, ...a.wijziging } } : h,
      );
    case 'partner':
      return metHuidig(s, (h) => {
        if (a.aan) return { ...h, partner: h.partner ?? nieuwPersoon('Partner') };
        // zonder partner: alles van de partner gaat naar 'ik'
        return {
          ...h,
          partner: null,
          items: h.items.map((i) => (i.eigenaar === 'partner' ? { ...i, eigenaar: 'ik' } : i)),
          ondernemingen: h.ondernemingen.map((o) => ({ ...o, eigenaar: 'ik' })),
          bvs: h.bvs.map((b) => ({ ...b, eigenaar: 'ik' })),
        };
      });
    case 'lijstToevoegen':
      return metHuidig(s, (h) => ({ ...h, [a.lijst]: [...h[a.lijst], nieuwInLijst[a.lijst]()] }));
    case 'lijstWijzigen':
      return metHuidig(s, (h) => ({ ...h, [a.lijst]: (h[a.lijst] as { id: string }[]).map((x) => (x.id === a.id ? { ...x, ...a.wijziging } : x)) }));
    case 'lijstVerwijderen':
      return metHuidig(s, (h) => {
        const n = { ...h, [a.lijst]: (h[a.lijst] as { id: string }[]).filter((x) => x.id !== a.id) };
        // bezittingen van een verwijderd kind gaan naar 'samen'
        if (a.lijst === 'kinderen') n.items = h.items.map((i) => (i.eigenaar === `kind:${a.id}` ? { ...i, eigenaar: 'samen' } : i));
        return n;
      });
    case 'snapshotOpslaan': {
      const snap: Snapshot = { ...structuredClone(s.huidig), id: nieuwId(), datum: a.datum, notitie: a.notitie };
      return { ...s, snapshots: [...s.snapshots, snap].sort((x, y) => x.datum.localeCompare(y.datum)) };
    }
    case 'snapshotVerwijderen':
      return { ...s, snapshots: s.snapshots.filter((x) => x.id !== a.id) };
    case 'snapshotHerstellen': {
      const snap = s.snapshots.find((x) => x.id === a.id);
      if (!snap) return s;
      const { id: _id, datum: _d, notitie: _n, ...situatie } = structuredClone(snap);
      return { ...s, huidig: situatie };
    }
    case 'scenarioOpslaan': {
      const rest = s.eigenScenarios.filter((x) => x.id !== a.scenario.id);
      return { ...s, eigenScenarios: [...rest, a.scenario] };
    }
    case 'scenarioVerwijderen':
      return { ...s, eigenScenarios: s.eigenScenarios.filter((x) => x.id !== a.id) };
  }
}

// ---------- migratie van versie 1 (één persoon, inkomen-blok, AB als bezitting) ----------

interface SituatieV1 {
  items: (Omit<Item, 'eigenaar' | 'categorie'> & { categorie: Category | 'aanmerkelijk_belang' })[];
  inkomen?: { arbeid?: number; box2Inkomen?: number };
  fiscaalPartner?: boolean;
}

function migreerSituatie(x: Situatie | SituatieV1): Situatie {
  if ('ik' in x) return { ...legeSituatie(), ...x };
  const v1 = x as SituatieV1;
  const ab = v1.items.filter((i) => i.categorie === 'aanmerkelijk_belang');
  return {
    ik: { ...nieuwPersoon('Ik'), loon: v1.inkomen?.arbeid ?? 0 },
    partner: v1.fiscaalPartner ? nieuwPersoon('Partner') : null,
    kinderen: [],
    ondernemingen: [],
    bvs: ab.map((i, n) => ({ ...nieuweBV(), id: i.id, naam: i.naam, waarde: i.waarde, groeiPct: i.groeiPct, dividend: n === 0 ? (v1.inkomen?.box2Inkomen ?? 0) : 0 })),
    items: v1.items.filter((i) => i.categorie !== 'aanmerkelijk_belang').map((i) => ({ ...i, categorie: i.categorie as Category, eigenaar: 'samen' })),
  };
}

export function migreer(x: unknown): State | null {
  const s = x as { huidig?: unknown; snapshots?: unknown[]; eigenScenarios?: Scenario[] };
  if (!s || typeof s !== 'object' || !s.huidig || !Array.isArray(s.snapshots)) return null;
  try {
    return {
      versie: 2,
      huidig: migreerSituatie(s.huidig as Situatie),
      snapshots: (s.snapshots as Snapshot[]).map((sn) => ({ ...migreerSituatie(sn), id: sn.id, datum: sn.datum, notitie: sn.notitie ?? '' })),
      eigenScenarios: (s.eigenScenarios ?? []).map((sc) => ({ ...sc, params: normaliseerParams(sc.params) })),
    };
  } catch {
    return null;
  }
}

function laad(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migreer(JSON.parse(raw)) ?? leegState();
  } catch {
    /* lege of geblokkeerde opslag: begin leeg */
  }
  return leegState();
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, laad);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* opslag niet beschikbaar; export blijft werken */
    }
  }, [state]);
  return [state, dispatch] as const;
}

export function exporteer(state: State) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mijn-vermogen-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
