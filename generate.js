import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();

export async function generate(prompt) {
  const chunks = await queryPinecone(question);

  const context = chunks
    .map((chunk, i) => `[Source: ${chunk.source}]\n${chunk.text}`)
    .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0].text;
}

// test it
const answer = await generate("What do the bylaws say about having pets?");
console.log(answer);
