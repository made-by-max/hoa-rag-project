import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

async function answerQuestion(question) {
  const chunks = await queryPinecone(question);

  const context = chunks
    .map((chunk) => `[Source: ${chunk.source}]\n${chunk.text}`)
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

  return {
    answer: message.content[0].text,
    sources: chunks,
  };
}

app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const result = await answerQuestion(question);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
