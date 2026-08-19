# Password Sharing Tool voor Avionics International B.V.

Assessment-opdracht voor CBYTE. Avionics International B.V. (fictieve klant) wil
gevoelige informatie kunnen delen zonder tussenkomst van een derde partij. Deze tool lost dat op
met eenmalige links: gebruiker A vult een wachtwoord in en krijgt een link, gebruiker B opent die
link één keer om het wachtwoord te zien, waarna het direct en onomkeerbaar uit de database wordt
verwijderd. Het wachtwoord staat nooit onversleuteld in de database, ook niet tussen het aanmaken
en het openen in.

## User stories

**Verplicht (geïmplementeerd)**

1. Als gebruiker wil ik met mijn wachtwoord een link kunnen aanmaken zodat ik deze kan delen.
2. Als gebruiker wil ik een wachtwoord kunnen bekijken na het openen van een link zodat ik deze
   kan opslaan.
3. Als gebruiker wil ik dat mijn wachtwoord wordt verwijderd na het openen van een link zodat de
   tool AVG-compliant is.

**Optioneel**

4. Maximale geldigheidsduur van een link instellen: **geïmplementeerd** (`expiresInMinutes`).
5. Maximaal aantal uses van een link instellen: **niet geïmplementeerd**, bewust buiten scope
   gehouden binnen de tijdsbox (zie "Bewust niet gedaan" hieronder).

## Bewuste keuzes t.o.v. de opdracht

De opdracht liet expliciet ruimte om af te wijken van de voorgestelde stack en aanpak. Vier
keuzes die ik bewust anders heb gemaakt:

- **NestJS in plaats van Laravel.** Zelfde architecturale ideeën, modules, dependency injection,
  decorators, guards, ingebouwde validatie, maar in TypeScript. Daardoor deel ik types en tooling
  tussen backend en frontend, en kan ik binnen de tijdsbox sneller schakelen.
- **Vuetify in plaats van Tailwind of een eigen component library.** Bespaart stylingtijd binnen
  de 4 uur. Trade-off: de basislook is dan wel eerst generiek Material Design.
- **Meer aandacht voor de UI dan strikt gevraagd.** De opdracht geeft aan dat vormgeving hier niet
  zwaar hoeft te wegen, maar ik wilde geen standaard Material-look laten staan. Vuetify's
  `defaults`-systeem (component-props als `rounded`, `elevation`, `variant`, geen CSS
  `!important`) gebruik ik om een eigen "terminal / security tool"-esthetiek te bouwen die bij het
  onderwerp past.
- **Docker Compose en CI/CD zijn niet gevraagd, wel toegevoegd.** Eén `docker compose up` start de
  hele stack. GitHub Actions draait lint, unit- en e2e-tests en publiceert backend- en
  frontend-images naar GHCR. `docker-entrypoint.sh` zet het databaseschema automatisch bij het
  opstarten van de container, nodig voor een deploy zonder shell-toegang tot de container.

## Stack en waarom

| Onderdeel | Keuze                                                | Rationale                                                                                                                                                                                                |
| --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend   | NestJS (TypeScript)                                  | Node-equivalent van het oorspronkelijk gevraagde Laravel, met vergelijkbare architecturale keuzes (modules, DI, decorators, guards, ingebouwde validatie) om te maken en toe te lichten.                 |
| ORM/DB    | Drizzle ORM + PostgreSQL                             | SQL-first, lichtgewicht, type-safe zonder codegen-stap. Delete-on-read is één atomisch `DELETE ... RETURNING`-statement, Postgres garandeert dit atomisch, dus geen expliciete transactie-wrapper nodig. |
| Frontend  | Vue 3 (Composition API) + Vuetify, via Vite          | Kant-en-klare Material Design componenten; bespaart tijd op UI-styling binnen de 4-uur-scope. Bewuste trade-off: vormgeving was niet de kern van de opdracht.                                            |
| Testing   | Jest + Supertest                                     | Unit tests voor encryptie/expiry-logica (`SecretsService`, `EncryptionService`), e2e-tests voor de volledige HTTP-flow tegen een echte Postgres-instantie.                                               |
| Infra     | Docker Compose (Postgres + backend + frontend/nginx) | Eén commando (`docker compose up`) start de volledige stack, reproduceerbaar los van de lokale Node-versie.                                                                                              |

## Snel starten

### Optie A — volledige stack via Docker (aanbevolen)

```bash
cp backend/.env.example backend/.env
# Vul SECRET_ENCRYPTION_KEY in backend/.env in:
openssl rand -base64 32
# (plak de output achter SECRET_ENCRYPTION_KEY=)

docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Postgres: localhost:5432 (user/pass/db: `cbyte`/`Cbyteiscool`/`password_sharing`)

Het schema wordt automatisch in de database gezet: `docker-entrypoint.sh` wacht tot Postgres
bereikbaar is en draait dan `drizzle-kit push` vóór de applicatie start, dus geen losse
handmatige stap nodig, ook niet bij een verse database op een omgeving zonder shell-toegang
tot de container.

### Optie B — lokale development

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env   # vul SECRET_ENCRYPTION_KEY in, zie hierboven
npm install
npm run db:push        # schema naar Postgres pushen
npm run start:dev       # http://localhost:3000

# 3. Frontend (nieuwe terminal)
cd frontend
cp .env.example .env    # standaard VITE_API_BASE=http://localhost:3000 is prima
npm install
npm run dev              # http://localhost:5173
```

## Tests draaien

```bash
cd backend
npm test        # unit tests: EncryptionService, SecretsService
npm run test:e2e # e2e: volledige flow tegen een echte Postgres (vereist `docker compose up -d postgres`)
```

13 tests totaal (9 unit + 4 e2e), o.a.:

- encryptie/decryptie rondtrip, verschillende iv/ciphertext per aanroep, falen bij tampering
- create → view → 404 bij elke volgende poging (delete-on-read)
- 404 voor niet-bestaande links, 400 bij lege wachtwoord-validatie
- 404 voor een link waarvan de `expiresAt` al in het verleden ligt

## Datamodel

```
secrets
├─ id            uuid (pk, default random)   -- onvoorspelbaar, geen oplopende integers
├─ ciphertext    text                         -- AES-256-GCM
├─ iv            text                         -- init vector
├─ auth_tag      text                         -- GCM auth tag
├─ created_at    timestamp
├─ expires_at    timestamp null               -- optioneel, story 4
```

## Beveiligingsontwerp (samenvatting)

Kernpunten:

- **Encryptie, geen hashing.** AES-256-GCM, want het wachtwoord moet weer leesbaar zijn voor de
  ontvanger.
- **Sleutelbeheer: server-side sleutel** (env secret `SECRET_ENCRYPTION_KEY`), bewust gekozen
  boven zero-knowledge (sleutel-in-URL-fragment) vanwege de tijdsbox. Trade-off: de server ziet
  altijd plaintext tijdens verwerking; alleen de database bevat nooit plaintext.
- **Delete-on-read is atomisch** via één `DELETE ... RETURNING`-statement, dit voorkomt race
  conditions bij gelijktijdige requests op dezelfde link.
- **Onvoorspelbare link-ID's** (Postgres `uuid` v4).
- **Rate limiting** op het view-endpoint (`@Throttle`, 10 requests/min) tegen brute-forcen.
- **Nette foutafhandeling**: verlopen/niet-bestaande/al-gebruikte links geven allemaal dezelfde
  generieke 404, zonder interne details te lekken.
- **Geen plaintext-logging** van geheimen.
- **TLS is een deploy-vereiste, geen applicatietaak.** Lokaal/Docker draait dit over plain HTTP;
  voor een publieke deployment moet er een TLS-terminatie voor (reverse proxy/Let's Encrypt).

## Bewust niet gedaan (binnen de 4 uur tijdsbox)

- **Zero-knowledge encryptie** (sleutel clientside, nooit naar server). Sterker, maar kost meer
  implementatie- en testtijd dan binnen de tijdsbox paste.
- **Story 5 (max aantal uses).** Met alleen delete-on-read is "1 use" al gegarandeerd; een
  configureerbaar `max_uses` boven 1 zou extra schema- en race-condition-logica vergen.
- **TLS-terminatie in de Compose-stack zelf.** Bewust als deploy-verantwoordelijkheid
  gedocumenteerd in plaats van bv. een selfsigned-cert in nginx toe te voegen, om de scope behapbaar
  te houden.
- **Geautomatiseerde cleanup van verlopen-maar-nooit-bekeken secrets.** Die blijven nu (versleuteld)
  in de database staan tot ze alsnog geopend worden (en dan als 404 verwijderd) of handmatig
  opgeruimd. Een cron/scheduled job zou dit periodiek kunnen opruimen.

## Werkwijze

Deze opdracht is met ondersteuning van Claude Code gebouwd, voor code, infra-configuratie
en een deel van deze documentatie. De keuzes zelf, van de NestJS/Drizzle-stack tot de
security-trade-offs, heb ik bepaald en beoordeeld. Voor een assessment als dit vind ik dat
gewoon eerlijker om te benoemen dan te doen alsof het anders is gegaan.

## Definition of done

- [x] Bruikbaar via UI op desktop
- [x] Geen foutmeldingen bij normaal gebruik
- [x] Voldoende gedocumenteerde `README.md`
- [x] Kernfunctionaliteit getest (13 tests, unit + e2e)
- [x] Laatste commit getagd met `v1.0.0`
