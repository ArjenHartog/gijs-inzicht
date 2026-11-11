import { CATEGORIES, type Box, type Item, type Situatie } from '../model/types';
import type { Schijf, TaxParams } from './parameters';

export interface Regel {
  label: string;
  bedrag: number;
}

export interface BoxUitkomst {
  belasting: number;
  regels: Regel[];
}

export interface Uitkomst {
  box1: BoxUitkomst;
  box2: BoxUitkomst;
  box3: BoxUitkomst;
  totaal: number;
  /** wat je vermogen in box 3 echt opbracht (direct + waardegroei − schuldrente) */
  box3WerkelijkRendement: number;
}

const som = (items: Item[], f: (i: Item) => number) => items.reduce((s, i) => s + f(i), 0);

/** progressieve heffing over schijven; schaal vermenigvuldigt de grenzen (bijv. 2 voor partners) */
export function progressief(bedrag: number, schijven: Schijf[], schaal = 1): number {
  let rest = Math.max(0, bedrag);
  let onder = 0;
  let belasting = 0;
  for (const s of schijven) {
    const boven = s.tot === null ? Infinity : s.tot * schaal;
    const deel = Math.min(rest, boven - onder);
    if (deel <= 0) break;
    belasting += deel * s.tarief;
    rest -= deel;
    onder = boven;
  }
  return belasting;
}

export function eigenwoningforfait(woz: number, p: TaxParams['box1']): number {
  if (woz <= 0) return 0;
  if (woz <= p.villataksGrens) return woz * p.ewf;
  return p.villataksGrens * p.ewf + (woz - p.villataksGrens) * p.villataksTarief;
}

const vanCat = (s: Situatie, ...cats: string[]) => s.items.filter((i) => cats.includes(i.categorie));

export function berekenBox1(s: Situatie, p: TaxParams): BoxUitkomst {
  const b = p.box1;
  const arbeid = s.inkomen.arbeid;
  const regels: Regel[] = [{ label: 'Inkomen uit werk en woning: arbeid/pensioen', bedrag: arbeid }];
  let ewf = 0;
  let rente = 0;
  if (!b.eigenWoningNaarBox3) {
    ewf = som(vanCat(s, 'eigen_woning'), (i) => eigenwoningforfait(i.waarde, b));
    rente = som(vanCat(s, 'hypotheek'), (i) => (i.waarde * i.directPct) / 100);
    if (ewf) regels.push({ label: 'Eigenwoningforfait', bedrag: ewf });
    if (rente) regels.push({ label: 'Aftrek hypotheekrente', bedrag: -rente });
  }
  const zonderAftrek = arbeid + ewf;
  const belastbaar = Math.max(0, zonderAftrek - rente);
  regels.push({ label: 'Belastbaar inkomen box 1', bedrag: belastbaar });

  let belasting = progressief(belastbaar, b.schijven);
  // aftrek is maximaal tegen hraMaxTarief waard
  if (rente > 0) {
    const voordeel = progressief(zonderAftrek, b.schijven) - belasting;
    const maxVoordeel = rente * b.hraMaxTarief;
    if (voordeel > maxVoordeel) {
      belasting += voordeel - maxVoordeel;
      regels.push({ label: 'Beperking aftrektarief hypotheekrente', bedrag: voordeel - maxVoordeel });
    }
  }
  regels.push({ label: 'Belasting vóór heffingskortingen', bedrag: belasting });
  if (s.inkomen.heffingskortingen) regels.push({ label: 'Heffingskortingen', bedrag: -s.inkomen.heffingskortingen });
  return { belasting: Math.max(0, belasting - s.inkomen.heffingskortingen), regels };
}

export function berekenBox2(s: Situatie, p: TaxParams): BoxUitkomst {
  const schaal = s.fiscaalPartner && p.box2.partnerVerdubbelt ? 2 : 1;
  const inkomen = s.inkomen.box2Inkomen;
  const belasting = progressief(inkomen, p.box2.schijven, schaal);
  return {
    belasting,
    regels: [
      { label: 'Inkomen uit aanmerkelijk belang', bedrag: inkomen },
      { label: 'Belasting box 2', bedrag: belasting },
    ],
  };
}

/** items die in box 3 vallen onder deze parameters */
export function box3Items(s: Situatie, p: TaxParams): Item[] {
  return s.items.filter((i) => {
    const box = CATEGORIES[i.categorie].box;
    if (box === 3) return true;
    return p.box1.eigenWoningNaarBox3 && (i.categorie === 'eigen_woning' || i.categorie === 'hypotheek');
  });
}

export function werkelijkRendement(items: Item[]): number {
  return som(items, (i) => {
    const r = (i.waarde * (i.directPct + (CATEGORIES[i.categorie].isSchuld ? 0 : i.groeiPct))) / 100;
    return CATEGORIES[i.categorie].isSchuld ? -r : r;
  });
}

export function berekenBox3(s: Situatie, p: TaxParams): BoxUitkomst {
  const b = p.box3;
  const n = s.fiscaalPartner ? 2 : 1;
  const items = box3Items(s, p);
  const isSchuld = (i: Item) => CATEGORIES[i.categorie].isSchuld;

  if (b.stelsel === 'forfaitair') {
    const sparen = som(items.filter((i) => i.categorie === 'spaargeld'), (i) => i.waarde);
    const groen = som(items.filter((i) => i.categorie === 'groen'), (i) => i.waarde);
    const groenVrij = Math.min(groen, b.groenVrijstelling * n);
    const overig =
      som(items.filter((i) => !isSchuld(i) && i.categorie !== 'spaargeld'), (i) => i.waarde) - groenVrij;
    const schuldenBruto = som(items.filter(isSchuld), (i) => i.waarde);
    const schulden = Math.max(0, schuldenBruto - b.schuldendrempel * n);
    const grondslag = sparen + overig - schulden;
    const rendement = sparen * b.forfaitSparen + overig * b.forfaitOverig - schulden * b.forfaitSchulden;
    const regels: Regel[] = [
      { label: 'Banktegoeden', bedrag: sparen },
      { label: 'Overige bezittingen', bedrag: overig },
    ];
    if (groenVrij) regels.push({ label: 'Vrijgesteld groen vermogen', bedrag: -groenVrij });
    regels.push(
      { label: 'Schulden boven drempel', bedrag: -schulden },
      { label: 'Rendementsgrondslag', bedrag: grondslag },
      { label: 'Forfaitair (fictief) rendement', bedrag: rendement },
      { label: 'Heffingsvrij vermogen', bedrag: -b.heffingsvrijVermogen * n },
    );
    if (grondslag <= b.heffingsvrijVermogen * n || rendement <= 0) {
      return { belasting: 0, regels: [...regels, { label: 'Belasting box 3', bedrag: 0 }] };
    }
    const grondslagSparenBeleggen = grondslag - b.heffingsvrijVermogen * n;
    const voordeel = (grondslagSparenBeleggen * rendement) / grondslag;
    const groenKorting = groenVrij * b.groenHeffingskorting;
    const belasting = Math.max(0, voordeel * b.tarief - groenKorting);
    regels.push(
      { label: `Belastbaar voordeel (${((rendement / grondslag) * 100).toFixed(2)}% van grondslag na vrijstelling)`, bedrag: voordeel },
      { label: 'Belasting box 3', bedrag: belasting },
    );
    return { belasting, regels };
  }

  // werkelijk rendement: vermogensaanwas, met vermogenswinst (bij realisatie) voor gekozen categorieën
  let direct = 0;
  let groeiBelast = 0;
  let groeiUitgesteld = 0;
  let rente = 0;
  for (const i of items) {
    if (isSchuld(i)) {
      rente += (i.waarde * i.directPct) / 100;
      continue;
    }
    direct += (i.waarde * i.directPct) / 100;
    const groei = (i.waarde * i.groeiPct) / 100;
    const cat = i.categorie === 'eigen_woning' ? 'vastgoed' : i.categorie;
    if (b.vermogenswinstCategorieen.includes(cat)) {
      groeiBelast += groei * b.realisatieFractie;
      groeiUitgesteld += groei * (1 - b.realisatieFractie);
    } else {
      groeiBelast += groei;
    }
  }
  const resultaat = direct + groeiBelast - rente;
  const belastbaar = Math.max(0, resultaat - b.heffingsvrijResultaat * n);
  const belasting = belastbaar * b.tarief;
  const regels: Regel[] = [
    { label: 'Rente, dividend, huur', bedrag: direct },
    { label: 'Belaste waardegroei', bedrag: groeiBelast },
  ];
  if (groeiUitgesteld) regels.push({ label: 'Waardegroei, pas belast bij verkoop (uitgesteld)', bedrag: groeiUitgesteld });
  regels.push(
    { label: 'Schuldrente (aftrekbaar)', bedrag: -rente },
    { label: 'Werkelijk resultaat', bedrag: resultaat },
    { label: 'Heffingsvrij resultaat', bedrag: -b.heffingsvrijResultaat * n },
    { label: 'Belasting box 3', bedrag: belasting },
  );
  return { belasting, regels };
}

export function bereken(s: Situatie, p: TaxParams): Uitkomst {
  const box1 = berekenBox1(s, p);
  const box2 = berekenBox2(s, p);
  const box3 = berekenBox3(s, p);
  return {
    box1,
    box2,
    box3,
    totaal: box1.belasting + box2.belasting + box3.belasting,
    box3WerkelijkRendement: werkelijkRendement(box3Items(s, p)),
  };
}

/** netto vermogen per box (bezittingen − schulden), volgens de huidige boxindeling */
export function vermogenPerBox(s: Situatie): Record<Box, { bezit: number; schuld: number; netto: number }> {
  const out = {
    1: { bezit: 0, schuld: 0, netto: 0 },
    2: { bezit: 0, schuld: 0, netto: 0 },
    3: { bezit: 0, schuld: 0, netto: 0 },
  } as Record<Box, { bezit: number; schuld: number; netto: number }>;
  for (const i of s.items) {
    const c = CATEGORIES[i.categorie];
    const r = out[c.box];
    if (c.isSchuld) r.schuld += i.waarde;
    else r.bezit += i.waarde;
    r.netto = r.bezit - r.schuld;
  }
  return out;
}

export interface ProjectieJaar {
  jaar: number;
  nettoVermogen: number;
  belasting: number;
  cumulatieveBelasting: number;
}

/**
 * Eenvoudige meerjarenprojectie: opbrengsten worden herbelegd in hetzelfde item,
 * belasting wordt betaald uit het netto vermogen. Inkomen en schulden blijven gelijk.
 */
export function projecteer(s: Situatie, p: TaxParams, startJaar: number, jaren: number): ProjectieJaar[] {
  let items = s.items.map((i) => ({ ...i }));
  let cum = 0;
  let belastingPot = 0; // betaalde belasting, in mindering op vermogen
  const res: ProjectieJaar[] = [];
  for (let j = 0; j <= jaren; j++) {
    const sit: Situatie = { ...s, items };
    const netto = som(items, (i) => (CATEGORIES[i.categorie].isSchuld ? -i.waarde : i.waarde)) - belastingPot;
    const u = bereken(sit, p);
    res.push({ jaar: startJaar + j, nettoVermogen: Math.round(netto), belasting: Math.round(u.totaal), cumulatieveBelasting: Math.round(cum) });
    cum += u.totaal;
    belastingPot += u.box3.belasting; // box 1/2 worden uit inkomen betaald
    items = items.map((i) => {
      const c = CATEGORIES[i.categorie];
      if (c.isSchuld) return i;
      const herbelegd = c.box === 3 ? i.directPct : 0;
      return { ...i, waarde: i.waarde * (1 + (herbelegd + i.groeiPct) / 100) };
    });
  }
  return res;
}
