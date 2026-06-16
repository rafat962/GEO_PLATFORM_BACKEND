const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PineconeStore } = require("@langchain/pinecone");
const { Pinecone } = require("@pinecone-database/pinecone");

const createRegulationsRagTool = () => {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.Index(process.env.INDEX_NAME);

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-2",
        apiKey: process.env.GEMINI_API_KEY,
    });

    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
    });

    return new DynamicStructuredTool({
        name: "get_building_regulations",
        description:
            "Use ONLY when the user explicitly asks about building codes, laws, regulations, or compliance (e.g., parking requirements, setbacks). DO NOT use this tool for simple GIS selections or filtering by attributes like status, land use, or area.",
        schema: z.object({
            query: z
                .string()
                .describe(
                    "The specific rule to look up, e.g., 'parking requirements for residential buildings'",
                ),
        }),
        responseFormat: "content_and_artifact",
        func: async ({ query }) => {
            try {
                const retriever = vectorStore.asRetriever({ k: 1 });
                const retrievedDocs = await retriever.invoke(query);

                if (retrievedDocs.length === 0) {
                    return ["No regulations found for this query.", []];
                }

                const serialized = retrievedDocs
                    .map((doc) => `Regulation Context:\n${doc.pageContent}`)
                    .join("\n\n---\n\n");

                return [serialized, retrievedDocs];
            } catch (err) {
                console.error("RAG Tool Error:", err);
                return [`Error retrieving regulations: ${err.message}`, []];
            }
        },
    });
};

module.exports = { createRegulationsRagTool };
