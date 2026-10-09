# Free online AI for HALO Crew

The web app and persistent records stay on Render. Inference runs in the private Hugging Face Space `RJBee4u/halo-crew-ai` using free ZeroGPU. Your Mac does not need to be running.

## Current deployment

Upload the three files in `hosting/huggingface/` to the Space root and select ZeroGPU Free. Do not select a paid hardware plan. The Space uses Qwen2.5-1.5B-Instruct for conversation; it is an open model rather than GPT. GPU usage is subject to the account's free daily quota and queues. When inference fails or quota is exhausted, HALO clearly labels its rule-based fallback.

Render environment:
- `HALO_HF_SPACE=RJBee4u/halo-crew-ai` (also the backend default)
- `HF_TOKEN`: a Hugging Face read token allowed to access only this private Space. Set through Render's secret environment UI; never put the token into source code, Git, screenshots or chat. The user must create and enter this credential personally.

The API token lives exclusively on the Node server. Frontend requests go through the existing team authentication gate. The private Space receives only the conversation and supplied illustrative health context required for a response. It does not save astronaut records.

## Consented family cloning

No real voices exist until recordings are supplied. Upload reference audio into the private Space as `voice-references/family-0.wav`, `family-1.wav`, `family-2.wav` for the configured mother/father/sibling personas. Upload `voice-references/consent.json` with `true` only for each speaker who has granted permission for cloning and cloud processing:

```json
{"family-0":true,"family-1":false,"family-2":false}
```

The adapter uses English Chatterbox speech with its watermark retained. References remain in the private Space. Generated audio returns through the protected Render backend. The app identifies this as AI-generated family voice; it is never a live call. Without a configured voice, browser speech stays available. Clone generation failure retains the text reply.

Chatterbox distribution pins Torch 2.6, while ZeroGPU requires newer Torch. The Space uses explicitly declared Torch 2.8 dependencies and installs Chatterbox code without its old dependency pins only after voice references are present. Actual cloning compatibility and voice quality must be tested once a consented sample is available; no successful real clone is claimed before that test.

## Optional local development

The local backend still supports Ollama (`HALO_MODEL_URL`, `HALO_LOCAL_MODEL`, default `llama3.2:1b`) and the localhost service in `server/voice/service.py`. These are optional and are not required for the online deployment. Local runtimes under `.local-ai` and recordings under `.voice-references` are ignored by Git.

Official limits: https://huggingface.co/docs/hub/spaces-zerogpu
