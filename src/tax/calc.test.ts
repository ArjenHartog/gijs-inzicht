import { describe, expect, it } from 'vitest';
import {
  algemeneHeffingskorting,
  arbeidskorting,
  bereken,
  berekenBox3,
  combinatiekorting,
  ondernemersWinst,
  progressief,
  vermogenPerBox,
} from './calc';
import { PARAMS_2026, PRESET_SCENARIOS } from './parameters';
import { legeSituatie, type BV, type Item, type Situatie } from '../model/types';
import { migreer } from '../model/store';

const K = PARAMS_2026.kortingen;
const P = PARAMS_2026;

const item = (categorie: Item['categorie'], waarde: number, directPct = 0, groeiPct = 0, eigenaar: Item['eigenaar'] = 'samen'): Item => ({
  id: `${categorie}-${waarde}-${eigenaar}`,
  naam: categorie,
  categorie,
  eigenaar,
  waarde,
  directPct,
  groeiPct,
});

const sit = (extra: Partial<Situatie> = {}): Situatie => ({ ...legeSituatie(), ...extra });
const persoon = (loon: number, naam = 'Ik') => ({ naam, loon, overigInkomen: 0, aftrekposten: 0 });
const bv = (b: Partial<BV>): BV => ({ id: 'bv', naam: 'BV', eigenaar: 'ik', waarde: 0, groeiPct: 0, winst: 0, dgaLoon: 0, dividend: 0, ...b });

describe('progressief', () => {
  it('rekent schijven box 1 2026 correct', () => {
    expect(progressief(60000, P.box1.schijven)).toBeCloseTo(38883 * 0.3575 + 21117 * 0.3756, 2);
  });
});

describe('heffingskortingen 2026', () => {
  it('algemene heffingskorting: afbouw 6,398% boven €29.736 verzamelinkomen', () => {
    expect(algemeneHeffingskorting(20000, K)).toBe(3115);
    // 3.115 − (50.000 − 29.736) × 6,398% = 1.818,51
    expect(algemeneHeffingskorting(50000, K)).toBeCloseTo(1818.51, 1);
    expect(algemeneHeffingskorting(80000, K)).toBe(0);
  });
  it('arbeidskorting: opbouw per schijf, max €5.685, afbouw 6,51%', () => {
    // 11.965 × 8,324% + 13.880 × 31,009% + 4.155 × 1,95% = 5.381,04
    expect(arbeidskorting(30000, K)).toBeCloseTo(5381.04, 1);
    // 5.685 − (60.000 − 45.592) × 6,51% = 4.747,04
    expect(arbeidskorting(60000, K)).toBeCloseTo(4747.04, 1);
    expect(arbeidskorting(200000, K)).toBe(0);
  });
  it('combinatiekorting: 11,45% boven €6.240, max €3.032', () => {
    expect(combinatiekorting(20000, K)).toBeCloseTo((20000 - 6240) * 0.1145, 2);
    expect(combinatiekorting(50000, K)).toBe(3032);
  });
});

describe('ondernemer', () => {
  it('zelfstandigenaftrek en mkb-winstvrijstelling', () => {
    // 50.000 − 1.200 = 48.800; mkb 12,7% = 6.197,60; belastbaar 42.602,40
    const w = ondernemersWinst({ id: 'o', naam: 'o', eigenaar: 'ik', winst: 50000, urencriterium: true, starter: false, vermogen: 0 }, P);
    expect(w.belastbaar).toBeCloseTo(42602.4, 2);
  });
  it('starter krijgt startersaftrek erbij; zonder urencriterium geen aftrek', () => {
    const o = { id: 'o', naam: 'o', eigenaar: 'ik' as const, winst: 50000, urencriterium: true, starter: true, vermogen: 0 };
    expect(ondernemersWinst(o, P).aftrek).toBe(1200 + 2123);
    expect(ondernemersWinst({ ...o, urencriterium: false }, P).aftrek).toBe(0);
  });
});

describe('BV', () => {
  it('Vpb 19% tot €200.000, daarboven 25,8%', () => {
    const u = bereken(sit({ bvs: [bv({ winst: 250000 })] }), P);
    expect(u.vpbTotaal).toBeCloseTo(38000 + 12900, 2);
  });
  it('DGA-loon telt als box 1-arbeidsinkomen, dividend in box 2', () => {
    const u = bereken(sit({ bvs: [bv({ dgaLoon: 60000, dividend: 10000 })] }), P);
    expect(u.personen[0].box1Belastbaar).toBe(60000);
    expect(u.personen[0].box2Belasting).toBeCloseTo(2450, 2);
    expect(u.personen[0].ak).toBeCloseTo(arbeidskorting(60000, K), 2);
  });
  it('signaleert DGA-loon onder gebruikelijk loon', () => {
    const u = bereken(sit({ bvs: [bv({ dgaLoon: 40000, winst: 10000 })] }), P);
    expect(u.signalen.some((t) => t.includes('gebruikelijk loon'))).toBe(true);
  });
});

describe('box 3 forfaitair 2026', () => {
  it('handberekend: 100k spaargeld + 100k beleggingen', () => {
    // G = 200.000; rendement 1.280 + 6.000 = 7.280; voordeel (200.000 − 59.357) × 3,64% = 5.119,41; × 36% = 1.842,99
    const s = sit({ items: [item('spaargeld', 100000), item('beleggingen', 100000)] });
    expect(berekenBox3(s, P).voordeel * 0.36).toBeCloseTo(1842.99, 1);
    expect(bereken(s, P).box3).toBeCloseTo(1842.99, 1);
  });
  it('partners: dubbel heffingsvrij vermogen', () => {
    const s = sit({ partner: persoon(0, 'Partner'), items: [item('spaargeld', 110000)] });
    expect(berekenBox3(s, P).voordeel).toBe(0);
  });
  it('schulden onder drempel tellen niet', () => {
    const zonder = berekenBox3(sit({ items: [item('beleggingen', 100000)] }), P).voordeel;
    const met = berekenBox3(sit({ items: [item('beleggingen', 100000), item('schuld', 3000, 4)] }), P).voordeel;
    expect(met).toBeCloseTo(zonder, 6);
  });
});

describe('kinderen', () => {
  const kinderen = [
    { id: 'jong', naam: 'Jong', geboortejaar: 2015 },
    { id: 'oud', naam: 'Oud', geboortejaar: 2000 },
  ];
  it('vermogen minderjarig kind telt mee, meerderjarig kind niet', () => {
    const s = sit({ kinderen, items: [item('spaargeld', 10000, 0, 0, 'kind:jong'), item('spaargeld', 50000, 0, 0, 'kind:oud')] });
    expect(vermogenPerBox(s, 2026)[3].netto).toBe(10000);
  });
  it('combinatiekorting alleen voor minstverdienende partner met kind < 12', () => {
    const s = sit({ ik: persoon(80000), partner: persoon(30000, 'Partner'), kinderen: [{ id: 'k', naam: 'K', geboortejaar: 2020 }] });
    const u = bereken(s, P, 2026);
    expect(u.personen[0].iack).toBe(0);
    expect(u.personen[1].iack).toBeCloseTo((30000 - 6240) * 0.1145, 2);
    // kind is in 2034 ouder dan 12: geen combinatiekorting meer
    expect(bereken(s, P, 2034).personen[1].iack).toBe(0);
  });
});

describe('fiscaal partner', () => {
  it('verdeelt box 2-inkomen zo dat beide partners in de eerste schijf blijven', () => {
    const s = sit({ partner: persoon(0, 'Partner'), bvs: [bv({ dividend: 137686 })] });
    const u = bereken(s, P);
    expect(u.verdeling?.box2).toBe(0.5);
    expect(u.box2).toBeCloseTo(137686 * 0.245, 1);
  });
  it('box 3 naar de partner die geen algemene heffingskorting meer kan verliezen', () => {
    // ik: €120.000 loon, AHK al 0. Partner: €35.000, al boven afbouwpunt €29.736; elk euro box 3 bij partner kost 6,398% AHK
    const s = sit({ ik: persoon(120000), partner: persoon(35000, 'Partner'), items: [item('beleggingen', 300000)] });
    const u = bereken(s, P);
    expect(u.verdeling?.box3).toBe(1);
    expect(u.personen[1].box3Voordeel).toBe(0);
  });
});

describe('box 1 eigen woning', () => {
  it('rente boven 37,56% wordt beperkt', () => {
    const s = sit({ ik: persoon(100000), items: [item('eigen_woning', 500000), item('hypotheek', 400000, 4)] });
    const zonder = progressief(101750, P.box1.schijven);
    expect(zonder - bereken(s, P).personen[0].box1Belasting).toBeCloseTo(16000 * 0.3756, 2);
  });
  it('woning naar box 3 haalt forfait en aftrek weg', () => {
    const p = PRESET_SCENARIOS.find((x) => x.id === 'woning-box3')!.params;
    const s = sit({ ik: persoon(50000), items: [item('eigen_woning', 500000), item('hypotheek', 400000, 4)] });
    const u = bereken(s, p);
    expect(u.personen[0].box1Belasting).toBeCloseTo(progressief(50000, p.box1.schijven), 2);
    expect(u.box3).toBeGreaterThan(0);
  });
});

describe('box 3 werkelijk rendement', () => {
  const wwr = PRESET_SCENARIOS.find((s) => s.id === 'wwr-2028-tk')!.params;
  it('belast direct + waardegroei boven €1.800', () => {
    expect(berekenBox3(sit({ items: [item('beleggingen', 100000, 2, 5)] }), wwr).voordeel).toBeCloseTo(5200, 2);
  });
  it('vastgoed: waardegroei pas bij verkoop', () => {
    expect(berekenBox3(sit({ items: [item('vastgoed', 200000, 4, 3)] }), wwr).voordeel).toBeCloseTo(6200, 2);
  });
  it('verlies geeft geen negatief voordeel', () => {
    expect(berekenBox3(sit({ items: [item('beleggingen', 100000, 0, -20)] }), wwr).voordeel).toBe(0);
  });
});

describe('migratie van opgeslagen versie 1', () => {
  it('zet inkomen, partner en aanmerkelijk belang om', () => {
    const v1 = {
      huidig: {
        items: [
          { id: 'a', naam: 'Holding', categorie: 'aanmerkelijk_belang', waarde: 100000, directPct: 0, groeiPct: 4 },
          { id: 'b', naam: 'Spaar', categorie: 'spaargeld', waarde: 5000, directPct: 1, groeiPct: 0 },
        ],
        inkomen: { arbeid: 70000, heffingskortingen: 3000, box2Inkomen: 12000 },
        fiscaalPartner: true,
      },
      snapshots: [],
      eigenScenarios: [],
    };
    const s = migreer(v1)!;
    expect(s.huidig.ik.loon).toBe(70000);
    expect(s.huidig.partner).not.toBeNull();
    expect(s.huidig.bvs).toHaveLength(1);
    expect(s.huidig.bvs[0].dividend).toBe(12000);
    expect(s.huidig.items).toHaveLength(1);
    expect(s.huidig.items[0].eigenaar).toBe('samen');
  });
});
