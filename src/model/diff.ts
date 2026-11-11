import { CATEGORIES, type Box, type Item, type Situatie } from './types';
import { vermogenPerBox } from '../tax/calc';

export interface ItemVerschil {
  naam: string;
  categorie: Item['categorie'];
  box: Box;
  oud: number;
  nieuw: number;
  verschil: number;
  soort: 'nieuw' | 'weg' | 'gewijzigd';
}

/** netto-effect op vermogen: schulden tellen negatief */
const teken = (i: Item) => (CATEGORIES[i.categorie].isSchuld ? -1 : 1);

export function vergelijk(oud: Situatie, nieuw: Situatie) {
  const oudMap = new Map(oud.items.map((i) => [i.id, i]));
  const nieuwMap = new Map(nieuw.items.map((i) => [i.id, i]));
  const items: ItemVerschil[] = [];
  for (const n of nieuw.items) {
    const o = oudMap.get(n.id);
    const box = CATEGORIES[n.categorie].box;
    if (!o) items.push({ naam: n.naam, categorie: n.categorie, box, oud: 0, nieuw: n.waarde, verschil: teken(n) * n.waarde, soort: 'nieuw' });
    else if (o.waarde !== n.waarde || o.categorie !== n.categorie)
      items.push({ naam: n.naam, categorie: n.categorie, box, oud: o.waarde, nieuw: n.waarde, verschil: teken(n) * n.waarde - teken(o) * o.waarde, soort: 'gewijzigd' });
  }
  for (const o of oud.items) {
    if (!nieuwMap.has(o.id))
      items.push({ naam: o.naam, categorie: o.categorie, box: CATEGORIES[o.categorie].box, oud: o.waarde, nieuw: 0, verschil: -teken(o) * o.waarde, soort: 'weg' });
  }
  items.sort((a, b) => Math.abs(b.verschil) - Math.abs(a.verschil));
  const vo = vermogenPerBox(oud);
  const vn = vermogenPerBox(nieuw);
  const perBox = ([1, 2, 3] as Box[]).map((box) => ({ box, oud: vo[box].netto, nieuw: vn[box].netto, verschil: vn[box].netto - vo[box].netto }));
  return { items, perBox, totaal: perBox.reduce((s, b) => s + b.verschil, 0) };
}
