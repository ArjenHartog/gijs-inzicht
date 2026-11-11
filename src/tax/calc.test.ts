import { describe, expect, it } from 'vitest';
import { bereken, berekenBox1, berekenBox2, berekenBox3, progressief } from './calc';
import { PARAMS_2026, PRESET_SCENARIOS } from './parameters';
import type { Item, Situatie } from '../model/types';

const item = (categorie: Item['categorie'], waarde: number, directPct = 0, groeiPct = 0): Item => ({
  id: `${categorie}-${waarde}`,
  naam: categorie,
  categorie,
  waarde,
  directPct,
  groeiPct,
});

const sit = (items: Item[], extra: Partial<Situatie> = {}): Situatie => ({
  items,
  inkomen: { arbeid: 0, heffingskortingen: 0, box2Inkomen: 0 },
  fiscaalPartner: false,
  ...extra,
});

describe('progressief', () => {
  it('rekent schijven box 1 2026 correct', () => {
    // 38.883 × 35,75% + (60.000 − 38.883) × 37,56%
    expect(progressief(60000, PARAMS_2026.box1.schijven)).toBeCloseTo(38883 * 0.3575 + 21117 * 0.3756, 2);
  });
  it('verdubbelt grenzen met schaal', () => {
    expect(progressief(100000, PARAMS_2026.box2.schijven, 2)).toBeCloseTo(100000 * 0.245, 2);
  });
});

describe('box 3 forfaitair 2026', () => {
  it('geen belasting onder heffingsvrij vermogen', () => {
    expect(berekenBox3(sit([item('spaargeld', 59000)]), PARAMS_2026).belasting).toBe(0);
  });

  it('handberekend voorbeeld: 100k spaargeld + 100k beleggingen', () => {
    // G = 200.000; rendement = 1.280 + 6.000 = 7.280; % = 3,64%
    // grondslag = 200.000 − 59.357 = 140.643; voordeel = 5.119,41; × 36% = 1.842,99
    const b = berekenBox3(sit([item('spaargeld', 100000), item('beleggingen', 100000)]), PARAMS_2026);
    expect(b.belasting).toBeCloseTo(1842.99, 1);
  });

  it('partners: dubbel heffingsvrij vermogen', () => {
    const b = berekenBox3(sit([item('spaargeld', 110000)], { fiscaalPartner: true }), PARAMS_2026);
    expect(b.belasting).toBe(0);
  });

  it('schulden onder drempel tellen niet', () => {
    const zonder = berekenBox3(sit([item('beleggingen', 100000)]), PARAMS_2026).belasting;
    const met = berekenBox3(sit([item('beleggingen', 100000), item('schuld', 3000, 4)]), PARAMS_2026).belasting;
    expect(met).toBeCloseTo(zonder, 6);
  });
});

describe('box 3 werkelijk rendement', () => {
  const wwr = PRESET_SCENARIOS.find((s) => s.id === 'wwr-2028-tk')!.params;
  it('belast direct + waardegroei boven €1.800', () => {
    // 100k beleggingen: 2% + 5% = 7.000; − 1.800 = 5.200 × 36% = 1.872
    expect(berekenBox3(sit([item('beleggingen', 100000, 2, 5)]), wwr).belasting).toBeCloseTo(1872, 2);
  });
  it('vastgoed: waardegroei pas bij verkoop', () => {
    // 200k vastgoed: huur 4% = 8.000 belast, groei 3% uitgesteld; − 1.800 = 6.200 × 36% = 2.232
    expect(berekenBox3(sit([item('vastgoed', 200000, 4, 3)]), wwr).belasting).toBeCloseTo(2232, 2);
  });
  it('verlies geeft geen negatieve belasting', () => {
    expect(berekenBox3(sit([item('beleggingen', 100000, 0, -20)]), wwr).belasting).toBe(0);
  });
});

describe('box 1 eigen woning', () => {
  it('rente boven 37,56% wordt beperkt', () => {
    // 100k inkomen, woning 500k (ewf 1.750), hypotheek 400k à 4% = 16.000 rente
    const s = sit([item('eigen_woning', 500000), item('hypotheek', 400000, 4)], {
      inkomen: { arbeid: 100000, heffingskortingen: 0, box2Inkomen: 0 },
    });
    const zonder = progressief(101750, PARAMS_2026.box1.schijven);
    const b = berekenBox1(s, PARAMS_2026);
    // aftrek levert precies 16.000 × 37,56% op
    expect(zonder - b.belasting).toBeCloseTo(16000 * 0.3756, 2);
  });
  it('woning naar box 3 haalt forfait en aftrek weg', () => {
    const p = PRESET_SCENARIOS.find((s) => s.id === 'woning-box3')!.params;
    const s = sit([item('eigen_woning', 500000), item('hypotheek', 400000, 4)], {
      inkomen: { arbeid: 50000, heffingskortingen: 0, box2Inkomen: 0 },
    });
    expect(berekenBox1(s, p).belasting).toBeCloseTo(progressief(50000, p.box1.schijven), 2);
    expect(bereken(s, p).box3.belasting).toBeGreaterThan(0);
  });
});

describe('box 2', () => {
  it('24,5% tot €68.843, daarboven 31%', () => {
    const s = sit([], { inkomen: { arbeid: 0, heffingskortingen: 0, box2Inkomen: 100000 } });
    expect(berekenBox2(s, PARAMS_2026).belasting).toBeCloseTo(68843 * 0.245 + 31157 * 0.31, 2);
  });
});
