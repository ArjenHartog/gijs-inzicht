import type { Category } from '../model/types';

/**
 * Alle fiscale parameters staan hier, per scenario. Nergens anders hardcoden.
 * Bronnen (geraadpleegd 11-11-2026):
 *  - Box 1 2026: https://www.rijksoverheid.nl/themas/werk/inkomstenbelasting/soorten-inkomstenbelasting
 *  - Heffingskortingen 2026: https://www.rijksoverheid.nl/onderwerpen/inkomstenbelasting/vraag-en-antwoord/wat-is-een-heffingskorting-en-welke-heffingskortingen-zijn-er
 *    en https://www.grantthornton.nl/insights/human-capital-services/loonheffingen-in-2026-de-cijfers/
 *  - AHK-afbouw over verzamelinkomen: https://www.accountant.nl/nieuws/2026/10/belastingdruk-box-3-kan-oplopen-tot-54-procent/
 *  - Box 2 2026: https://www.onderneming.nl/belastingschijven-2026/
 *  - Vpb en gebruikelijk loon 2026: https://www.mkbservicedesk.nl/nieuws/ondernemersnieuws/vpb-tarief-in-2025-en-2026
 *  - Ondernemersaftrek 2026: https://www.mkbservicedesk.nl/nieuws/ondernemersnieuws/zelfstandigenaftrek-2024-verlaagd
 *    en https://www.mkbservicedesk.nl/belastingen/aftrekposten/startersaftrek
 *  - Box 3 2026: https://www.sra.nl/nieuws/600041/2026/01/box-3-percentages-vrijstellingen-en-bedragen-2026
 *  - Box 3 minderjarige kinderen: https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/bezittingen_en_schulden_box_3_
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
  kortingen: {
    ahkMax: number;
    /** afbouw over verzamelinkomen (box 1 + 2 + 3) */
    ahkAfbouwVanaf: number;
    ahkAfbouwPct: number;
    /** opbouw arbeidskorting als schijven over arbeidsinkomen (laatste schijf 0%) */
    akOpbouw: Schijf[];
    akMax: number;
    akAfbouwVanaf: number;
    akAfbouwPct: number;
    /** inkomensafhankelijke combinatiekorting */
    iackMax: number;
    iackVanaf: number;
    iackPct: number;
    /** jongste kind moet op 1 januari jonger zijn dan deze leeftijd */
    iackKindLeeftijd: number;
  };
  ondernemer: {
    zelfstandigenaftrek: number;
    startersaftrek: number;
    mkbVrijstelling: number;
  };
  box2: {
    schijven: Schijf[];
  };
  vpb: {
    schijven: Schijf[];
    gebruikelijkLoon: number;
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
    ewf: 0.0035, // approximate: 0,35% voor WOZ tot villataksgrens, niet geverifieerd
    villataksGrens: 1_330_000, // approximate, niet geverifieerd
    villataksTarief: 0.0235, // approximate, niet geverifieerd
    hraMaxTarief: 0.3756,
    eigenWoningNaarBox3: false,
  },
  kortingen: {
    ahkMax: 3115,
    ahkAfbouwVanaf: 29736,
    ahkAfbouwPct: 0.06398,
    akOpbouw: [
      { tot: 11965, tarief: 0.08324 },
      { tot: 25845, tarief: 0.31009 },
      { tot: 45592, tarief: 0.0195 },
      { tot: null, tarief: 0 },
    ],
    akMax: 5685,
    akAfbouwVanaf: 45592,
    akAfbouwPct: 0.0651,
    iackMax: 3032,
    // startpunt afgeleid: maximum €3.032 bereikt bij €32.720 met opbouw 11,45% (opbouw% gelijk aan 2025)
    iackVanaf: 6240,
    iackPct: 0.1145,
    iackKindLeeftijd: 12,
  },
  ondernemer: {
    zelfstandigenaftrek: 1200,
    startersaftrek: 2123,
    mkbVrijstelling: 0.127,
  },
  box2: {
    schijven: [
      { tot: 68843, tarief: 0.245 },
      { tot: null, tarief: 0.31 },
    ],
  },
  vpb: {
    schijven: [
      { tot: 200000, tarief: 0.19 },
      { tot: null, tarief: 0.258 },
    ],
    gebruikelijkLoon: 58000,
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

/** vult ontbrekende velden aan met 2026-waarden (voor eigen scenario's uit een oudere versie) */
export function normaliseerParams(p: Partial<TaxParams>): TaxParams {
  const basis = clone(PARAMS_2026);
  return {
    box1: { ...basis.box1, ...p.box1 },
    kortingen: { ...basis.kortingen, ...p.kortingen },
    ondernemer: { ...basis.ondernemer, ...p.ondernemer },
    box2: { schijven: p.box2?.schijven ?? basis.box2.schijven },
    vpb: { ...basis.vpb, ...p.vpb },
    box3: { ...basis.box3, ...p.box3 },
  };
}

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
    naam: 'Bekende wijzigingen 2027',
    jaar: 2027,
    status: 'voorstel',
    toelichting:
      'Box 3: heffingsvrij vermogen terug naar €30.846 p.p. en forfait overige bezittingen 7,87% (Kamerbrief sept 2026). Zelfstandigenaftrek naar €900. Overige cijfers gelijk aan 2026 gehouden.',
    params: met((p) => {
      p.box3.heffingsvrijVermogen = 30846;
      p.box3.forfaitOverig = 0.0787;
      p.ondernemer.zelfstandigenaftrek = 900;
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
    toelichting: 'Als het wetsvoorstel, maar met heffingsvrij resultaat verlaagd naar €1.000 (Kamerbrief 29-09-2026).',
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
      'Koersstijging van aandelen, obligaties en vastgoed wordt pas belast bij verkoop. Rente, dividend en huur jaarlijks. Aanname: je verkoopt jaarlijks 20% van je waardegroei (aanpasbaar).',
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
      'Alle waardegroei pas belast bij verkoop. Aangenomen: €1.000 heffingsvrij resultaat, 36% en 20% jaarlijkse verkoop; de details zijn nog niet bekend.',
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
    id: 'vpb-vlak',
    naam: 'Vpb één tarief 25,8%',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting: 'Het lage Vpb-tarief van 19% over de eerste €200.000 verdwijnt.',
    params: met((p) => {
      p.vpb.schijven = [{ tot: null, tarief: 0.258 }];
    }),
  },
  {
    id: 'zelfst-weg',
    naam: 'Zelfstandigenaftrek afgeschaft',
    jaar: 2030,
    status: 'hypothetisch',
    toelichting: 'Zelfstandigen- en startersaftrek naar €0; mkb-winstvrijstelling blijft 12,7%.',
    params: met((p) => {
      p.ondernemer.zelfstandigenaftrek = 0;
      p.ondernemer.startersaftrek = 0;
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
