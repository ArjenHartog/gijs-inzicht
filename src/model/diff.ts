import type { Box, Situatie } from './types';
import { HUIDIG_JAAR, vermogenPerBox, vermogensRegels } from '../tax/calc';

export interface RegelVerschil {
  naam: string;
  box: Box;
  oud: number;
  nieuw: number;
  verschil: number;
  soort: 'nieuw' | 'weg' | 'gewijzigd';
}

/** vergelijkt bezittingen, schulden, BV's en ondernemingen tussen twee momenten */
export function vergelijk(oud: Situatie, nieuw: Situatie, jaar = HUIDIG_JAAR) {
  const ro = vermogensRegels(oud, jaar);
  const rn = vermogensRegels(nieuw, jaar);
  const oudMap = new Map(ro.map((r) => [r.id, r]));
  const nieuwIds = new Set(rn.map((r) => r.id));
  const netto = (r: { waarde: number; isSchuld: boolean }) => (r.isSchuld ? -r.waarde : r.waarde);
  const items: RegelVerschil[] = [];
  for (const n of rn) {
    const o = oudMap.get(n.id);
    if (!o) items.push({ naam: n.naam, box: n.box, oud: 0, nieuw: n.waarde, verschil: netto(n), soort: 'nieuw' });
    else if (o.waarde !== n.waarde || o.box !== n.box || o.isSchuld !== n.isSchuld)
      items.push({ naam: n.naam, box: n.box, oud: o.waarde, nieuw: n.waarde, verschil: netto(n) - netto(o), soort: 'gewijzigd' });
  }
  for (const o of ro) if (!nieuwIds.has(o.id)) items.push({ naam: o.naam, box: o.box, oud: o.waarde, nieuw: 0, verschil: -netto(o), soort: 'weg' });
  items.sort((a, b) => Math.abs(b.verschil) - Math.abs(a.verschil));
  const vo = vermogenPerBox(oud, jaar);
  const vn = vermogenPerBox(nieuw, jaar);
  const perBox = ([1, 2, 3] as Box[]).map((box) => ({ box, oud: vo[box].netto, nieuw: vn[box].netto, verschil: vn[box].netto - vo[box].netto }));
  return { items, perBox, totaal: perBox.reduce((s, b) => s + b.verschil, 0) };
}
