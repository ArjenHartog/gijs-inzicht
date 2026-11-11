import { useRef, useState } from 'react';
import { exporteer, isGeldigeState, leegState, useStore, voorbeeldState } from './model/store';
import { Dashboard } from './components/Dashboard';
import { Invoer } from './components/Invoer';
import { Veranderingen } from './components/Veranderingen';
import { Scenarios } from './components/Scenarios';
import { Toekomst } from './components/Toekomst';
import { Knop } from './components/ui';

const TABS = ['Overzicht', 'Invoer', 'Veranderingen', "Scenario's", 'Toekomst'] as const;
type Tab = (typeof TABS)[number];

export default function App() {
  const [state, dispatch] = useStore();
  const [tab, setTab] = useState<Tab>('Overzicht');
  const [melding, setMelding] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const importeer = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!isGeldigeState(data)) throw new Error();
      dispatch({ type: 'vervang', state: { ...leegState(), ...data } });
      setMelding('Gegevens geïmporteerd.');
    } catch {
      setMelding('Dit bestand kon niet worden gelezen.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Vermogensinzicht</h1>
            <p className="text-xs text-slate-500">Box 1, 2 en 3 · veranderingen · fiscale scenario's</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Knop onClick={() => exporteer(state)}>Exporteer</Knop>
            <Knop onClick={() => fileRef.current?.click()}>Importeer</Knop>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importeer(f);
                e.target.value = '';
              }}
            />
            {state.huidig.items.length === 0 ? (
              <Knop variant="primair" onClick={() => dispatch({ type: 'vervang', state: voorbeeldState() })}>
                Laad voorbeeld
              </Knop>
            ) : (
              <Knop
                variant="gevaar"
                onClick={() => {
                  if (window.confirm('Alle gegevens in deze browser wissen? Exporteer eerst als je ze wilt bewaren.')) dispatch({ type: 'vervang', state: leegState() });
                }}
              >
                Alles wissen
              </Knop>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="Onderdelen">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {melding && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {melding}
            <button onClick={() => setMelding('')} aria-label="Sluit melding">
              ×
            </button>
          </div>
        )}
        {tab === 'Overzicht' && <Dashboard state={state} naarInvoer={() => setTab('Invoer')} />}
        {tab === 'Invoer' && <Invoer state={state} dispatch={dispatch} />}
        {tab === 'Veranderingen' && <Veranderingen state={state} dispatch={dispatch} />}
        {tab === "Scenario's" && <Scenarios state={state} dispatch={dispatch} />}
        {tab === 'Toekomst' && <Toekomst state={state} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
        Je gegevens blijven in deze browser en worden nergens naartoe gestuurd. Gebruik Exporteer om een back-up te maken. Dit is een
        rekenhulp, geen belastingaangifte of fiscaal advies. Bedragen zijn schattingen op basis van de regels per 11-11-2026; heffingskortingen,
        Wet Hillen, toeslagen en verliesverrekening zijn vereenvoudigd of niet meegenomen.
      </footer>
    </div>
  );
}
