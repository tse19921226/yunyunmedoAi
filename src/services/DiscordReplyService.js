export function splitDiscordMessage(text, maxLength) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt < maxLength * 0.5) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitAt < maxLength * 0.5) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function replyInChunks(message, text, maxLength) {
  const normalized = text?.trim() || "The AI did not return any text.";
  const chunks = splitDiscordMessage(normalized, maxLength);

  let first = true;
  for (const chunk of chunks) {
    if (first) {
      await message.reply(chunk);
      first = false;
    } else {
      await message.channel.send(chunk);
    }
  }
}
