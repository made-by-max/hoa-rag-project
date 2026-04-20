import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";
import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("new-hoa-rag");
const namespace = pc
  .index(
    "new-hoa-rag",
    "https://new-hoa-rag-o1l13s6.svc.aped-4627-b74a.pinecone.io",
  )
  .namespace("__default__");

// const namespace = pc
//   .index("hoa-rag", "https://hoa-rag-o1l13s6.svc.aped-4627-b74a.pinecone.io")
//   .namespace("__default__");

// const indexName = "hoa-rag";
// const index = await pc.createIndexForModel({
//   name: indexName,
//   cloud: "aws",
//   region: "us-east-1",
//   embed: {
//     model: "llama-text-embed-v2",
//     fieldMap: { text: "chunk_text" },
//   },
//   waitUntilReady: true,
// });
//
//
async function testOpenAI() {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "test",
    });
    console.log("OpenAI working:", response.data[0].embedding.length);
  } catch (err) {
    console.error("OpenAI error:", err.message);
  }
}

//extract PDF
async function extractTextFromPDF(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(fileBuffer);
  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

//Text Splitter function
function splitText(text, chunkSize = 500, overlap = 50) {
  // Estimate: 1 token ≈ 4 characters
  const charSize = chunkSize * 4;
  const charOverlap = overlap * 4;

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    // Take a chunk of the specified size
    let end = start + charSize;

    // Don't cut off mid-word—find the last space before 'end'
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break; // stop at final chunk
    start = Math.max(end - charOverlap, start + 1); // always move forward
  }

  return chunks;
}

//log split text chunks
// async function getChunks() {
//   const docsDir = "src/docs";
//   const pdfFiles = fs
//     .readdirSync(docsDir)
//     .filter((file) => file.endsWith(".pdf"));

//   // console.log(`Found ${pdfFiles.length} PDFs\n`);

//   for (const pdfFile of pdfFiles) {
//     const filePath = path.join(docsDir, pdfFile);
//     // console.log(`Processing: ${pdfFile}`);

//     // Extract text
//     const text = await extractTextFromPDF(filePath);
//     // console.log(`  Extracted ${text.length} characters`);

//     // Split into chunks
//     const chunks = splitText(text, 500, 50);
//     // console.log(`  Created ${chunks.length} chunks`);

//     // Show first chunk
//     // console.log(`  First chunk: ${chunks[0].slice(0, 100)}...\n`);

//     return chunks;
//   }
// }

async function main() {
  const docsDir = "./docs";
  const pdfFiles = fs
    .readdirSync(docsDir)
    .filter((file) => file.endsWith(".pdf"));

  console.log(`Found ${pdfFiles.length} PDFs\n`);

  for (const pdfFile of pdfFiles) {
    const filePath = path.join(docsDir, pdfFile);
    console.log(`Processing: ${pdfFile}`);

    // Extract text
    const text = await extractTextFromPDF(filePath);
    console.log(`  Extracted ${text.length} characters`);

    // Split into chunks
    const chunks = splitText(text, 500, 50);
    console.log(`  Created ${chunks.length} chunks`);

    // Upsert to Pinecone
    await upsertChunksToPinecone(chunks, pdfFile);

    console.log();
  }
}

async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("Embedding error for text:", text.slice(0, 50), err.message);
    return null;
  }
}

async function upsertChunksToPinecone(chunks, sourceFile) {
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await getEmbedding(chunks[i]);

    if (!embedding) {
      console.log(`  Skipped chunk ${i} (embedding failed)`);
      continue;
    }

    console.log(`  ✓ Chunk ${i} embedded (${embedding.length} dims)`);

    vectors.push({
      id: `${sourceFile.replace(".pdf", "")}_chunk_${i}`,
      values: embedding,
      metadata: {
        source: sourceFile,
        chunk_index: i,
        text: chunks[i],
      },
    });

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nTotal vectors ready: ${vectors.length}`);

  if (vectors.length === 0) {
    console.log(`No vectors to upsert for ${sourceFile}`);
    return;
  }

  // console.log(vectors);
  console.log(`Upserting to Pinecone...`);

  await index.upsert({ records: vectors });
  console.log(`Upserted ${vectors.length} chunks from ${sourceFile}`);
}
