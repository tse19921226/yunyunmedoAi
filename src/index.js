import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import config, { validateConfig } from "./config.js";
import MiddlewarePipeline from "./middleware/MiddlewarePipeline.js";
import { registerDefaultMiddlewares } from "./middleware/defaultMiddlewares.js";
import OpenLLMVTuberClient from "./services/OpenLLMVTuberClient.js";
import PersonaAiClient from "./services/PersonaAiClient.js";
import { replyInChunks } from "./services/DiscordReplyService.js";

validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const pipeline = new MiddlewarePipeline();
registerDefaultMiddlewares(pipeline, config);

const aiClient =
  config.aiBackend === "persona-ai"
    ? new PersonaAiClient({
        apiKey: config.openAiApiKey,
        model: config.openAiModel,
        timeoutMs: config.replyTimeoutMs,
        personaPrompt: config.vtuberPersonaPrompt,
      })
    : new OpenLLMVTuberClient({
        wsUrl: config.openLLMVtuberWs,
        timeoutMs: config.replyTimeoutMs,
      });

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Discord bridge logged in as ${readyClient.user.tag}`);
  console.log(`AI backend: ${config.aiBackend}`);
  if (config.aiBackend === "open-llm-vtuber") {
    console.log(`Open-LLM-VTuber WebSocket: ${config.openLLMVtuberWs}`);
  } else {
    console.log(
      `Persona AI model: ${config.openAiApiKey ? config.openAiModel : "local fallback"}`,
    );
  }
});

client.on(Events.MessageCreate, async (message) => {
  const context = await pipeline.execute("discord:beforeMessageProcessing", {
    client,
    message,
  });

  if (context.isHalted) return;

  try {
    if (config.enableTypedStatus) {
      await message.channel.sendTyping();
    }

    const answer = await aiClient.ask(
      `[Discord user: ${message.author.username}]\n${context.prompt}`,
    );
    await replyInChunks(message, answer, config.maxReplyChars);
  } catch (error) {
    console.error("Message handling failed:", error);
    await message.reply(`Sorry, something went wrong: ${error.message}`);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

await client.login(config.discordToken);
