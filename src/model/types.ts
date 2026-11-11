export type Box = 1 | 2 | 3;

export type Category =
  | 'eigen_woning'
  | 'hypotheek'
  | 'aanmerkelijk_belang'
  | 'spaargeld'
  | 'beleggingen'
  | 'groen'
  | 'vastgoed'
  | 'crypto'
  | 'overig'
  | 'schuld';

export interface CategoryInfo {
  label: string;
  box: Box;
  isSchuld: boolean;
  /** box 3 forfaitair: telt als spaargeld (true) of overige bezitting (false) */
  forfaitSparen?: boolean;
  /** standaard verwachte directe opbrengst (rente/dividend/huur), % per jaar */
  defaultDirect: number;
  /** standaard verwachte waardegroei, % per jaar */
  defaultGroei: number;
  hint: string;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  eigen_woning: { label: 'Eigen woning (WOZ)', box: 1, isSchuld: false, defaultDirect: 0, defaultGroei: 3, hint: 'Hoofdverblijf; vul de WOZ-waarde in' },
  hypotheek: { label: 'Hypotheek eigen woning', box: 1, isSchuld: true, defaultDirect: 3.8, defaultGroei: 0, hint: 'Restschuld; rente = hypotheekrente %' },
  aanmerkelijk_belang: { label: 'Aandelen eigen BV (≥5%)', box: 2, isSchuld: false, defaultDirect: 0, defaultGroei: 4, hint: 'Waarde van je aanmerkelijk belang' },
  spaargeld: { label: 'Spaargeld / banktegoed', box: 3, isSchuld: false, forfaitSparen: true, defaultDirect: 1.5, defaultGroei: 0, hint: 'Direct = spaarrente' },
  beleggingen: { label: 'Beleggingen (aandelen, ETF, obligaties)', box: 3, isSchuld: false, forfaitSparen: false, defaultDirect: 2, defaultGroei: 5, hint: 'Direct = dividend/coupon, groei = koersstijging' },
  groen: { label: 'Groene beleggingen', box: 3, isSchuld: false, forfaitSparen: false, defaultDirect: 1, defaultGroei: 2, hint: 'Deels vrijgesteld in box 3' },
  vastgoed: { label: 'Vastgoed (2e woning, verhuur)', box: 3, isSchuld: false, forfaitSparen: false, defaultDirect: 4, defaultGroei: 3, hint: 'WOZ / marktwaarde; direct = netto huur' },
  crypto: { label: 'Crypto', box: 3, isSchuld: false, forfaitSparen: false, defaultDirect: 0, defaultGroei: 5, hint: 'Telt als overige bezitting' },
  overig: { label: 'Overige bezittingen', box: 3, isSchuld: false, forfaitSparen: false, defaultDirect: 0, defaultGroei: 0, hint: 'Uitgeleend geld, kapitaalverzekering, etc.' },
  schuld: { label: 'Overige schuld (box 3)', box: 3, isSchuld: true, defaultDirect: 4, defaultGroei: 0, hint: 'Bijv. lening voor 2e woning; direct = rente %' },
};

export interface Item {
  id: string;
  naam: string;
  categorie: Category;
  /** waarde in euro's op peildatum (schulden positief invullen) */
  waarde: number;
  /** directe opbrengst of rente, % per jaar */
  directPct: number;
  /** waardegroei, % per jaar */
  groeiPct: number;
}

export interface Inkomen {
  /** box 1: bruto inkomen uit werk/uitkering/pensioen per jaar */
  arbeid: number;
  /** box 1: totale heffingskortingen per jaar (zie loonstrook of aangifte); vereenvoudiging */
  heffingskortingen: number;
  /** box 2: dividend of verkoopwinst uit eigen BV per jaar */
  box2Inkomen: number;
}

export interface Situatie {
  items: Item[];
  inkomen: Inkomen;
  fiscaalPartner: boolean;
}

export interface Snapshot extends Situatie {
  id: string;
  datum: string; // ISO yyyy-mm-dd
  notitie: string;
}

export const leegInkomen = (): Inkomen => ({ arbeid: 0, heffingskortingen: 0, box2Inkomen: 0 });

export const boxVan = (c: Category): Box => CATEGORIES[c].box;
