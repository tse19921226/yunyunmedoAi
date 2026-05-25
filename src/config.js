import dotenv from "dotenv";

dotenv.config();

function splitCsv(value) {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function intFromEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  aiBackend: process.env.AI_BACKEND ?? "open-llm-vtuber",
  openLLMVtuberWs:
    process.env.OPEN_LLM_VTUBER_WS ?? "ws://127.0.0.1:12393/client-ws",
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
  vtuberPersonaPrompt: process.env.VTUBER_PERSONA_PROMPT,
  triggerMode: process.env.BOT_TRIGGER_MODE ?? "mention",
  allowedChannelIds: splitCsv(process.env.BOT_ALLOWED_CHANNEL_IDS),
  ignoredUserIds: splitCsv(process.env.BOT_IGNORED_USER_IDS),
  replyTimeoutMs: intFromEnv("BOT_REPLY_TIMEOUT_MS", 90_000),
  maxReplyChars: intFromEnv("BOT_MAX_REPLY_CHARS", 1_800),
  enableTypedStatus: process.env.BOT_ENABLE_TYPED_STATUS !== "false",
};

export function validateConfig() {
  const missing = [];
  if (!config.discordToken) missing.push("DISCORD_TOKEN");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!["mention", "all"].includes(config.triggerMode)) {
    throw new Error("BOT_TRIGGER_MODE must be either mention or all.");
  }

  if (!["open-llm-vtuber", "persona-ai"].includes(config.aiBackend)) {
    throw new Error("AI_BACKEND must be either open-llm-vtuber or persona-ai.");
  }
}

export default config;
