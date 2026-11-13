<div align="center">

### HALO-CREW
### A calm health and wellbeing workspace for deep-space missions
*Understand today's readings. Keep a mission record. Decide what to do next.*

**NASA Space Apps Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*
</div>

---

> **Prototype disclaimer.** HALO Crew is a hackathon concept and design prototype, not a medical device. It is not clinically validated or qualified for spaceflight, and it must not be used to make medical decisions. Most sensor and mission values are simulated. Manual readings are user-entered demonstration data. Hardware models are concepts and are not working or validated sensors.

## Overview

HALO Crew is a browser-based astronaut health and wellbeing demo. It combines a mission dashboard, manual health logging, sample alerts, a daily routine, wellbeing support, and a mission record in one interface. The app can save mission data to a local server or PostgreSQL-backed server; browser storage provides an offline/local fallback. Optional AI and voice services can be configured for chat and family companion speech.

The app also includes **HaloSuit Studio**, an interactive simulation of proposed wearable and periodic-assessment modules. It illustrates how a future system might organize sensor concepts; it does not connect to or acquire data from physical devices.

The demo uses a fictional Mars mission scenario and synthetic readings to show the user experience. Health ranges and alert tiers are illustrative references, not astronaut-specific clinical limits.

## What you can explore

- **Home and Health Overview:** mission summary, health domains, sample readings, data freshness, status explanations, and alerts.
- **My Wellbeing, Insights, Future Self, and Support:** wellbeing trends, sample insights, illustrative projections, and suggested low-disruption actions.
- **Medical Kit:** measurement guidance and manual logging for supported readings such as blood pressure, blood glucose, and radiation dose.
- **Mission Record:** check-ins and event logs, with an option to transfer records to the configured mission inbox.
- **HaloSuit Studio:** interactive 3D concept modules, including BioGlove, BioGlass, ECG wearable, exercise sensor, bone-scan attachment, and biomarker reader.
- **Family and Crew:** family-style companion conversations and crew connection views.
- **AI Copilot:** conversational access to the configured AI service, when available.
- **Settings:** choose a sample mission scenario, simulate offline communication, and manage or export sample data.

The interface is responsive and includes keyboard focus styles, reduced-motion support, and contextual explanations. Several views and interactions are demonstrations driven by sample data.

## Technology

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 and project CSS design system |
| Charts and 3D | Recharts, Three.js |
| Backend | Vite middleware for development; Node.js HTTP server for standalone hosting |
| Persistence | Local JSON files by default; PostgreSQL when `DATABASE_URL` is configured |
| Optional AI | Local Ollama-compatible endpoint or Hugging Face Gradio Space |
| Hardware artifacts | FreeCAD, STEP, GLB, images, and supporting documentation under `Hardware/` |

## Getting started

### Requirements

- Node.js 22
- npm (or pnpm 10.34.3, as pinned in `.mise.toml`)
- FreeCAD is optional and only needed to inspect editable CAD files.

### Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:8443>. The development server uses port `8443` by default and fails if that port is already occupied. Set `PORT` to use a different port.

### Build and run the standalone server

```bash
npm run build
npm start
```

The standalone server serves the production build and API on port `8443` by default. `npm run preview` serves the built frontend through Vite for local preview; use `npm start` when you need the app's standalone API and persistence.

### Tests and formatting

```bash
npm run test:backend
npm run format
```

## Backend and configuration

The development Vite plugin exposes `/api` endpoints for mission state, chat, speech, status, and mission inbox synchronization. `npm start` runs the standalone Node server. Without a database, records are stored under `.halo-data/`; with `DATABASE_URL`, the server stores JSON records in PostgreSQL.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8443` | Development, preview, or standalone server port |
| `FIGMA_DEV_SERVER_HOST` | `0.0.0.0` | Vite development and preview host |
| `FIGMA_PUBLIC_URL` | unset | Public base path for Vite builds |
| `DATABASE_URL` | unset | PostgreSQL connection string for shared durable records |
| `HALO_MODEL_URL` | `http://127.0.0.1:11434` | Optional Ollama-compatible local model endpoint |
| `HALO_LOCAL_MODEL` | `llama3.2:1b` | Local model name |
| `HF_TOKEN` | unset | Hugging Face token for the optional private Gradio AI Space |
| `HALO_HF_SPACE` | `RJBee4u/halo-crew-ai` | Gradio Space used by the cloud AI adapter |
| `HALO_VOICE_URL` | `http://127.0.0.1:11435` | Optional local family voice service |
| `HALO_TEAM_PASSCODE` | unset | Enables passcode-gated access in hosted mode; use at least 12 characters |
| `HALO_SESSION_SECRET` | generated at startup | Secret used to sign hosted session cookies |

For hosted production mode, set `NODE_ENV=production`, `HALO_TEAM_PASSCODE`, and `DATABASE_URL`. The server refuses hosted startup without a passcode of at least 12 characters and a database URL. Keep credentials in environment configuration and never commit them.

## Data and limitations

- The app is a prototype. Most streams, trends, projections, crew details, and sensor scenarios are illustrative or synthetic.
- Readings entered in the Medical Kit are manually supplied; they are not acquired from a wearable or diagnostic instrument.
- Status tiers are demonstration guidance based on general reference ranges. They are not validated mission limits, diagnoses, or treatment instructions.
- The app's hardware and 3D views are concept representations. No device integration, sensor calibration, signal processing, or clinical validation is provided.
- Optional model replies and generated speech depend on external or locally configured services. Rules-based or unavailable-service fallbacks may apply.
- Local JSON persistence is intended for a local demo. PostgreSQL can share persisted records across a hosted instance, but deployment security and operational controls still need review for any real use.
- Privacy and sharing controls in the interface describe the intended product direction; they do not establish a certified medical data security system.

## Project structure

```text
.
├── src/
│   ├── App.tsx                 # App shell, navigation, and page composition
│   ├── DemoMission.tsx         # Mission, health, medical, wellbeing, and companion views
│   ├── HealthCockpit.tsx       # Health Overview and vital trends
│   ├── HealthLab.tsx           # HaloSuit Studio and roadmap views
│   ├── HaloSuitSimulation.tsx  # Interactive suit simulation
│   ├── mission-state.tsx       # Mission state, readings, persistence, and sync
│   ├── vitals.ts               # Reading freshness, ranges, validation, and routines
│   └── index.css               # Design system and responsive styling
├── server/
│   ├── backend.ts              # API routes and optional AI/voice integration
│   ├── cloud-ai.ts             # Hugging Face Gradio adapter
│   ├── storage.ts              # JSON file or PostgreSQL storage
│   ├── start.ts                # Standalone Node server and hosted access gate
│   └── backend.test.mjs        # Backend test suite
├── Hardware/
│   ├── BioGlove/
│   ├── BioSuit/
│   └── VisionGuard/
└── vite.config.ts              # Vite, React, Tailwind, and Figma Make integration
```

## Hardware concepts

`Hardware/` contains BioGlove, BioSuit, and VisionGuard design artifacts, including editable FreeCAD models, STEP and GLB exports, renders, macros, and documentation. These are concept models rather than operational devices. Refer to each subfolder's README or documentation for component details and model-specific limitations.

## License and acknowledgements

This project was created for the NASA Space Apps Challenge. NASA and the challenge are not endorsing the project. Add the applicable project license here if one is selected.
