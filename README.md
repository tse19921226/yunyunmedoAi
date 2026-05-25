# yunyunmedoAi

This repo is an integration layer for:

- Open-LLM-VTuber: Live2D, TTS, ASR, LLM, character runtime
- Luna: Discord mention-based AI chat bot pattern
- ECILA v4: middleware/plugin pipeline pattern

The current implementation is intentionally a bridge, not a hard source-code merge. Open-LLM-VTuber remains the VTuber runtime, while this Node.js bot forwards Discord messages to its `/client-ws` WebSocket endpoint.

## Architecture

```text
Discord message
  -> Luna-style trigger handling
  -> ECILA-style middleware pipeline
  -> Open-LLM-VTuber /client-ws text-input
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
