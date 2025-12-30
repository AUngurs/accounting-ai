# Accounting AI

## Projekta pārskats

Accounting AI ir pilna steka (full-stack) tīmekļa lietotne, kas izstrādāta, lai vienkāršotu grāmatvedības uzskaiti. Tā ļauj lietotājiem pārvaldīt vairāku uzņēmumu finanses vienā, vienotā saskarnē.

Lietotnes galvenā funkcionalitāte ir ar mākslīgo intelektu darbināta dokumentu apstrāde. Lietotāji var augšupielādēt finanšu dokumentus (piemēram, rēķinus PDF formātā), un sistēma automātiski izmantos MI (OpenAI un Google Cloud Vision), lai iegūtu svarīgāko informāciju, piemēram, partnera nosaukumu, dokumenta numuru, datumu un summu. Tas ievērojami samazina manuālo datu ievadi un palīdz uzturēt precīzu uzskaiti.

## Tehnoloģiju kopums

- **Servera puse (Backend)**: Node.js, Express.js, PostgreSQL, JWT, OpenAI API, Google Cloud Vision API
- **Klienta puse (Frontend)**: React, React Router, Axios, Bootstrap

## Projekta iestatīšana

### Priekšnosacījumi

- Node.js (ieteicams v18 vai jaunāka versija)
- PostgreSQL serveris
- `pdftoppm` komandrindas rīks (daļa no `poppler-utils`). Tas ir nepieciešams OCR funkcionalitātei.

### Servera puses iestatīšana

1.  **Dodieties uz `backend` mapi:**

    ```bash
    cd backend
    ```

2.  **Instalējiet atkarības (dependencies):**

    ```bash
    npm install
    ```

3.  **Iestatiet datubāzi:**

    - Pārliecinieties, ka jūsu PostgreSQL serveris ir aktīvs.
    - Izveidojiet jaunu datubāzi projektam (piemēram, `accounting_ai`).
    - Pieslēdzieties jaunajai datubāzei, izmantojot rīku kā `psql` vai pgAdmin, un izpildiet SQL skriptu, kas atrodas `sql/001_create_tables.sql`, lai izveidotu nepieciešamās tabulas.

4.  **Izveidojiet vides mainīgo failu:**

    - `backend` mapē izveidojiet failu ar nosaukumu `.env`.
    - Pievienojiet šādus mainīgos, aizstājot vērtības ar savu konfigurāciju:

    ```env
    # PostgreSQL Datubāzes savienojums
    DB_HOST=localhost
    DB_USER=jusu_postgres_lietotajs
    DB_PASSWORD=jusu_postgres_parole
    DB_NAME=accounting_ai
    DB_PORT=5432

    # JWT noslēpums autentifikācijai
    JWT_SECRET=jusu_ipasi_sarezgita_un_gara_jwt_atslega

    # OpenAI API atslēga
    OPENAI_API_KEY=jusu_openai_api_atslega

    # Google Cloud piekļuves dati priekš OCR
    # Lejupielādējiet savu "service account" JSON atslēgu no Google Cloud Console
    # un norādiet ceļu uz šo failu.
    GOOGLE_APPLICATION_CREDENTIALS=cels/uz/jusu/gcloud-service-account.json
    ```

5.  **Palaidiet serveri:**

- Izstrādes (development) režīmā ar automātisku pārstartēšanos:

  ```bash
  npm run dev
  ```

- Produkcijas (production) režīmā:
  ```bash
  npm start
  ```
  Serveris darbosies adresē `http://localhost:5001`.

### Klienta puses iestatīšana

1.  **Dodieties uz `frontend` mapi:**

    ```bash
    cd ../frontend
    ```

2.  **Instalējiet atkarības:**

    ```bash
    npm install
    ```

3.  **Palaidiet izstrādes serveri:**
    ```bash
    npm start
    ```
    React lietotne automātiski atvērsies jūsu tīmekļa pārlūkprogrammā adresē `http://localhost:3000`.
