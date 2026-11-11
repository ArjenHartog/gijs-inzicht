import { useEffect, useReducer } from 'react';
import { CATEGORIES, leegInkomen, type Category, type Inkomen, type Item, type Situatie, type Snapshot } from './types';
import type { Scenario } from '../tax/parameters';

export interface State {
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
  waarde: 0,
  directPct: CATEGORIES[categorie].defaultDirect,
  groeiPct: CATEGORIES[categorie].defaultGroei,
});

export const leegState = (): State => ({
  huidig: { items: [], inkomen: leegInkomen(), fiscaalPartner: false },
  snapshots: [],
  eigenScenarios: [],
});

export const voorbeeldState = (): State => {
  const items: Item[] = [
    { ...nieuwItem('eigen_woning'), naam: 'Woning', waarde: 525000 },
    { ...nieuwItem('hypotheek'), naam: 'Hypotheek', waarde: 310000, directPct: 3.6 },
    { ...nieuwItem('aanmerkelijk_belang'), naam: 'Holding BV', waarde: 180000 },
    { ...nieuwItem('spaargeld'), naam: 'Spaarrekening', waarde: 65000 },
    { ...nieuwItem('beleggingen'), naam: 'ETF-portefeuille', waarde: 140000 },
    { ...nieuwItem('crypto'), naam: 'Bitcoin', waarde: 8000 },
  ];
  const huidig: Situatie = {
    items,
    inkomen: { arbeid: 85000, heffingskortingen: 2800, box2Inkomen: 20000 },
    fiscaalPartner: false,
  };
  const vorig: Snapshot = {
    id: nieuwId(),
    datum: '2026-01-01',
    notitie: 'Begin 2026 (voorbeeld)',
    fiscaalPartner: false,
    inkomen: huidig.inkomen,
    items: items.map((i) =>
      i.categorie === 'beleggingen' ? { ...i, waarde: 121000 } : i.categorie === 'spaargeld' ? { ...i, waarde: 72000 } : i.categorie === 'hypotheek' ? { ...i, waarde: 316000 } : i,
    ),
  };
  return { huidig, snapshots: [vorig], eigenScenarios: [] };
};

export type Actie =
  | { type: 'vervang'; state: State }
  | { type: 'itemToevoegen'; categorie?: Category }
  | { type: 'itemWijzigen'; id: string; wijziging: Partial<Item> }
  | { type: 'itemVerwijderen'; id: string }
  | { type: 'inkomen'; wijziging: Partial<Inkomen> }
  | { type: 'partner'; waarde: boolean }
  | { type: 'snapshotOpslaan'; datum: string; notitie: string }
  | { type: 'snapshotVerwijderen'; id: string }
  | { type: 'snapshotHerstellen'; id: string }
  | { type: 'scenarioOpslaan'; scenario: Scenario }
  | { type: 'scenarioVerwijderen'; id: string };

const metHuidig = (s: State, f: (h: Situatie) => Situatie): State => ({ ...s, huidig: f(s.huidig) });

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
    case 'inkomen':
      return metHuidig(s, (h) => ({ ...h, inkomen: { ...h.inkomen, ...a.wijziging } }));
    case 'partner':
      return metHuidig(s, (h) => ({ ...h, fiscaalPartner: a.waarde }));
    case 'snapshotOpslaan': {
      const snap: Snapshot = { ...structuredClone(s.huidig), id: nieuwId(), datum: a.datum, notitie: a.notitie };
      const snapshots = [...s.snapshots, snap].sort((x, y) => x.datum.localeCompare(y.datum));
      return { ...s, snapshots };
    }
    case 'snapshotVerwijderen':
      return { ...s, snapshots: s.snapshots.filter((x) => x.id !== a.id) };
    case 'snapshotHerstellen': {
      const snap = s.snapshots.find((x) => x.id === a.id);
      if (!snap) return s;
      const { items, inkomen, fiscaalPartner } = structuredClone(snap);
      return { ...s, huidig: { items, inkomen, fiscaalPartner } };
    }
    case 'scenarioOpslaan': {
      const rest = s.eigenScenarios.filter((x) => x.id !== a.scenario.id);
      return { ...s, eigenScenarios: [...rest, a.scenario] };
    }
    case 'scenarioVerwijderen':
      return { ...s, eigenScenarios: s.eigenScenarios.filter((x) => x.id !== a.id) };
  }
}

export function isGeldigeState(x: unknown): x is State {
  const s = x as State;
  return !!s && typeof s === 'object' && !!s.huidig && Array.isArray(s.huidig.items) && Array.isArray(s.snapshots);
}

function laad(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isGeldigeState(parsed)) return { ...leegState(), ...parsed };
    }
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
