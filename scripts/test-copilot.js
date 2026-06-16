// scripts/test-copilot.js
require("dotenv").config();
const {
    CopilotRuntime,
    GoogleGenerativeAIAdapter,
} = require("@copilotkit/runtime");
const {
    getLayerSchemaAction,
    queryLandLayerAction,
} = require("../Controllers/Chat/actions/landLayerActions");

const serviceAdapter = new GoogleGenerativeAIAdapter({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
});
const runtime = new CopilotRuntime({
    actions: [getLayerSchemaAction, queryLandLayerAction],
});

(async () => {
    const result = await runtime.processRuntimeRequest({
        serviceAdapter,
        messages: [
            {
                role: "user",
                content: "select land parcels where land use is residential",
            },
        ],
        actions: [],
    });
    console.log(JSON.stringify(result, null, 2));
})();
