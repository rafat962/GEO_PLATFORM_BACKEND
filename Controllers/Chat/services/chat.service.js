const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { MongoDBSaver } = require("@langchain/langgraph-checkpoint-mongodb");
const { HumanMessage, ToolMessage } = require("@langchain/core/messages");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

const { createLayerSchemaTool } = require("./langchain/Esri/GetSchema.tool");
const { createQueryLayerTool } = require("./langchain/Esri/queryLayer.tool");
const {
    createRegulationsRagTool,
} = require("./langchain/Esri/regulations_rag.tool");

dotenv.config({ path: `./config.env` });

const systemPrompt = `
You are a highly capable GeoAI Urban Planning Assistant.

ROUTING DECISION (THINK CAREFULLY BEFORE ACTING):
- If the user asks about LAWS, RULES, or COMPLIANCE (e.g., "does it meet parking rules", "is this legal", "setbacks"), you MUST follow WORKFLOW A.
- If the user simply wants to FILTER, SELECT, or FIND data based on attributes (e.g., "select lands where status is good", "find residential plots"), you MUST follow WORKFLOW B.

WORKFLOW A (COMPLIANCE & RULES):
1. Call "get_building_regulations" to find the legal math/rules.
2. Call "get_layer_schema" to inspect available GIS fields.
3. Call "query_layer_data" to fetch data.
4. Compare GIS data against the rules and answer.

WORKFLOW B (GENERAL GIS FILTERING - DO NOT USE RAG):
1. DO NOT call "get_building_regulations".
2. Call "get_layer_schema" FIRST to map the user's requested filter (e.g., status, area, type) to correct field names and domains.
3. Call "query_layer_data" passing the corrected SQL where clause.
4. Briefly summarize the fetched lands.

FORMATTING GUIDELINES (CRITICAL FOR UI RENDERING):
- You MUST format your entire conversational response using clean, semantic HTML styled with inline Tailwind CSS classes.
- NEVER use Markdown syntax like **bold**, *italic*, or markdown lists (- item). Always use the equivalent HTML tags.
- Use the following styling rules:
  - Paragraphs: Wrap text in <p class="mb-3 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-200">.
  - Highlighted/Important terms: Wrap in <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded"> or <strong class="font-bold text-slate-900 dark:text-white">.
  - Lists: Use <ul class="list-disc list-inside space-y-1.5 my-2.5 pl-2 text-slate-700 dark:text-slate-200"> or <ol class="list-decimal list-inside space-y-1.5 my-2.5 pl-2 text-slate-700 dark:text-slate-200"> with <li> tags.
  - Headers: Use <h4 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 first:mt-0"> for section headings.
  - Tables (for zones, metrics, limits comparison):
    - Table wrapper: <div class="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-700">
    - Table element: <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs text-left">
    - Table header: <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
    - Header cells: <th class="px-3 py-2 font-semibold">
    - Table rows: <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
    - Table body cells: <td class="px-3 py-2 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
  - Info boxes / key notes: Wrap in <div class="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 text-amber-900 dark:text-amber-300 rounded-r-lg my-3">.
- Ensure all HTML tags are valid, properly nested, and always closed.

FINAL RULE:
Never output raw JSON features in your text message. Output only conversational text.
`;

const LAYER_URL =
    "https://services3.arcgis.com/UDCw00RKDRKPqASe/arcgis/rest/services/Buildings_langchain/FeatureServer/0";

const tools = [
    createRegulationsRagTool(),
    createLayerSchemaTool(LAYER_URL),
    createQueryLayerTool(LAYER_URL),
];

const model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL,
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
});

let agentInstance = null;
let mongoClientInstance = null;

const getAgent = async () => {
    if (agentInstance) return agentInstance;

    const connectionString =
        process.env.DB || "mongodb://127.0.0.1:27017/geoai_db";

    mongoClientInstance = new MongoClient(connectionString);
    await mongoClientInstance.connect();

    if (typeof mongoClientInstance.appendMetadata !== "function") {
        mongoClientInstance.appendMetadata = function () {
            return this;
        };
    }

    const checkpointer = new MongoDBSaver({ client: mongoClientInstance });

    agentInstance = createReactAgent({
        llm: model,
        tools,
        messageModifier: systemPrompt,
        checkpointSaver: checkpointer,
    });

    return agentInstance;
};

const runChat = async ({ sessionId, message }) => {
    try {
        const agent = await getAgent();

        const config = {
            configurable: {
                thread_id: sessionId || "default_session",
            },
        };

        const result = await agent.invoke(
            {
                messages: [new HumanMessage(message)],
            },
            config,
        );

        const totalMessages = result.messages;

        const toolResults = totalMessages
            .filter((m) => m instanceof ToolMessage && m.artifact !== undefined)
            .map((m) => ({
                tool: m.name,
                data: m.artifact,
            }));

        const lastMessage = totalMessages[totalMessages.length - 1];
        let replyText = lastMessage.content;

        if (Array.isArray(replyText)) {
            replyText = replyText
                .map((part) =>
                    typeof part === "string" ? part : part.text || "",
                )
                .join("");
        }

        return {
            reply: replyText,
            toolResults,
        };
    } catch (err) {
        console.error("Gemini invoke error:", err);
        throw err;
    }
};

module.exports = { runChat };
