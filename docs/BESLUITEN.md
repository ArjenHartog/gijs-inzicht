# Besluitenlog

Alle keuzes die we bespreken, met wie besliste en waarom. Nieuwste bovenaan. Elke wijziging die een keuze inhoudt, krijgt hier een regel in dezelfde commit.

**Wie:** *Arjen* = gebruiker besliste · *Claude* = Claude besliste (gebruiker kan herzien) · *Aanname* = nog te bevestigen.

| # | Datum | Besluit | Wie | Waarom / gevolg |
|---|---|---|---|---|
| 30 | 2026-11-11 | Alle pakketten bijgewerkt naar de nieuwste versie die minstens twee weken oud is: React 19.3.1, Vite 8.3.5, @vitejs/plugin-react 6.1.2, Recharts 3.10.1, TypeScript 7.0.2, Vitest 5.0.5, Tailwind 4.3.3 | Arjen (verzoek), Claude (versiekeuze) | Twee-wekenregel tegen supply-chain-risico; Vite 8.3.8, plugin-react 6.3.0, Vitest 5.1.0 en Tailwind 4.3.5 waren nog te vers. Recharts 3 vereiste een kleine aanpassing in de tooltip-formatter |
| 29 | 2026-11-11 | Buiten scope gehouden: AOW-leeftijd en ouderenkorting, schenk- en erfbelasting, toeslagen en kindgebonden budget, fiscale eenheid tussen BV's, gedeeld gezag met een ex-partner | Claude | Staat in de footer; kandidaten voor de volgende ronde (zie open punten) |
| 28 | 2026-11-11 | Scenariovergelijking rekent met de leeftijd van de kinderen nu; de toekomstprojectie laat kinderen ouder worden (combinatiekorting stopt bij 12, vermogen telt niet meer mee vanaf 18) | Claude | Zo vergelijk je scenario's op dezelfde situatie, en de projectie is realistisch |
| 27 | 2026-11-11 | Nieuwe scenario's: "Bekende wijzigingen 2027" (nu ook zelfstandigenaftrek €900), "Vpb één tarief 25,8%", "Zelfstandigenaftrek afgeschaft"; editor uitgebreid met heffingskortingen, ondernemersaftrek, Vpb en gebruikelijk loon | Claude | Past bij de wens "elk denkbaar scenario" nu er ondernemers en BV's in zitten |
| 26 | 2026-11-11 | Bezittingscategorieën: "aanmerkelijk belang" vervalt (wordt een BV), nieuw zijn "lijfrente/banksparen" (box 1, vrijgesteld) en "studieschuld" (box 3-schuld). Elke bezitting heeft een eigenaar: samen, ik, partner of een kind. Opgeslagen data van versie 1 wordt automatisch omgezet | Claude | Nodig voor partner en kinderen; bestaande invoer gaat niet verloren |
| 25 | 2026-11-11 | Eenmanszaak/zzp/vof: winst in box 1 met zelfstandigenaftrek €1.200 (bij urencriterium), startersaftrek €2.123, mkb-winstvrijstelling 12,7%; arbeidsinkomen = winst na ondernemersaftrek | Claude | Cijfers 2026 geverifieerd (MKB Servicedesk). Definitie arbeidsinkomen is een **aanname** |
| 24 | 2026-11-11 | BV's: per BV apart Vpb (19% tot €200.000, daarna 25,8%, geen fiscale eenheid); gebruiker vult winst, DGA-loon en dividend zelf in; waarschuwing als DGA-loon onder het gebruikelijk loon van €58.000 ligt | Claude | Cijfers 2026 geverifieerd. Dividend en DGA-loon zijn keuzes van de DGA, dus invoer en geen berekening |
| 23 | 2026-11-11 | Kinderen: vermogen van kinderen onder 18 telt volledig mee in box 3 van de ouders; leeftijd op 1 januari = jaar − geboortejaar − 1 | Claude / Aanname | Regel volgens Belastingdienst. **Aanname**: geen gedeeld gezag met een ex-partner (dan zou het de helft zijn) en verjaardag na 1 januari |
| 22 | 2026-11-11 | Combinatiekorting: start €6.240, opbouw 11,45%, max €3.032; alleen voor de minstverdienende werkende ouder met een kind onder 12 | Claude / Aanname | Max en leeftijdsgrens geverifieerd (Rijksoverheid); startpunt is **afgeleid** uit max €3.032 bij €32.720 |
| 21 | 2026-11-11 | Partners: gezamenlijke posten (eigen woning, box 2-inkomen, box 3) worden automatisch zo verdeeld dat jullie samen het minst betalen, in stappen van 10%; bij gelijke uitkomst wint de verdeling die het dichtst bij 50/50 zit | Claude | Dat mag in de aangifte ook; de app toont de gekozen verdeling |
| 20 | 2026-11-11 | Heffingskortingen worden automatisch berekend (algemene heffingskorting met afbouw over het verzamelinkomen, arbeidskorting, combinatiekorting) in plaats van zelf invullen; niet te verzilveren kortingen worden gemeld | Claude | Met partner, kinderen en ondernemers niet meer zelf in te vullen. Cijfers 2026 geverifieerd (Rijksoverheid, Grant Thornton) |
| 19 | 2026-11-11 | Nieuw tabblad Huishouden; "Invoer" heet nu "Bezittingen" | Claude | Inkomen, partner, kinderen, ondernemingen en BV's horen bij elkaar |
| 18 | 2026-11-11 | Uitbreiding: fiscaal partner met eigen inkomen, kinderen, meerdere BV's, eenmanszaken/zzp/vof | Arjen | Wens van Arjen: alle onderdelen van de gezinssituatie |
| 17 | 2026-11-11 | Alles wat we bespreken, inclusief keuzes, wordt vastgelegd in dit log en in het plandocument | Arjen | Spoor van beslissingen; `CLAUDE.md` verplicht bijwerken |
| 16 | 2026-11-11 | CI: actions naar Node 24-versies (checkout v7, setup-node v7, upload-pages-artifact v5, deploy-pages v5), runner vast op `ubuntu-24.04`, Node 24 | Arjen (verzoek), Claude (versies) | Waarschuwingen over Node 20 en Ubuntu 26-migratie weg; geen verrassingen bij runner-wissel |
| 15 | 2026-11-11 | Repo openbaar gemaakt; live op https://arjenhartog.github.io/gijs-inzicht/ | Arjen | GitHub-plan ondersteunt geen Pages op privé-repo. Alternatieven waren GitHub Pro of alleen lokaal. Alleen code is openbaar, nooit bedragen |
| 14 | 2026-11-11 | GitHub-account ArjenHartog (persoonlijk), repo `gijs-inzicht`, eerst privé | Arjen | Niet onder de organisatie-account (werk) geplaatst |
| 13 | 2026-11-11 | Lokaal ontwikkelen in VS Code; `npm run dev` op http://localhost:5173/gijs-inzicht/ | Arjen | — |
| 12 | 2026-11-11 | Fiscale inhoud wordt bepaald door Claude; alle parameters met bron in `src/tax/parameters.ts` | Arjen | Arjen heeft geen fiscale kennis; daarom bron per cijfer en tests met handberekeningen |
| 11 | 2026-11-11 | Scenario's: "elk denkbaar, nu en in de toekomst" → 10 voorgedefinieerde scenario's + editor waarin elk tarief, forfait, vrijstelling en stelsel aanpasbaar is | Arjen (wens), Claude (uitwerking) | Presets: 2026, box 3 2027, werkelijk rendement 2028 (TK-versie en kabinet), kabinetsscenario 3 en 4, eigen woning naar box 3, hypotheekrenteaftrek 25%, box 2 vlak 33%, box 3 40% |
| 10 | 2026-11-11 | Fiscaal partner is een aan/uit-keuze in Invoer, standaard uit | Claude | Arjen wist het niet; met partner verdubbelen heffingsvrij vermogen, schuldendrempel en (optioneel) box 2-schijf |
| 9 | 2026-11-11 | Heffingsvrij vermogen 2026 = €59.357 (niet €57.684 uit het eerste plan) | Claude | Geverifieerd via SRA (jan 2026); plan gecorrigeerd |
| 8 | 2026-11-11 | Werkelijk-rendementscenario's rekenen met direct % (rente/dividend/huur) + groei % per regel; bij vermogenswinstbelasting is de belaste groei = groei × realisatiefractie | Claude | Standaard realisatiefractie 20% in kabinetsscenario 3 en 4 is een **aanname**, instelbaar |
| 7 | 2026-11-11 | Standaard rendementen per categorie (bijv. beleggingen 2% direct + 5% groei, spaargeld 1,5%) | Aanname | Alleen gebruikt voor werkelijk rendement en projectie; per regel aanpasbaar |
| 6 | 2026-11-11 | Vereenvoudigingen: heffingskortingen handmatig invullen; geen Wet Hillen, toeslagen, verliesverrekening box 3, AOW-tarieven; eigenwoningforfait 0,35% en villataks (€1.330.000, 2,35%) niet geverifieerd | Claude | Snel live; staat in de footer van de app. Kandidaten voor de volgende ronde |
| 5 | 2026-11-11 | Projectie: opbrengsten herbeleggen, box 3-belasting gaat van het vermogen af, inkomen en schulden blijven gelijk, elk scenario geldt vanaf volgend jaar | Claude | Eenvoudig en uitlegbaar; staat in de app bij Toekomst |
| 4 | 2026-11-11 | Hosting op GitHub Pages via GitHub Actions; tests moeten groen zijn vóór deploy | Claude (plan) | Gratis, deploy = `git push` |
| 3 | 2026-11-11 | Opslag in localStorage + export/import als JSON; geen backend, geen analytics | Claude (plan) | Financiële gegevens verlaten de browser niet |
| 2 | 2026-11-11 | Client-only app: React 18 + TypeScript + Vite + Tailwind 4 + Recharts, Vitest | Claude (plan) | Rekenkern (`src/tax`) los van UI; parameters op één plek |
| 1 | 2026-11-11 | Eerst plan maken voor team van 1 designer, 3 engineers, 1 manager; live binnen een uur | Arjen | Plan: https://claude.ai/artifact/GEwBEQ19w1g9pNj3UGU6rX. Uitvoering daarna door Claude in één sessie |

## Open punten

- Fiscale cijfers controleren op belastingdienst.nl (box 1-schijven, eigenwoningforfait, villataks).
- Forfaits sparen/schulden 2026 zijn voorlopig; begin 2027 definitief.
- Stand Wet werkelijk rendement box 3 volgen (Eerste Kamer nog niet gestemd per 11-11-2026).
- Volgende ronde: Wet Hillen, verliesverrekening box 3, AOW-tarieven en ouderenkorting.
- Schenken aan kinderen (vrijstelling 2026: €6.908 per kind per jaar, eenmalig €33.129 voor 18–40 jaar) en erfbelasting als scenario's.
- Kindgebonden budget en andere toeslagen.
- Gedeeld gezag met een ex-partner (helft van het vermogen van het kind).
- Fiscale eenheid tussen holding en werk-BV.
