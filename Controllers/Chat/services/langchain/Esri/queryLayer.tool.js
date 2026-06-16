const axios = require("axios");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

const MAX_SAMPLE_FOR_LLM = 5; // كفاية للـ LLM يلخّص ويتأكد من النتيجة

const createQueryLayerTool = (layerUrl) => {
    return new DynamicStructuredTool({
        name: "query_layer_data",
        description:
            "Execute a verified ArcGIS Where Clause query to fetch the actual features/lands data. Input MUST be a valid SQL-like where clause computed after checking the schema.",
        schema: z.object({
            whereClause: z
                .string()
                .describe(
                    "The corrected SQL where clause, e.g., STATUS_AR = '3' or LandUse = 'RES'",
                ),
        }),
        // الأهم: بيرجع [content, artifact]
        responseFormat: "content_and_artifact",
        func: async ({ whereClause }) => {
            try {
                const response = await axios.get(`${layerUrl}/query`, {
                    params: {
                        where: whereClause,
                        outFields: "*",
                        f: "json",
                        returnGeometry: false,
                    },
                });

                if (response.data.error) {
                    const errMsg = `ArcGIS Server Error: ${response.data.error.message}`;
                    return [
                        errMsg,
                        {
                            success: false,
                            executedQuery: whereClause,
                            error: response.data.error.message,
                        },
                    ];
                }

                const features = response.data.features || [];
                const total = features.length;

                const summaryForLLM = JSON.stringify({
                    success: true,
                    executedQuery: whereClause,
                    totalFeaturesFound: total,
                    sampleAttributes: features
                        .slice(0, MAX_SAMPLE_FOR_LLM)
                        .map((f) => f.attributes),
                });

                // ✅ ده الـ artifact الكامل - يطلع للـ frontend بس
                const artifact = {
                    success: true,
                    executedQuery: whereClause,
                    totalFeaturesFound: total,
                    features,
                };

                return [summaryForLLM, artifact];
            } catch (err) {
                return [
                    `Error executing query: ${err.message}`,
                    {
                        success: false,
                        executedQuery: whereClause,
                        error: err.message,
                    },
                ];
            }
        },
    });
};

module.exports = { createQueryLayerTool };
