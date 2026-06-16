const axios = require("axios");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

const createLayerSchemaTool = (layerUrl) => {
    console.log("query get_layer_schema start");

    return new DynamicStructuredTool({
        name: "get_layer_schema",
        description:
            "Mandatory tool to call BEFORE constructing any query or filter. Use this to get the exact database field names (case-sensitive) and their valid Domain coded values (e.g., matching 'سكني' to its code).",
        schema: z.object({}),
        func: async () => {
            try {
                const response = await axios.get(`${layerUrl}?f=json`);
                const data = response.data;

                if (!data.fields) {
                    return "Could not retrieve fields from the layer metadata.";
                }

                const simplifiedSchema = data.fields.map((field) => {
                    const fieldInfo = {
                        name: field.name,
                        alias: field.alias,
                        type: field.type,
                    };

                    if (field.domain && field.domain.type === "codedValue") {
                        fieldInfo.domainValues = field.domain.codedValues.map(
                            (cv) => ({
                                code: cv.code,
                                name: cv.name,
                            }),
                        );
                    }

                    return fieldInfo;
                });

                return JSON.stringify(
                    {
                        layerName: data.name,
                        fields: simplifiedSchema,
                    },
                    null,
                    2,
                );
            } catch (err) {
                return `Error fetching layer schema: ${err.message}`;
            }
        },
    });
};

module.exports = { createLayerSchemaTool };
