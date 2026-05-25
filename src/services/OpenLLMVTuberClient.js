import WebSocket from "ws";

function parseJson(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return null;
  }
}

function extractDisplayText(payload) {
  if (payload?.type !== "audio") return "";
  const displayText = payload.display_text;
  if (typeof displayText === "string") return displayText;
  if (displayText && typeof displayText.text === "string") return displayText.text;
  return "";
}

export default class OpenLLMVTuberClient {
  constructor({ wsUrl, timeoutMs }) {
    this.wsUrl = wsUrl;
    this.timeoutMs = timeoutMs;
    this.socket = null;
    this.connected = false;
    this.pending = null;
  }

  async connect() {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) return;

    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`Timed out connecting to ${this.wsUrl}`));
      }, 15_000);

      socket.on("open", () => {
        clearTimeout(timer);
        this.socket = socket;
        this.connected = true;
        resolve();
      });

      socket.on("message", (raw) => this.handleMessage(raw));
      socket.on("close", () => {
        if (this.pending) {
          this.pending.reject(new Error("Open-LLM-VTuber WebSocket disconnected."));
          this.pending = null;
        }
        this.connected = false;
        this.socket = null;
      });
      socket.on("error", (error) => {
        if (!this.connected) {
          clearTimeout(timer);
          reject(error);
        } else if (this.pending) {
          this.pending.reject(error);
          this.pending = null;
        }
      });
    });
  }

  async ask(text) {
    await this.connect();

    if (this.pending) {
      throw new Error("Open-LLM-VTuber is still processing another Discord request.");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending = null;
        reject(new Error("Timed out waiting for Open-LLM-VTuber response."));
      }, this.timeoutMs);

      this.pending = {
        chunks: [],
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      };

      this.socket.send(JSON.stringify({ type: "text-input", text }));
    });
  }

  handleMessage(raw) {
    const payload = parseJson(raw);
    if (!payload || !this.pending) return;

    const displayText = extractDisplayText(payload);
    if (displayText) {
      this.pending.chunks.push(displayText);
      return;
    }

    if (payload.type === "error") {
      this.pending.reject(new Error(payload.message ?? "Open-LLM-VTuber error"));
      this.pending = null;
      return;
    }

    if (payload.type === "backend-synth-complete") {
      this.socket?.send(JSON.stringify({ type: "frontend-playback-complete" }));
      return;
    }

    if (payload.type === "control" && payload.text === "conversation-chain-end") {
      const answer = this.pending.chunks.join("").trim();
      this.pending.resolve(answer);
      this.pending = null;
    }
  }
}
