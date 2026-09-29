# Nischay AI

**From Citizen Voice to Development Intelligence**

Nischay AI is a multilingual civic-development intelligence prototype built for **Build with AI: Code for Communities — Track 01**. It turns natural-language community needs from web text, web voice and Telegram into structured, comparable civic demand, combines that demand with prototype infrastructure context, and presents evidence to decision-makers.

> **Data disclaimer:** the included request seed data and `district_infrastructure.csv` are synthetic demonstration data. They are **not official government data** and must not be used as a substitute for verified administrative statistics.

## Problem

Millions of citizens describe the same kinds of development needs in different languages, formats and levels of detail. Those voices are difficult to compare at district, state and national scale.

Traditional complaint systems are designed mainly to track individual tickets. Nischay AI focuses instead on the analytical layer: turning unstructured public input into structured civic-demand signals that can be aggregated and compared.

## Solution

Nischay AI accepts civic requests in English, Hindi, Tamil, Bengali, Marathi and Telugu through:

- web text
- browser-recorded voice
- Telegram text
- Telegram voice notes

The backend then detects/normalizes language, transcribes voice, translates to English when required, asks Gemini to extract structured civic fields, validates the model output, stores both the original and translated statement, aggregates demand, and combines it with district-level infrastructure context.

The dashboard surfaces **descriptive demand/infrastructure scores and evidence-linked project options**. These are decision-support signals, not official policy decisions or political recommendations.

## Demo Flow

1. Open the landing page.
2. Select **Share a Community Need**.
3. Submit:
   > हमारे इलाके में पीने का पानी सिर्फ दो दिन आता है और कई घरों में पानी नहीं पहुंचता।
4. Nischay stores the original Hindi statement.
5. Google Translation converts the statement to English when configured.
6. Gemini extracts sector, geography, urgency and a neutral summary.
7. The dashboard updates from the same stored data.
8. Open a district to inspect demand mix, language mix, request trends and infrastructure context.
9. Generate five Gemini project options linked to the observed evidence.
10. Generate a printable/copyable evidence brief.

## Features

- Multilingual web text intake
- Real browser microphone recording with MediaRecorder
- Google Cloud Speech-to-Text integration
- Google Cloud Translation integration
- Gemini structured civic extraction with Zod validation and retry handling
- Unified request pipeline shared by web and Telegram
- SQLite development storage
- BigQuery production analytics adapter
- 288-request synthetic demonstration seed dataset
- Prototype district infrastructure dataset across 8 Indian states
- Population-normalized civic demand scoring
- Google Maps JavaScript API geographic visualization
- State, district, sector and language filters
- Recharts analytics
- District intelligence pages
- Gemini evidence-linked project options
- Printable/copyable evidence brief
- Telegram text and voice integration
- Docker image suitable for Cloud Run
- GitHub Actions build/test workflow
- Privacy-conscious aggregation with no unnecessary citizen identity fields

## Architecture

```text
Citizen
├── Web Text
├── Web Voice
└── Telegram
        ↓
Unified Request Pipeline
        ↓
Speech-to-Text (when audio)
        ↓
Language Detection
        ↓
Translation API
        ↓
Gemini Extraction
        ↓
Zod Schema Validation
        ↓
Data Store
├── BigQuery
└── SQLite Development Fallback
        ↓
Aggregation
        ↓
Demand + Infrastructure Scoring
        ↓
Analytics API
        ↓
Policymaker Dashboard
        ↓
Gemini Project Options
        ↓
Evidence Brief
```

### Backend organization

```text
server/src/
├── controllers/
├── database/
├── middleware/
├── routes/
├── services/
├── utils/
├── app.js
├── config.js
└── index.js
```

## Google Technologies Used

### Gemini API

Gemini performs real structured understanding when `GEMINI_API_KEY` is configured. It converts an unstructured civic statement into validated JSON containing:

- sector
- state
- district
- urgency (1–10)
- summary
- original language

Gemini is also used for evidence-linked project options and evidence briefs. Model output is never trusted directly: JSON is parsed, validated with Zod and retried when invalid.

When Gemini is not configured, the local demo uses a clearly labelled rules-based fallback. The fallback is not presented as Gemini output.

### Google Cloud Speech-to-Text

Voice recorded with the browser MediaRecorder, and Telegram voice notes, are sent to the backend. The backend sends the audio to Google Cloud Speech-to-Text and forwards the resulting transcript into the same request pipeline used for text.

No fake transcription is produced when Speech-to-Text is unavailable.

### Google Cloud Translation

Non-English citizen input is translated to English for consistent downstream analysis while the original statement is preserved permanently.

If Translation is unavailable, Nischay preserves the original statement and marks the processing mode as fallback/untranslated.

### Google BigQuery

When `DATA_STORE=bigquery`, BigQuery becomes the primary analytics request store. The application uses the same DataStore interface whether running against BigQuery or SQLite.

### Google Maps Platform

The dashboard uses the Google Maps JavaScript API as the geographic basemap and plots weighted district demand/score circles using actual dataset coordinates.

Google's legacy Maps JavaScript `HeatmapLayer` was decommissioned in 2026, so this implementation uses supported map overlays rather than depending on the retired native heatmap API.

## Unified Request Object

Stored civic requests use this shape:

```json
{
  "id": "uuid",
  "source": "web-text",
  "originalText": "citizen statement",
  "translatedText": "English translation",
  "originalLanguage": "Hindi",
  "sector": "water",
  "state": "Uttar Pradesh",
  "district": "Sitapur",
  "urgency": 8,
  "summary": "Neutral civic summary",
  "latitude": 27.568,
  "longitude": 80.679,
  "createdAt": "ISO timestamp"
}
```

Supported sources:

- `web-text`
- `web-voice`
- `telegram-text`
- `telegram-voice`

Telegram chat/user IDs are not stored in the analytics request object.

## Demand / Infrastructure Formula

Nischay deliberately does **not** rank districts by raw request count alone.

For every district + sector pair:

```text
weightedDemand = SUM(request urgency)

demandPer100k =
  weightedDemand / population × 100,000

normalizedDemand =
  demandPer100k / maximum demandPer100k
  within the current filtered comparison set

infrastructureNeed =
  1 - (infrastructureIndex / 100)

descriptiveScore =
  100 × (
    0.65 × normalizedDemand
    +
    0.35 × infrastructureNeed
  )
```

The score is a transparent prototype calculation for comparing the supplied demonstration data. It is not an official allocation rule and does not replace feasibility, equity, legal, budget or community review.

## Data Store Interface

Both storage adapters implement the same concepts:

- `saveRequest()`
- `getRequests()`
- `getStats()`
- `getAggregatedDemand()`

Set:

```env
DATA_STORE=local
```

for SQLite, or:

```env
DATA_STORE=bigquery
```

for BigQuery.

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/requests/text` | Submit web text |
| POST | `/api/requests/voice` | Submit recorded audio |
| GET | `/api/requests` | Query civic requests |
| GET | `/api/priorities` | Query descriptive demand/infrastructure scores |
| GET | `/api/stats` | Dashboard counts |
| GET | `/api/districts/:district` | District intelligence |
| POST | `/api/recommendations` | Generate evidence-linked project options |
| POST | `/api/policy-brief` | Generate evidence brief |
| POST | `/api/telegram/webhook` | Telegram webhook |
| GET | `/api/health` | Health/configuration status |

Filters supported on analytics routes include:

- `state`
- `district`
- `sector`
- `language`

## Setup

Requirements:

- Node.js 22+
- npm
- optional Google Cloud project
- optional Gemini API key
- optional Telegram bot

Clone and install:

```bash
git clone https://github.com/avikkaaa/nis.git
cd nis

npm install
npm run install:all
```

Create environment files:

```bash
cp .env.example server/.env
cp .env.example client/.env
```

Seed the local demo database:

```bash
npm run seed --prefix server
```

Start frontend + backend:

```bash
npm run dev
```

Open:

- frontend: `http://localhost:5173`
- API health: `http://localhost:5000/api/health`

## Environment Variables

### Server

- `PORT` — Express port. Cloud Run supplies this automatically.
- `NODE_ENV` — `development` or `production`.
- `DATA_STORE` — `local` or `bigquery`.
- `SQLITE_PATH` — optional local SQLite path.
- `GEMINI_API_KEY` — Gemini API key.
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`.
- `GOOGLE_CLOUD_PROJECT_ID` — Google Cloud project used for Speech, Translation and BigQuery.
- `GOOGLE_APPLICATION_CREDENTIALS` — path to local service-account credentials. Prefer workload identity / attached Cloud Run service identity in production instead of shipping a JSON key.
- `BIGQUERY_DATASET` — defaults to `nischay_ai`.
- `BIGQUERY_TABLE` — defaults to `civic_requests`.
- `BIGQUERY_LOCATION` — defaults to `asia-south1`.
- `TELEGRAM_BOT_TOKEN` — Telegram bot token.
- `TELEGRAM_WEBHOOK_SECRET` — secret checked against Telegram's webhook secret header.

### Client

- `VITE_GOOGLE_MAPS_API_KEY` — browser Maps JavaScript API key. Restrict it by HTTP referrer and API in Google Cloud Console.
- `VITE_API_BASE_URL` — optional separate API origin. Leave blank when frontend and backend share the same origin.

`GOOGLE_MAPS_API_KEY` is included in the example file for deployments that later add server-side Maps APIs. The current browser map uses the Vite-prefixed browser key.

## Local Development

Run both services:

```bash
npm run dev
```

Or separately:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

Run tests:

```bash
npm test --prefix server
npm run build --prefix client
```

## Demo Data

Generate the local demonstration dataset:

```bash
npm run seed --prefix server
```

The generator creates 288 civic requests across:

- Delhi
- Uttar Pradesh
- Maharashtra
- West Bengal
- Tamil Nadu
- Telangana
- Bihar
- Rajasthan

It covers six supported languages and multiple sectors.

The district infrastructure file is:

```text
server/data/district_infrastructure.csv
```

Fields:

```text
district,state,population,infrastructure_index,latitude,longitude
```

**Sample infrastructure dataset created for prototype demonstration. It is not official government data.**

## BigQuery Setup

1. Create or choose a Google Cloud project.
2. Enable BigQuery.
3. Grant the runtime service identity access to create/query the configured dataset and table.
4. Configure:
   ```env
   DATA_STORE=bigquery
   GOOGLE_CLOUD_PROJECT_ID=your-project
   BIGQUERY_DATASET=nischay_ai
   BIGQUERY_TABLE=civic_requests
   ```
5. Start the server. The adapter creates the dataset/table if they do not already exist.

For production, prefer an attached Cloud Run service account with least-privilege IAM instead of storing a service-account key in the container.

## Speech and Translation Setup

Enable:

- Cloud Speech-to-Text API
- Cloud Translation API

Then configure `GOOGLE_CLOUD_PROJECT_ID` and Application Default Credentials / Cloud Run service identity.

## Telegram Setup

1. Create a bot using BotFather.
2. Set:
   ```env
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_WEBHOOK_SECRET=use-a-long-random-secret
   ```
3. Deploy Nischay to a public HTTPS endpoint.
4. Register:
   ```text
   https://YOUR_DOMAIN/api/telegram/webhook
   ```
   as the bot webhook and provide the same secret token.
5. Send a text or voice note to the bot.

Both channels call the same `processCitizenRequest()` pipeline as the web application.

## Docker

Build:

```bash
docker build   --build-arg VITE_GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_BROWSER_KEY   -t nischay-ai .
```

Run:

```bash
docker run --rm -p 8080:8080   --env-file server/.env   -e PORT=8080   nischay-ai
```

## Cloud Run Deployment

Example:

```bash
gcloud builds submit --tag asia-south1-docker.pkg.dev/PROJECT/REPOSITORY/nischay-ai

gcloud run deploy nischay-ai   --image asia-south1-docker.pkg.dev/PROJECT/REPOSITORY/nischay-ai   --region asia-south1   --allow-unauthenticated   --set-env-vars DATA_STORE=bigquery,GOOGLE_CLOUD_PROJECT_ID=PROJECT,BIGQUERY_DATASET=nischay_ai
```

Store `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` in Secret Manager and expose them to Cloud Run as secret-backed environment variables.

Grant the Cloud Run service identity only the Google Cloud roles required for:

- Speech-to-Text
- Translation
- BigQuery dataset/table access

## Privacy

Nischay does not require a citizen account to submit a need.

The analytics object focuses on:

- request text
- language
- approximate administrative location
- time
- source channel
- structured civic fields

It intentionally avoids names, phone numbers and Telegram identity fields.

For a real deployment, add a documented retention policy, abuse controls, rate limiting, consent text for audio, regional privacy review and a deletion process before collecting production data.

## Scaling Across India

The architecture avoids state-specific conditionals.

Supported languages live in configuration-style mappings. Infrastructure rows are data-driven. Analytics filters operate on state and district values rather than hard-coded state logic.

The same deployment model can scale:

```text
District
  ↓
State
  ↓
Multi-State
  ↓
National Platform
```

For national-scale production:

- move all request analytics to BigQuery
- partition/cluster high-volume tables
- add Pub/Sub for asynchronous intake
- run transcription/translation jobs asynchronously for long audio
- add rate limiting and queue-based retries
- connect verified official demographic/infrastructure datasets
- add geographic normalization against authoritative administrative boundaries
- add formal data-governance and access controls

## Digital Public Good Approach

Nischay is designed to be adoptable as an open civic-tech building block. It does **not** claim formal Digital Public Good certification.

The architecture supports a DPG-style approach through:

- open and extensible components
- multilingual access
- interoperable REST APIs
- reusable civic request pipeline
- configurable scoring methodology
- state-independent architecture
- SQLite for low-cost local deployment
- BigQuery for scalable analytics
- privacy-conscious aggregation
- transparent formula documentation
- ability for governments and NGOs to adapt the platform

## Production Notes

Before a real government or NGO deployment:

- replace synthetic infrastructure data with verified sources
- validate geographic normalization
- add authentication/authorization for policymaker views
- add rate limiting and abuse protection
- add audit logging for administrative access
- conduct accessibility testing
- conduct privacy/security review
- define data retention and deletion rules
- evaluate language-model quality across regions and dialects
- keep human review in any public-investment or policy decision process


---

Repository synced to `main` on 29 September 2026 after the full Nischay AI build.
