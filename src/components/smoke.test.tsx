import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { voorbeeldState } from '../model/store';
import { Dashboard } from './Dashboard';
import { Invoer } from './Invoer';
import { Huishouden } from './Huishouden';
import { Veranderingen } from './Veranderingen';
import { Scenarios } from './Scenarios';
import { Toekomst } from './Toekomst';

const state = voorbeeldState();
const noop = () => {};

describe('schermen renderen met voorbeelddata', () => {
  it('Overzicht', () => expect(renderToString(<Dashboard state={state} naar={noop} />)).toContain('Netto vermogen'));
  it('Invoer', () => expect(renderToString(<Invoer state={state} dispatch={noop} />)).toContain('ETF-portefeuille'));
  it('Huishouden', () => expect(renderToString(<Huishouden state={state} dispatch={noop} />)).toContain('Holding BV'));
  it('Veranderingen', () => expect(renderToString(<Veranderingen state={state} dispatch={noop} />)).toContain('Wat is er veranderd?'));
  it("Scenario's", () => expect(renderToString(<Scenarios state={state} dispatch={noop} />)).toContain('Werkelijk rendement 2028'));
  it('Toekomst', () => expect(renderToString(<Toekomst state={state} />)).toContain('Vermogen'));
});
