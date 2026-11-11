# Vermogensinzicht

Zie README.md voor structuur en commando's.

## Werkafspraken

- **Leg elk besluit vast** in `docs/BESLUITEN.md` (nieuwste bovenaan: datum, besluit, wie, waarom), in dezelfde commit als de wijziging. Ook keuzes die alleen in het gesprek gemaakt zijn, en aannames die Claude zelf doet (markeer die als *Claude* of *Aanname*).
- Werk ook de sectie "Besluitenlog" in het plandocument bij: https://claude.ai/artifact/GEwBEQ19w1g9pNj3UGU6rX
- De gebruiker heeft geen fiscale kennis: Claude is verantwoordelijk voor fiscale correctheid. Elk nieuw of gewijzigd fiscaal cijfer krijgt een bron in `src/tax/parameters.ts` en een test met handberekening.
- Fiscale parameters alleen in `src/tax/parameters.ts`, nooit in componenten.
- Gebruikersgegevens nooit in de repo (repo is openbaar).
- `npm test` en `npm run build` moeten slagen vóór push; push naar `main` deployt live.
- Taal van de app en documentatie: Nederlands.
