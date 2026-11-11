import type { Category } from '../model/types';

/**
 * Alle fiscale parameters staan hier, per scenario. Nergens anders hardcoden.
 * Bronnen (geraadpleegd 11-11-2026):
 *  - Box 1 2026: https://www.rijksoverheid.nl/themas/werk/inkomstenbelasting/soorten-inkomstenbelasting
 *  - Box 2 2026: https://www.onderneming.nl/belastingschijven-2026/
 *  - Box 3 2026: https://www.sra.nl/nieuws/600041/2026/01/box-3-percentages-vrijstellingen-en-bedragen-2026
 *  - Box 3 2027/2028, Kamerbrief 29-09-2026: https://www.sra.nl/nieuws/004501/2026/09/nog-geen-duidelijkheid-over-box-3-vanaf-2028
 *  - Wet werkelijk rendement (TK 12-02-2026): https://www.vanlanschotkempen.com/nl-nl/private-banking/inspiratie/vermogensregie/box-3-wetsvoorstel-werkelijk-rendement
 */

export interface Schijf {
  /** bovengrens van de schijf in euro's; null = onbeperkt */
  tot: number | null;
  tarief: number; // fractie, 0.3575 = 35,75%
}

export type Box3Stelsel = 'forfaitair' | 'werkelijk';

export interface TaxParams {
  box1: {
    schijven: Schijf[];
    /** eigenwoningforfait als fractie van WOZ */
    ewf: number;
    villataksGrens: number;
    villataksTarief: number;
    /** maximaal tarief waartegen hypotheekrente aftrekbaar is */
    hraMaxTarief: number;
    /** hypothetisch: eigen woning + hypotheek verhuizen naar box 3 */
    eigenWoningNaarBox3: boolean;
  };
  box2: {
    schijven: Schijf[];
    /** partners: eerste schijf verdubbelt (bij gezamenlijk AB) */
    partnerVerdubbelt: boolean;
  };
  box3: {
    stelsel: Box3Stelsel;
    tarief: number;
    // forfaitair stelsel
    heffingsvrijVermogen: number; // per persoon
    schuldendrempel: number; // per persoon
    forfaitSparen: number;
    forfaitOverig: number;
    forfaitSchulden: number;
    groenVrijstelling: number; // per persoon
    groenHeffingskorting: number; // fractie van vrijgesteld groen vermogen
    // werkelijk-rendementstelsel
    heffingsvrijResultaat: number; // per persoon
    /** categorieën waarvan de waardegroei pas bij verkoop wordt belast (vermogenswinstbelasting) */
    vermogenswinstCategorieen: Category[];
    /** deel van de jaarlijkse waardegroei dat je gemiddeld realiseert (verkoopt) bij vermogenswinstbelasting */
    realisatieFractie: number;
  };
}

export interface Scenario {
  id: string;
  naam: string;
  jaar: number;
  status: 'geldend' | 'voorstel' | 'kabinetsoptie' | 'hypothetisch' | 'eigen';
  toelichting: string;
  params: TaxParams;
}

export const PARAMS_2026: TaxParams = {
  box1: {
    // tarieven tot AOW-leeftijd
    schijven: [
      { tot: 38883, tarief: 0.3575 },
      { tot: 78426, tarief: 0.3756 },
      { tot: null, tarief: 0.495 },
    ],
    ewf: 0.0035, // approximate: 0,35% voor WOZ tot villataksgrens
    villataksGrens: 1_330_000, // approximate
    villataksTarief: 0.0235, // approximate
    hraMaxTarief: 0.3756,
    eigenWoningNaarBox3: false,
  },
  box2: {
    schijven: [
      { tot: 68843, tarief: 0.245 },
      { tot: null, tarief: 0.31 },
    ],
    partnerVerdubbelt: true,
  },
  box3: {
    stelsel: 'forfaitair',
    tarief: 0.36,
    heffingsvrijVermogen: 59357,
    schuldendrempel: 3800,
    forfaitSparen: 0.0128, // voorlopig
    forfaitOverig: 0.06,
    forfaitSchulden: 0.027, // voorlopig
    groenVrijstelling: 26715,
    groenHeffingskorting: 0.001,
    heffingsvrijResultaat: 0,
    vermogenswinstCategorieen: [],
    realisatieFractie: 0,
  },
};

const clone = (p: TaxParams): TaxParams => structuredClone(p);

const met = (mut: (p: TaxParams) => void): TaxParams => {
  const p = clone(PARAMS_2026);
  mut(p);
  return p;
};

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'huidig-2026',
    naam: 'Huidig stelsel 2026',
    jaar: 2026,
    status: 'geldend',
    toelichting: 'De regels die nu gelden. Box 3 rekent met forfaitaire (fictieve) rendementen per vermogenscategorie.',
    params: clone(PARAMS_2026),
  },
  {
    id: 'box3-2027',
    naam: 'Box 3 in 2027 (Kamerbrief sept 2026)',
    jaar: 2027,
    status: 'voorstel',
    toelichting:
      'Heffingsvrij vermogen terug naar €30.846 per persoon en forfait overige bezittingen naar 7,87%. Box 1 en 2 gelijk aan 2026 gehouden (nog niet bekend).',
    params: met((p) => {
      p.box3.heffingsvrijVermogen = 30846;
      p.box3.forfaitOverig = 0.0787;
    }),
  },
  {
    id: 'wwr-2028-tk',
    naam: 'Werkelijk rendement 2028 (wet zoals aangenomen door TK)',
    jaar: 2028,
    status: 'voorstel',
    toelichting:
      'Box 3 belast je echte rendement: rente, dividend, huur én koersstijging (ook als je niet verkoopt), min schuldrente. €1.800 heffingsvrij resultaat. Vastgoed: waardestijging pas belast bij verkoop.',
    params: met((p) => {
      p.box3.stelsel = 'werkelijk';
      p.box3.heffingsvrijResultaat = 1800;
      p.box3.vermogenswinstCategorieen = ['vastgoed'];
    }),
  },
  {
    id: 'wwr-2028-kabinet',
    naam: 'Werkelijk rendement 2028, kabinetsscenario 1/2',
    jaar: 2028,
    status: 'kabinetsoptie',
    toelichting:
      'Als het wetsvoorstel, maar met heffingsvrij resultaat verlaagd naar €1.000 (Kamerbrief 29-09-2026).',
    params: met((p) => {
      p.box3.stelsel = 'werkelijk';
      p.box3.heffingsvrijResultaat = 1000;
      p.box3.vermogenswinstCategorieen = ['vastgoed'];
    }),
  },
  {
    id: 'vwb-2028-kabinet4',
    naam: 'Vermogenswinst op financiële instrumenten 2028, kabinetsscenario 4',
    jaar: 2028,
    status: 'kabinetsoptie',
    toelichting:
      'Koersstijging van aandelen, obligaties en vastgoed wordt pas belast bij verkoop. Rente, dividend en huur jaarlijks. Schuif "realisatie" om te kiezen hoeveel waardegroei je jaarlijks verkoopt.',
    params: met((p) => {
      p.box3.stelsel = 'werkelijk';
      p.box3.heffingsvrijResultaat = 1000;
      p.box3.vermogenswinstCategorieen = ['vastgoed', 'beleggingen', 'groen'];
      p.box3.realisatieFractie = 0.2;
    }),
  },
  {
    id: 'vwb-2030-kabinet3',
    naam: 'Volledige vermogenswinstbelasting 2030, kabinetsscenario 3',
    jaar: 2030,
    status: 'kabinetsoptie',
    toelichting:
      'Alle waardegroei pas belast bij verkoop. Aangenomen: €1.000 heffingsvrij resultaat en 36%, de details zijn nog niet bekend.',
    params: met((p) => {
      p.box3.stelsel = 'werkelijk';
      p.box3.heffingsvrijResultaat = 1000;
      p.box3.vermogenswinstCategorieen = ['vastgoed', 'beleggingen', 'groen', 'crypto', 'overig'];
      p.box3.realisatieFractie = 0.2;
    }),
  },
  {
    id: 'woning-box3',
    naam: 'Eigen woning naar box 3',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting:
      'Veel besproken hervorming: geen eigenwoningforfait en geen hypotheekrenteaftrek meer; woning en hypotheek tellen mee in box 3 (verder stelsel 2026).',
    params: met((p) => {
      p.box1.eigenWoningNaarBox3 = true;
    }),
  },
  {
    id: 'hra-afbouw',
    naam: 'Hypotheekrenteaftrek naar 25%',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting: 'Hypotheekrente is nog maar tegen 25% aftrekbaar in plaats van 37,56%.',
    params: met((p) => {
      p.box1.hraMaxTarief = 0.25;
    }),
  },
  {
    id: 'box2-hoger',
    naam: 'Box 2 één tarief 33%',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting: 'Eén vlak tarief van 33% over al het inkomen uit aanmerkelijk belang.',
    params: met((p) => {
      p.box2.schijven = [{ tot: null, tarief: 0.33 }];
    }),
  },
  {
    id: 'box3-40',
    naam: 'Box 3 tarief 40% (forfaitair)',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting: 'Als 2026, maar met box 3-tarief van 40%.',
    params: met((p) => {
      p.box3.tarief = 0.4;
    }),
  },
];

export const pct = (f: number, d = 2) =>
  `${(f * 100).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: d })}%`;
