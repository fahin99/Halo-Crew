# Local backend

Run `npm run dev -- --host 127.0.0.1`, or build then `npm run preview -- --host 127.0.0.1`.
The Vite server hosts both UI and `/api` routes. Static hosting alone cannot run this backend.

Mission state, conversations and the inbox are stored atomically in ignored `.halo-data/*.json` files. This is a single-astronaut local showcase service, not an authenticated multi-user cloud deployment. Keep it on localhost. Browser storage provides an offline fallback. Switching offline mode off saves queued browser state to the server. Inbox records are marked delivered only after server acknowledgment.

The backend tries a locally running Ollama model at `127.0.0.1:11434`, default `llama3.2:3b`. Install Ollama from https://ollama.com/download and run `ollama pull llama3.2:3b`. Open Ollama while recording the video. Override the model with `HALO_LOCAL_MODEL` when starting the server if required. No cloud key is used. Without a working model, replies use the existing deterministic companion logic; the UI identifies this explicitly.

Family personas are preconfigured. Voice output remains browser speech, not a cloned family voice. Admin setup and voice cloning are future separate work. Audio files remain session-only and should be downloaded when needed.

Routes: GET /api/status, GET/PUT /api/mission, GET/POST /api/chat, POST /api/sync.

Suggested video: save a check-in, ask HALO about it, switch family personas and send a message, revisit the conversation, save action records to the mission inbox, reload to show persistence. Do not imply clinical validation or a connected Earth medical team.
