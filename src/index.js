import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import config, { validateConfig } from "./config.js";
import MiddlewarePipeline from "./middleware/MiddlewarePipeline.js";
import { registerDefaultMiddlewares } from "./middleware/defaultMiddlewares.js";
import OpenLLMVTuberClient from "./services/OpenLLMVTuberClient.js";
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

const vtuber = new OpenLLMVTuberClient({
  wsUrl: config.openLLMVtuberWs,
  timeoutMs: config.replyTimeoutMs,
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Discord bridge logged in as ${readyClient.user.tag}`);
  console.log(`Open-LLM-VTuber WebSocket: ${config.openLLMVtuberWs}`);
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

    const answer = await vtuber.ask(
      `[Discord user: ${message.author.username}]\n${context.prompt}`,
    );
    await replyInChunks(message, answer, config.maxReplyChars);
  } catch (error) {
    console.error("Message handling failed:", error);
    await message.reply(`處理失敗：${error.message}`);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

await client.login(config.discordToken);
