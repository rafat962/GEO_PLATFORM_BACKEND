const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PineconeStore } = require("@langchain/pinecone");
const { Pinecone } = require("@pinecone-database/pinecone");

const createRagTool = () => {
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
        name: "retrieve_ai_agents_context",
        description:
            "Retrieve relevant documentation to help answer user queries about AI agents and LangChain.",
        schema: z.object({
            query: z
                .string()
                .describe(
                    "The search query to look up in the vector database.",
                ),
        }),
        responseFormat: "content_and_artifact",
        func: async ({ query }) => {
            try {
                const retriever = vectorStore.asRetriever({ k: 4 });
                const retrievedDocs = await retriever.invoke(query);

                const serialized = retrievedDocs
                    .map(
                        (doc) =>
                            `Source: ${doc.metadata?.source || "Unknown"}\n\nContent: ${doc.pageContent}`,
                    )
                    .join("\n\n");

                return [serialized, retrievedDocs];
            } catch (err) {
                console.log(err);
                return [`Error retrieving context: ${err.message}`, []];
            }
        },
    });
};

module.exports = { createRagTool };
