# yunyunmedoAi

This repo is an integration layer for:

- Open-LLM-VTuber: Live2D, TTS, ASR, LLM, character runtime
- Luna: Discord mention-based AI chat bot pattern
- ECILA v4: middleware/plugin pipeline pattern

The current implementation is intentionally a bridge, not a hard source-code merge. Open-LLM-VTuber remains the VTuber runtime, while this Node.js bot forwards Discord messages to its `/client-ws` WebSocket endpoint.

It can also run a lightweight persona AI backend for early Discord testing before the full VTuber runtime is available.

## Architecture

```text
Discord message
  -> Luna-style trigger handling
  -> ECILA-style middleware pipeline
  -> AI backend
     -> Open-LLM-VTuber /client-ws text-input
     -> or persona-ai via OpenAI Responses API
  -> collect audio.display_text.text
  -> Discord reply
```

## Setup

1. Start Open-LLM-VTuber first.
2. Copy `.env.example` to `.env`.
3. Fill `DISCORD_TOKEN`.
4. Install dependencies:

```powershell
npm install
```

5. Start the bridge:

```powershell
npm start
```

On Windows you can also run:

```powershell
.\start_discord_bridge.bat
```

## AI Backends

Default mode uses Open-LLM-VTuber:

```env
AI_BACKEND=open-llm-vtuber
OPEN_LLM_VTUBER_WS=ws://127.0.0.1:12393/client-ws
```

For a small VTuber-style persona AI, use:

```env
AI_BACKEND=persona-ai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4-mini
VTUBER_PERSONA_PROMPT=You are Yunyunmedo, a friendly VTuber-style AI assistant in a Discord server. Answer in Traditional Chinese by default. Keep replies warm, playful, concise, and conversational.
```

If `AI_BACKEND=persona-ai` is selected but `OPENAI_API_KEY` is empty, the bot uses a local fallback response so Discord trigger/reply flow can still be tested without model calls.

## Discord Behavior

Default mode is `BOT_TRIGGER_MODE=mention`, so the bot replies only when mentioned.

Supported trigger modes:

- `mention`: reply when the bot is mentioned
- `all`: reply to every allowed non-bot message

Optional filters:

- `BOT_ALLOWED_CHANNEL_IDS`: comma-separated channel IDs. Empty means all channels.
- `BOT_IGNORED_USER_IDS`: comma-separated user IDs.

## Open-LLM-VTuber Notes

The bridge sends:

```json
{"type":"text-input","text":"..."}
```

It collects response text from:

```json
{"type":"audio","display_text":{"text":"..."}}
```

When Open-LLM-VTuber reports synthesis completion, the bridge sends `frontend-playback-complete` back so the backend can close the turn.

## Reference Projects

- Open-LLM-VTuber: `E:\Codex\Projects\_references\Open-LLM-VTuber`
- Luna: `E:\Codex\Projects\_references\Luna`
- ECILA v4: `E:\Codex\Projects\_references\ecila-v4`
