import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { DeepChat } from "deep-chat-react";

const claude = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("new-hoa-rag");

async function queryPinecone(question) {
  // Step 1: Embed the question
  const questionEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const embedding = questionEmbedding.data[0].embedding;

  // Step 2: Search Pinecone for similar chunks
  const results = await index.query({
    vector: embedding,
    topK: 3,
    includeMetadata: true,
  });

  // Step 3: Return the results
  return results.matches.map((match) => ({
    id: match.id,
    score: match.score,
    text: match.metadata.text,
    source: match.metadata.source,
  }));
}

// Test it
// const question = "Can I have a cat?";
// const results = await queryPinecone(question);

// console.log(`Question: ${question}\n`);
// results.forEach((result, i) => {
//   console.log(`Result ${i + 1} (score: ${result.score.toFixed(3)})`);
//   console.log(`Source: ${result.source}`);
//   console.log(`Text: ${result.text.slice(0, 100)}...\n`);
// });

export async function generate(prompt) {
  const chunks = await queryPinecone(question);

  const context = chunks
    .map((chunk, i) => `[Source: ${chunk.source}]\n${chunk.text}`)
    .join("\n\n---\n\n");

  const message = await claude.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Based on the following documents, answer this question: "${question}"\n\nDOCUMENTS:\n\n${context}`,
      },
    ],
  });
  return message.content[0].text;
}

// test it
const question = "Can I have a cat?";
const answer = await generate(question);
console.log(`Q: ${question}`);
console.log(`A: ${answer}`);
