export function registerDefaultMiddlewares(pipeline, config) {
  pipeline.use("discord:beforeMessageProcessing", "ignore-bots", async (ctx, next) => {
    if (ctx.message.author.bot) {
      ctx.isHalted = true;
      ctx.haltReason = "bot author";
      return;
    }
    await next();
  });

  pipeline.use("discord:beforeMessageProcessing", "channel-filter", async (ctx, next) => {
    if (
      config.allowedChannelIds.size > 0 &&
      !config.allowedChannelIds.has(ctx.message.channelId)
    ) {
      ctx.isHalted = true;
      ctx.haltReason = "channel not allowed";
      return;
    }
    await next();
  });

  pipeline.use("discord:beforeMessageProcessing", "user-filter", async (ctx, next) => {
    if (config.ignoredUserIds.has(ctx.message.author.id)) {
      ctx.isHalted = true;
      ctx.haltReason = "user ignored";
      return;
    }
    await next();
  });

  pipeline.use("discord:beforeMessageProcessing", "trigger-filter", async (ctx, next) => {
    const mentioned = ctx.message.mentions.has(ctx.client.user);
    if (config.triggerMode === "mention" && !mentioned) {
      ctx.isHalted = true;
      ctx.haltReason = "not mentioned";
      return;
    }

    ctx.prompt = ctx.message.content.replace(/<@!?\d+>/g, "").trim();
    if (!ctx.prompt) {
      ctx.isHalted = true;
      ctx.haltReason = "empty prompt";
      await ctx.message.reply("請直接在標註我後面加上要說的內容。");
      return;
    }

    await next();
  });
}
