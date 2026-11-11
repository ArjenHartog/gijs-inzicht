# Vermogensinzicht

Webapp die je vermogen in box 1, 2 en 3 toont, veranderingen tussen momentopnames laat zien en fiscale scenario's
(nu en toekomst) doorrekent. Alles draait in de browser; gegevens blijven in localStorage en gaan nergens heen.

## Lokaal ontwikkelen

```bash
npm install
npm run dev     # http://localhost:5173/gijs-inzicht/
npm test        # rekenkern + smoke-tests
npm run build
```

## Structuur

- `src/tax/` – rekenkern (pure functies) en **alle** fiscale parameters met bronnen (`parameters.ts`)
- `src/model/` – types, opslag (reducer + localStorage), vergelijking van momentopnames
- `src/components/` – schermen: Overzicht, Invoer, Veranderingen, Scenario's, Toekomst

Regel: componenten roepen alleen `src/tax` en `src/model` aan; de rekenkern kent geen React.

## Deploy

Elke push naar `main` draait tests + build en publiceert naar GitHub Pages (`.github/workflows/deploy.yml`).

Geen fiscaal advies; bedragen zijn schattingen.
