import {
  CATEGORIES,
  isMinderjarig,
  leeftijdOp1Jan,
  type Box,
  type Category,
  type Item,
  type Onderneming,
  type PersoonId,
  type Situatie,
} from '../model/types';
import type { Schijf, TaxParams } from './parameters';

export interface Regel {
  label: string;
  bedrag: number;
}

export const HUIDIG_JAAR = new Date().getFullYear();

const som = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);

/** progressieve heffing over schijven */
export function progressief(bedrag: number, schijven: Schijf[]): number {
  let rest = Math.max(0, bedrag);
  let onder = 0;
  let belasting = 0;
  for (const s of schijven) {
    const boven = s.tot === null ? Infinity : s.tot;
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

// ---------- welke bezittingen tellen mee ----------

/** telt een item mee voor het huishouden? Vermogen van meerderjarige kinderen niet. */
export function teltMee(i: Item, s: Situatie, jaar: number): boolean {
  if (!i.eigenaar.startsWith('kind:')) return true;
  const kind = s.kinderen.find((k) => `kind:${k.id}` === i.eigenaar);
  return !!kind && isMinderjarig(kind, jaar);
}

export interface VermogensRegel {
  id: string;
  naam: string;
  box: Box;
  waarde: number;
  isSchuld: boolean;
  categorie?: Category;
}

export function vermogensRegels(s: Situatie, jaar = HUIDIG_JAAR): VermogensRegel[] {
  return [
    ...s.items
      .filter((i) => teltMee(i, s, jaar))
      .map((i) => ({ id: i.id, naam: i.naam, box: CATEGORIES[i.categorie].box, waarde: i.waarde, isSchuld: CATEGORIES[i.categorie].isSchuld, categorie: i.categorie })),
    ...s.ondernemingen.map((o) => ({ id: o.id, naam: `${o.naam} (ondernemingsvermogen)`, box: 1 as Box, waarde: Math.abs(o.vermogen), isSchuld: o.vermogen < 0 })),
    ...s.bvs.map((b) => ({ id: b.id, naam: `${b.naam} (aandelen)`, box: 2 as Box, waarde: b.waarde, isSchuld: false })),
  ];
}

export type PerBox = Record<Box, { bezit: number; schuld: number; netto: number }>;

export function vermogenPerBox(s: Situatie, jaar = HUIDIG_JAAR): PerBox {
  const out: PerBox = { 1: { bezit: 0, schuld: 0, netto: 0 }, 2: { bezit: 0, schuld: 0, netto: 0 }, 3: { bezit: 0, schuld: 0, netto: 0 } };
  for (const r of vermogensRegels(s, jaar)) {
    const b = out[r.box];
    if (r.isSchuld) b.schuld += r.waarde;
    else b.bezit += r.waarde;
    b.netto = b.bezit - b.schuld;
  }
  return out;
}

export const nettoVermogen = (s: Situatie, jaar = HUIDIG_JAAR) => {
  const v = vermogenPerBox(s, jaar);
  return v[1].netto + v[2].netto + v[3].netto;
};

// ---------- box 3 (gezamenlijk berekend, daarna verdeeld tussen partners) ----------

export function box3Items(s: Situatie, p: TaxParams, jaar = HUIDIG_JAAR): Item[] {
  return s.items.filter((i) => {
    if (!teltMee(i, s, jaar)) return false;
    if (CATEGORIES[i.categorie].box === 3) return true;
    return p.box1.eigenWoningNaarBox3 && (i.categorie === 'eigen_woning' || i.categorie === 'hypotheek');
  });
}

export function werkelijkRendement(items: Item[]): number {
  return som(items, (i) => {
    const schuld = CATEGORIES[i.categorie].isSchuld;
    const r = (i.waarde * (i.directPct + (schuld ? 0 : i.groeiPct))) / 100;
    return schuld ? -r : r;
  });
}

export interface Box3Uitkomst {
  /** belastbaar voordeel/resultaat van het hele huishouden, vóór verdeling */
  voordeel: number;
  groenKorting: number;
  regels: Regel[];
}

export function berekenBox3(s: Situatie, p: TaxParams, jaar = HUIDIG_JAAR): Box3Uitkomst {
  const b = p.box3;
  const n = s.partner ? 2 : 1;
  const items = box3Items(s, p, jaar);
  const isSchuld = (i: Item) => CATEGORIES[i.categorie].isSchuld;

  if (b.stelsel === 'forfaitair') {
    const sparen = som(items.filter((i) => i.categorie === 'spaargeld'), (i) => i.waarde);
    const groen = som(items.filter((i) => i.categorie === 'groen'), (i) => i.waarde);
    const groenVrij = Math.min(groen, b.groenVrijstelling * n);
    const overig = som(items.filter((i) => !isSchuld(i) && i.categorie !== 'spaargeld'), (i) => i.waarde) - groenVrij;
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
      { label: `Heffingsvrij vermogen (${n}×)`, bedrag: -b.heffingsvrijVermogen * n },
    );
    if (grondslag <= b.heffingsvrijVermogen * n || rendement <= 0) {
      return { voordeel: 0, groenKorting: 0, regels: [...regels, { label: 'Belastbaar voordeel', bedrag: 0 }] };
    }
    const voordeel = ((grondslag - b.heffingsvrijVermogen * n) * rendement) / grondslag;
    regels.push({ label: `Belastbaar voordeel (${((rendement / grondslag) * 100).toFixed(2)}% van grondslag na vrijstelling)`, bedrag: voordeel });
    return { voordeel, groenKorting: groenVrij * b.groenHeffingskorting, regels };
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
  const voordeel = Math.max(0, resultaat - b.heffingsvrijResultaat * n);
  const regels: Regel[] = [
    { label: 'Rente, dividend, huur', bedrag: direct },
    { label: 'Belaste waardegroei', bedrag: groeiBelast },
  ];
  if (groeiUitgesteld) regels.push({ label: 'Waardegroei, pas belast bij verkoop (uitgesteld)', bedrag: groeiUitgesteld });
  regels.push(
    { label: 'Schuldrente (aftrekbaar)', bedrag: -rente },
    { label: 'Werkelijk resultaat', bedrag: resultaat },
    { label: `Heffingsvrij resultaat (${n}×)`, bedrag: -b.heffingsvrijResultaat * n },
    { label: 'Belastbaar resultaat', bedrag: voordeel },
  );
  return { voordeel, groenKorting: 0, regels };
}

// ---------- ondernemers en kortingen ----------

export function ondernemersWinst(o: Onderneming, p: TaxParams) {
  const q = p.ondernemer;
  const maxAftrek = o.urencriterium ? q.zelfstandigenaftrek + (o.starter ? q.startersaftrek : 0) : 0;
  const aftrek = Math.min(maxAftrek, Math.max(0, o.winst));
  const naAftrek = o.winst - aftrek;
  const mkb = naAftrek * q.mkbVrijstelling;
  return { aftrek, mkb, belastbaar: naAftrek - mkb, arbeidsinkomen: Math.max(0, naAftrek) };
}

export function algemeneHeffingskorting(verzamelinkomen: number, k: TaxParams['kortingen']) {
  return Math.max(0, k.ahkMax - Math.max(0, verzamelinkomen - k.ahkAfbouwVanaf) * k.ahkAfbouwPct);
}

export function arbeidskorting(arbeidsinkomen: number, k: TaxParams['kortingen']) {
  if (arbeidsinkomen <= 0) return 0;
  const opbouw = Math.min(k.akMax, progressief(arbeidsinkomen, k.akOpbouw));
  return Math.max(0, opbouw - Math.max(0, arbeidsinkomen - k.akAfbouwVanaf) * k.akAfbouwPct);
}

export function combinatiekorting(arbeidsinkomen: number, k: TaxParams['kortingen']) {
  if (arbeidsinkomen <= k.iackVanaf) return 0;
  return Math.min(k.iackMax, (arbeidsinkomen - k.iackVanaf) * k.iackPct);
}

// ---------- per persoon ----------

export interface PersoonUitkomst {
  id: PersoonId;
  naam: string;
  box1Belastbaar: number;
  box1Belasting: number;
  box2Inkomen: number;
  box2Belasting: number;
  box3Voordeel: number;
  box3Belasting: number;
  ahk: number;
  ak: number;
  iack: number;
  kortingenBenut: number;
  /** kortingen die niet verzilverd kunnen worden omdat er te weinig belasting is */
  kortingenOnbenut: number;
  totaal: number;
  regels: Regel[];
}

/** deel van gezamenlijke posten dat aan 'ik' wordt toegerekend (partner krijgt de rest) */
export interface Verdeling {
  woning: number;
  box2: number;
  box3: number;
}

export interface Uitkomst {
  personen: PersoonUitkomst[];
  vpb: { naam: string; winst: number; belasting: number }[];
  /** box 1-belasting na aftrek van heffingskortingen (huishouden) */
  box1: number;
  box2: number;
  box3: number;
  vpbTotaal: number;
  kortingen: number;
  /** inkomstenbelasting huishouden (box 1+2+3 na kortingen) */
  inkomstenbelasting: number;
  /** inkomstenbelasting + vennootschapsbelasting */
  totaal: number;
  verdeling: Verdeling | null;
  regels: { box1: Regel[]; box2: Regel[]; box3: Regel[]; vpb: Regel[] };
  box3WerkelijkRendement: number;
  signalen: string[];
}

const STAPPEN = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

export function bereken(s: Situatie, p: TaxParams, jaar = HUIDIG_JAAR): Uitkomst {
  const k = p.kortingen;
  const pers = s.partner ? ([['ik', s.ik], ['partner', s.partner]] as const) : ([['ik', s.ik]] as const);

  // vaste posten per persoon
  const vast = pers.map(([id, persoon]) => {
    const dgaLoon = som(s.bvs.filter((b) => b.eigenaar === id), (b) => b.dgaLoon);
    const ond = s.ondernemingen.filter((o) => o.eigenaar === id).map((o) => ({ o, w: ondernemersWinst(o, p) }));
    const winst = som(ond, (x) => x.w.belastbaar);
    const arbeidsinkomen = persoon.loon + dgaLoon + som(ond, (x) => x.w.arbeidsinkomen);
    const regels: Regel[] = [];
    if (persoon.loon) regels.push({ label: 'Loon', bedrag: persoon.loon });
    if (dgaLoon) regels.push({ label: 'DGA-loon uit eigen BV', bedrag: dgaLoon });
    for (const { o, w } of ond) {
      regels.push({ label: `Winst ${o.naam}`, bedrag: o.winst });
      if (w.aftrek) regels.push({ label: 'Ondernemersaftrek', bedrag: -w.aftrek });
      if (w.mkb) regels.push({ label: 'Mkb-winstvrijstelling', bedrag: -w.mkb });
    }
    if (persoon.overigInkomen) regels.push({ label: 'Uitkering, pensioen, overig', bedrag: persoon.overigInkomen });
    if (persoon.aftrekposten) regels.push({ label: 'Persoonsgebonden aftrek', bedrag: -persoon.aftrekposten });
    return { id, naam: persoon.naam, basis: persoon.loon + persoon.overigInkomen + dgaLoon + winst - persoon.aftrekposten, arbeidsinkomen, regels };
  });

  // gezamenlijke posten
  let ewf = 0;
  let rente = 0;
  if (!p.box1.eigenWoningNaarBox3) {
    ewf = som(s.items.filter((i) => i.categorie === 'eigen_woning' && teltMee(i, s, jaar)), (i) => eigenwoningforfait(i.waarde, p.box1));
    rente = som(s.items.filter((i) => i.categorie === 'hypotheek' && teltMee(i, s, jaar)), (i) => (i.waarde * i.directPct) / 100);
  }
  const box2Totaal = som(s.bvs, (b) => b.dividend);
  const b3 = berekenBox3(s, p, jaar);
  const jongste = s.kinderen.length ? Math.min(...s.kinderen.map((x) => leeftijdOp1Jan(x.geboortejaar, jaar))) : Infinity;
  const kindVoorIack = jongste < k.iackKindLeeftijd;
  const laagsteArbeid = Math.min(...vast.map((v) => v.arbeidsinkomen));

  const reken = (v: Verdeling, metRegels: boolean): PersoonUitkomst[] =>
    vast.map((x, idx) => {
      const deel = (f: number) => (idx === 0 ? f : 1 - f);
      const sw = deel(v.woning);
      const zonderAftrek = x.basis + ewf * sw;
      const renteDeel = rente * sw;
      const box1Belastbaar = Math.max(0, zonderAftrek - renteDeel);
      let box1Belasting = progressief(box1Belastbaar, p.box1.schijven);
      let beperking = 0;
      if (renteDeel > 0) {
        const voordeel = progressief(Math.max(0, zonderAftrek), p.box1.schijven) - box1Belasting;
        beperking = Math.max(0, voordeel - renteDeel * p.box1.hraMaxTarief);
        box1Belasting += beperking;
      }
      const box2Inkomen = box2Totaal * deel(v.box2);
      const box2Belasting = progressief(box2Inkomen, p.box2.schijven);
      const box3Voordeel = b3.voordeel * deel(v.box3);
      const box3Belasting = Math.max(0, box3Voordeel * p.box3.tarief - b3.groenKorting * deel(v.box3));
      const verzamel = box1Belastbaar + box2Inkomen + box3Voordeel;
      const ahk = algemeneHeffingskorting(verzamel, k);
      const ak = arbeidskorting(x.arbeidsinkomen, k);
      const iack = kindVoorIack && (vast.length === 1 || x.arbeidsinkomen <= laagsteArbeid) ? combinatiekorting(x.arbeidsinkomen, k) : 0;
      const bruto = box1Belasting + box2Belasting + box3Belasting;
      const kortingenBenut = Math.min(bruto, ahk + ak + iack);
      let regels: Regel[] = [];
      if (metRegels) {
        regels = [...x.regels];
        if (ewf * sw) regels.push({ label: `Eigenwoningforfait (${Math.round(sw * 100)}%)`, bedrag: ewf * sw });
        if (renteDeel) regels.push({ label: `Hypotheekrente (${Math.round(sw * 100)}%)`, bedrag: -renteDeel });
        regels.push({ label: 'Belastbaar inkomen box 1', bedrag: box1Belastbaar });
        if (beperking) regels.push({ label: 'Beperking aftrektarief hypotheekrente', bedrag: beperking });
        regels.push({ label: 'Belasting box 1 vóór kortingen', bedrag: box1Belasting });
        regels.push({ label: `Verzamelinkomen (voor afbouw heffingskorting)`, bedrag: verzamel });
        regels.push({ label: 'Algemene heffingskorting', bedrag: -ahk });
        if (ak) regels.push({ label: 'Arbeidskorting', bedrag: -ak });
        if (iack) regels.push({ label: 'Inkomensafhankelijke combinatiekorting', bedrag: -iack });
        if (ahk + ak + iack > kortingenBenut) regels.push({ label: 'Niet te verzilveren kortingen', bedrag: ahk + ak + iack - kortingenBenut });
      }
      return {
        id: x.id,
        naam: x.naam,
        box1Belastbaar,
        box1Belasting,
        box2Inkomen,
        box2Belasting,
        box3Voordeel,
        box3Belasting,
        ahk,
        ak,
        iack,
        kortingenBenut,
        kortingenOnbenut: ahk + ak + iack - kortingenBenut,
        totaal: bruto - kortingenBenut,
        regels,
      };
    });

  // partners: zoek de verdeling van gezamenlijke posten met de laagste totale belasting
  let verdeling: Verdeling | null = null;
  if (s.partner) {
    let beste = Infinity;
    let besteAfstand = Infinity;
    for (const woning of ewf || rente ? STAPPEN : [0.5])
      for (const box2 of box2Totaal ? STAPPEN : [0.5])
        for (const box3 of b3.voordeel ? STAPPEN : [0.5]) {
          const v = { woning, box2, box3 };
          const t = som(reken(v, false), (x) => x.totaal);
          const afstand = Math.abs(woning - 0.5) + Math.abs(box2 - 0.5) + Math.abs(box3 - 0.5);
          if (t < beste - 0.5 || (Math.abs(t - beste) <= 0.5 && afstand < besteAfstand)) {
            beste = Math.min(beste, t);
            besteAfstand = afstand;
            verdeling = v;
          }
        }
  }
  const personen = reken(verdeling ?? { woning: 1, box2: 1, box3: 1 }, true);

  const vpb = s.bvs.map((b) => ({ naam: b.naam, winst: b.winst, belasting: progressief(b.winst, p.vpb.schijven) }));
  const vpbTotaal = som(vpb, (x) => x.belasting);
  const box2 = som(personen, (x) => x.box2Belasting);
  const box3 = som(personen, (x) => x.box3Belasting);
  const kortingen = som(personen, (x) => x.kortingenBenut);
  const inkomstenbelasting = som(personen, (x) => x.totaal);

  const box2Regels: Regel[] = [
    ...s.bvs.filter((b) => b.dividend).map((b) => ({ label: `Dividend ${b.naam}`, bedrag: b.dividend })),
    ...personen.filter((x) => x.box2Inkomen).flatMap((x) => [
      { label: `${x.naam}: inkomen box 2`, bedrag: x.box2Inkomen },
      { label: `${x.naam}: belasting box 2`, bedrag: x.box2Belasting },
    ]),
  ];
  const box3Regels: Regel[] = [
    ...b3.regels,
    ...(personen.length > 1 ? personen.map((x) => ({ label: `${x.naam}: deel voordeel`, bedrag: x.box3Voordeel })) : []),
    { label: `Belasting box 3 (${pctTekst(p.box3.tarief)})`, bedrag: box3 },
  ];
  const vpbRegels: Regel[] = vpb.flatMap((x) => [
    { label: `${x.naam}: winst`, bedrag: x.winst },
    { label: `${x.naam}: vennootschapsbelasting`, bedrag: x.belasting },
  ]);

  return {
    personen,
    vpb,
    box1: inkomstenbelasting - box2 - box3,
    box2,
    box3,
    vpbTotaal,
    kortingen,
    inkomstenbelasting,
    totaal: inkomstenbelasting + vpbTotaal,
    verdeling,
    regels: { box1: personen.flatMap((x) => x.regels.map((r) => ({ ...r, label: personen.length > 1 ? `${x.naam}: ${r.label}` : r.label }))), box2: box2Regels, box3: box3Regels, vpb: vpbRegels },
    box3WerkelijkRendement: werkelijkRendement(box3Items(s, p, jaar)),
    signalen: signalen(s, p, jaar, personen),
  };
}

const pctTekst = (f: number) => `${Math.round(f * 1000) / 10}%`;
const eur = (n: number) => `€${Math.round(n).toLocaleString('nl-NL')}`;

function signalen(s: Situatie, p: TaxParams, jaar: number, personen: PersoonUitkomst[]): string[] {
  const out: string[] = [];
  for (const b of s.bvs) {
    if (b.dgaLoon > 0 && b.dgaLoon < p.vpb.gebruikelijkLoon)
      out.push(`DGA-loon uit ${b.naam} (${eur(b.dgaLoon)}) ligt onder het gebruikelijk loon van ${eur(p.vpb.gebruikelijkLoon)}. Werk je in deze BV, dan kan de Belastingdienst een hoger loon voorschrijven.`);
    if (b.dgaLoon === 0 && b.winst > 0)
      out.push(`${b.naam} keert geen DGA-loon uit. Werk je zelf in de BV, dan geldt een gebruikelijk loon van minimaal ${eur(p.vpb.gebruikelijkLoon)} (bij een holding zonder werkzaamheden niet).`);
    const naVpb = b.winst - progressief(b.winst, p.vpb.schijven);
    if (b.dividend > naVpb && b.dividend > 0) out.push(`Dividend uit ${b.naam} is hoger dan de winst na Vpb; het verschil komt uit de reserves van de BV.`);
  }
  for (const o of s.ondernemingen) {
    if (!o.urencriterium && o.winst > 0) out.push(`${o.naam}: zonder urencriterium (1.225 uur) geen zelfstandigen- of startersaftrek; de mkb-winstvrijstelling geldt wel.`);
  }
  for (const k of s.kinderen) {
    const heeft = s.items.some((i) => i.eigenaar === `kind:${k.id}`);
    if (heeft && !isMinderjarig(k, jaar)) out.push(`${k.naam} is meerderjarig: het vermogen van ${k.naam} telt niet meer mee in jullie box 3 en ook niet in jullie netto vermogen.`);
  }
  for (const x of personen) {
    if (x.kortingenOnbenut > 1) out.push(`${x.naam} kan ${eur(x.kortingenOnbenut)} aan heffingskortingen niet verzilveren door te weinig belasting.`);
  }
  return out;
}

// ---------- projectie ----------

export interface ProjectieJaar {
  jaar: number;
  nettoVermogen: number;
  belasting: number;
  cumulatieveBelasting: number;
}

/**
 * Eenvoudige meerjarenprojectie: opbrengsten in box 3 worden herbelegd, box 3-belasting gaat van het vermogen af,
 * overige bezittingen groeien met hun groei-%. Inkomen, BV-winst en schulden blijven gelijk. Kinderen worden ouder.
 */
export function projecteer(s: Situatie, p: TaxParams, startJaar: number, jaren: number): ProjectieJaar[] {
  let items = s.items.map((i) => ({ ...i }));
  let bvs = s.bvs.map((b) => ({ ...b }));
  let cum = 0;
  let belastingPot = 0;
  const res: ProjectieJaar[] = [];
  for (let j = 0; j <= jaren; j++) {
    const jaar = startJaar + j;
    const sit: Situatie = { ...s, items, bvs };
    const u = bereken(sit, p, jaar);
    res.push({ jaar, nettoVermogen: Math.round(nettoVermogen(sit, jaar) - belastingPot), belasting: Math.round(u.totaal), cumulatieveBelasting: Math.round(cum) });
    cum += u.totaal;
    belastingPot += u.box3;
    items = items.map((i) => {
      const c = CATEGORIES[i.categorie];
      if (c.isSchuld) return i;
      const herbelegd = c.box === 3 ? i.directPct : 0;
      return { ...i, waarde: i.waarde * (1 + (herbelegd + i.groeiPct) / 100) };
    });
    bvs = bvs.map((b) => ({ ...b, waarde: b.waarde * (1 + b.groeiPct / 100) }));
  }
  return res;
}
