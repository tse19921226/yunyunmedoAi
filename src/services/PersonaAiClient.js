const DEFAULT_PERSONA_PROMPT = [
  "You are Yunyunmedo, a friendly VTuber-style AI assistant in a Discord server.",
  "Answer in Traditional Chinese by default.",
  "Keep replies warm, playful, concise, and conversational.",
  "Do not claim to have a physical body, a real camera, or real-time senses.",
  "If you do not know something, say so naturally and offer a helpful next step.",
].join(" ");

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;

  const parts = [];
  for (const item of payload?.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }

  return parts.join("").trim();
}

function localPersonaReply(text) {
  const normalized = text.trim();
  if (!normalized) {
    return "我在喔。你可以再丟一次問題給我嗎？";
  }

  return [
    "我先用本地 persona 模式回答你：",
    `你剛剛說「${normalized}」。`,
    "真正的 LLM 還沒接上 OPENAI_API_KEY，所以我現在只能做簡短陪聊和流程測試。",
  ].join("\n");
}

export default class PersonaAiClient {
  constructor({ apiKey, model, timeoutMs, personaPrompt }) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.personaPrompt = personaPrompt || DEFAULT_PERSONA_PROMPT;
  }

  async ask(text) {
    if (!this.apiKey) {
      return localPersonaReply(text);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            {
              role: "developer",
              content: this.personaPrompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.error?.message ?? response.statusText;
        throw new Error(`OpenAI request failed: ${message}`);
      }

      const answer = extractOutputText(payload);
      return answer || localPersonaReply(text);
    } finally {
      clearTimeout(timeout);
    }
  }
}
