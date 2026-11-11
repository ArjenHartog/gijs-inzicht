export type Box = 1 | 2 | 3;

export type Category =
  | 'eigen_woning'
  | 'hypotheek'
  | 'lijfrente'
  | 'spaargeld'
  | 'beleggingen'
  | 'groen'
  | 'vastgoed'
  | 'crypto'
  | 'overig'
  | 'schuld'
  | 'studieschuld';

export interface CategoryInfo {
  label: string;
  box: Box;
  isSchuld: boolean;
  /** standaard verwachte directe opbrengst (rente/dividend/huur), % per jaar */
  defaultDirect: number;
  /** standaard verwachte waardegroei, % per jaar */
  defaultGroei: number;
  hint: string;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  eigen_woning: { label: 'Eigen woning (WOZ)', box: 1, isSchuld: false, defaultDirect: 0, defaultGroei: 3, hint: 'Hoofdverblijf; vul de WOZ-waarde in' },
  hypotheek: { label: 'Hypotheek eigen woning', box: 1, isSchuld: true, defaultDirect: 3.8, defaultGroei: 0, hint: 'Restschuld; direct % = hypotheekrente' },
  lijfrente: { label: 'Lijfrente / banksparen (vrijgesteld)', box: 1, isSchuld: false, defaultDirect: 0, defaultGroei: 4, hint: 'Lijfrenterekening of -verzekering; valt buiten box 3' },
  spaargeld: { label: 'Spaargeld / banktegoed', box: 3, isSchuld: false, defaultDirect: 1.5, defaultGroei: 0, hint: 'Direct = spaarrente' },
  beleggingen: { label: 'Beleggingen (aandelen, ETF, obligaties)', box: 3, isSchuld: false, defaultDirect: 2, defaultGroei: 5, hint: 'Direct = dividend/coupon, groei = koersstijging' },
  groen: { label: 'Groene beleggingen', box: 3, isSchuld: false, defaultDirect: 1, defaultGroei: 2, hint: 'Deels vrijgesteld in box 3' },
  vastgoed: { label: 'Vastgoed (2e woning, verhuur)', box: 3, isSchuld: false, defaultDirect: 4, defaultGroei: 3, hint: 'WOZ / marktwaarde; direct = netto huur' },
  crypto: { label: 'Crypto', box: 3, isSchuld: false, defaultDirect: 0, defaultGroei: 5, hint: 'Telt als overige bezitting' },
  overig: { label: 'Overige bezittingen', box: 3, isSchuld: false, defaultDirect: 0, defaultGroei: 0, hint: 'Uitgeleend geld, kapitaalverzekering, etc.' },
  schuld: { label: 'Overige schuld (box 3)', box: 3, isSchuld: true, defaultDirect: 4, defaultGroei: 0, hint: 'Bijv. lening voor 2e woning; direct = rente %' },
  studieschuld: { label: 'Studieschuld', box: 3, isSchuld: true, defaultDirect: 2.5, defaultGroei: 0, hint: 'DUO-schuld; telt als schuld in box 3' },
};

export type PersoonId = 'ik' | 'partner';
/** eigenaar van een bezitting: jij, je partner, samen, of een kind (`kind:<id>`) */
export type Eigenaar = PersoonId | 'samen' | `kind:${string}`;

export interface Item {
  id: string;
  naam: string;
  categorie: Category;
  eigenaar: Eigenaar;
  /** waarde in euro's op peildatum (schulden positief invullen) */
  waarde: number;
  /** directe opbrengst of rente, % per jaar */
  directPct: number;
  /** waardegroei, % per jaar */
  groeiPct: number;
}

export interface Persoon {
  naam: string;
  /** loon uit dienstbetrekking per jaar (bruto, telt als arbeidsinkomen) */
  loon: number;
  /** uitkering, pensioen, AOW, alimentatie e.d. per jaar (box 1, geen arbeidsinkomen) */
  overigInkomen: number;
  /** persoonsgebonden aftrek box 1: lijfrentepremie, giften, zorgkosten e.d. */
  aftrekposten: number;
}

export interface Kind {
  id: string;
  naam: string;
  geboortejaar: number;
}

/** eenmanszaak, zzp of aandeel in vof/maatschap: winst valt in box 1 */
export interface Onderneming {
  id: string;
  naam: string;
  eigenaar: PersoonId;
  /** fiscale winst per jaar vóór ondernemersaftrek en mkb-winstvrijstelling */
  winst: number;
  /** ≥ 1.225 uur per jaar aan de onderneming besteed */
  urencriterium: boolean;
  /** recht op startersaftrek (max. 3× in de eerste 5 jaar) */
  starter: boolean;
  /** ondernemingsvermogen (bezittingen − schulden van de zaak) */
  vermogen: number;
}

/** BV waarin de eigenaar een aanmerkelijk belang (≥ 5%) heeft: box 2 */
export interface BV {
  id: string;
  naam: string;
  eigenaar: PersoonId;
  /** waarde van jouw aandelen */
  waarde: number;
  groeiPct: number;
  /** fiscale winst van de BV per jaar, na DGA-loon, vóór vennootschapsbelasting */
  winst: number;
  /** salaris dat de BV aan de eigenaar betaalt (box 1) */
  dgaLoon: number;
  /** dividend dat de BV per jaar aan de eigenaar uitkeert (box 2) */
  dividend: number;
}

export interface Situatie {
  ik: Persoon;
  partner: Persoon | null;
  kinderen: Kind[];
  ondernemingen: Onderneming[];
  bvs: BV[];
  items: Item[];
}

export interface Snapshot extends Situatie {
  id: string;
  datum: string; // ISO yyyy-mm-dd
  notitie: string;
}

export const nieuwPersoon = (naam: string): Persoon => ({ naam, loon: 0, overigInkomen: 0, aftrekposten: 0 });

export const legeSituatie = (): Situatie => ({
  ik: nieuwPersoon('Ik'),
  partner: null,
  kinderen: [],
  ondernemingen: [],
  bvs: [],
  items: [],
});

/** leeftijd op 1 januari van het jaar (geboortedag binnen het jaar onbekend: we nemen aan na 1 januari) */
export const leeftijdOp1Jan = (geboortejaar: number, jaar: number) => jaar - geboortejaar - 1;

export const isMinderjarig = (k: Kind, jaar: number) => leeftijdOp1Jan(k.geboortejaar, jaar) < 18;
