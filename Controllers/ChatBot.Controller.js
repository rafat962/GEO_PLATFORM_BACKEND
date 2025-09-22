const OpenAI = require("openai");

// نربط OpenAI SDK مع Ollama
const client = new OpenAI({
    baseURL: "http://localhost:11434/v1", // Ollama API متوافقة مع OpenAI
    apiKey: "ollama", // أي string (Ollama مش محتاجة مفتاح)
});
// -----------------------------1) FIRST SETP (EXTRACT SQL BASED ON FIELDS) -----------------------------

get_ai_response = async (prompt) => {
    // --------------------------------- without openAi ---------------------------------
    // const response = await fetch("http://localhost:11434/api/generate", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //         model: "gemma3:1b-it-qat",
    //         prompt: prompt,
    //         stream: false,
    //         options: {
    //             num_ctx: 2000,
    //         },
    //     }),
    // });
    // const data = await response.json();
    // return data.response;
    // --------------------------------- with openAi ---------------------------------
    const completion = await client.chat.completions.create({
        model: "gemma3:4b-it-qat", // نفس الموديل اللي شغال عندك
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // 🚀 ده اللي بيجبره يرجع JSON صالح
    });

    // Ollama/OpenAI SDK بيرجع النص في هذا المكان
    return completion.choices[0].message.content;
};

ExtractSql = async (message) => {
    const prompt = `
        You are an expert SQL query generator.
        Your ONLY task is to convert natural language requests into valid SQL statements.
        Rules:
        - Use only the field names from the metadata when writing SQL (never use aliases).
        - Aliases are provided only to understand the user intent, but never to be used in SQL.
        - Do not invent fields or tables.
        - Always return a complete SQL query ending with a semicolon.
        - Use the correct type from the metadata (TEXT should be quoted with single quotes, INTEGER and FLOAT should not be quoted).
        - The output MUST always be valid JSON, and NOTHING else (no markdown, no explanation, no code fences).
        - Output MUST be valid JSON only.
        - Output raw JSON only, without markdown, code fences, or explanations.
        - The JSON structure must always be one of these two:
        Important validation rules (MUST follow strictly):
        - You MUST ONLY use the fields provided in the metadata list.
        - If the user request mentions "الكود", you MUST use "OBJECTID".
        - Do not confuse "الكود" with boster_number or any other numeric field.
        - If the user request does NOT explicitly mention a specific field, always use "*" in the SELECT clause.
        - Do NOT default to OBJECTID or any other field unless it is clearly mentioned by the user.
        - Never assume the user wants a specific field unless explicitly stated.
        - If the request mentions a field or table NOT in the metadata, you MUST return the error JSON (never invent new fields).
        If you can generate a valid SQL:
        {
          "status": "success",
          "response": "<SQL query using only field names>"
        }

        If you cannot find the exact field requested, return the closest match:
        {
          "status": "error",
          "message": "The requested field was not found in the metadata.",
          "suggested_field": "<closest field name from metadata>"
        }

        Metadata (always map alias → field_name):
        Table: Pevouits
        Fields (field_name | alias | type):
        - OBJECTID | الكود | PrimaryKey
        - canal | الترعة | TEXT
        - overall | النسبة الإجمالية لأعمال التنفيذ | String
        - boster_number | رقم البوستر التابع له | Integer
        - Zone | الزون الواقع بها | TEXT
        - pivot_number | رقم البيفوت | Integer
        - stage | المرحلة | TEXT
        - grading_company_code | الشركه المنفذه للتسويات | Integer
        - soil_investigation_works | نتيجة الجسة | String
        - exe_per_grading_works | نسبه التنفيذ اعمال التسويات | TEXT
        - pivot_foundation_company_code | الشركه المنفذه للقواعد | Integer
        - exe_per_pivot_foundations | نسبه التنفيذ قواعد البيفوت | TEXT
        - irrigation_company_code | الشركه المنفذه لاجهزه الرى | Integer
        - completion_date | تاريخ الإنتهاء | Date
        - Shape__Area | المساحة | Double
        - Shape__Length | الطول | Double

        --------------------------------------------------
        User request:
        ${message}
    `;
    const res = await get_ai_response(prompt);
    return res;
};

// ----------------------------------------- Compass v-1 (based on 1 known layer and metaData ask the user input) -----------------------------------------
exports.SendMessage = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                statu: "error",
                message: "Invalid message input",
                suggested_field: null,
            });
        }
        // ------------ 1) extract sql step ------------
        const SqlExpressionData = await ExtractSql(message);
        const {
            status,
            response,
            message: AiRes,
            suggested_field,
        } = JSON.parse(SqlExpressionData);
        if (status === "error") {
            console.log(22);
            res.status(400).json({
                statu: "error",
                message: AiRes,
                suggested_field: suggested_field,
            });
        }
        // ------------ 2) request All Data From Layer Based On Sql ------------
        let { whereClause, selectedFields } = parseSqlResponse(response);
        try {
            data = await getFeatures(
                whereClause,
                selectedFields,
                "https://services2.arcgis.com/CwbO1K4qp8M3IDwA/arcgis/rest/services/Pivots_last/FeatureServer/0"
            );
        } catch (err) {
            return res.status(500).json({
                statu: "error",
                message: "Failed to fetch features",
                errorMessage: err.message,
            });
        }
        // ------------ 3) Return Data To User On Structured Way ------------
        res.status(200).json({
            statu: "success",
            message: message,
            SQL: response,
            data: data,
        });
    } catch (err) {
        res.status(404).json({
            statu: "error",
            message: "Unexpected server error",
            errorMessage: err.message,
            error: err,
        });
    }
};
// ----------------------------------------- Compass v-2 (based on 1 Unknown layer and Unknown metaData ask the user input) -----------------------------------------
// ----------------------------------------- Compass v-3 (based on many Unknown Layers And Unknown metaData ask the user input) -----------------------------------------

// ********************************************* helpers *********************************************
// ---------------------------- cleanWhereClause

function parseSqlResponse(sqlResponse) {
    let whereClause = "";
    let selectedFields = [];

    try {
        // 1) استخرج الحقول بعد SELECT و قبل FROM
        const selectMatch = sqlResponse.match(/select\s+(.*?)\s+from/i);
        if (selectMatch && selectMatch[1]) {
            selectedFields = selectMatch[1]
                .split(",")
                .map((f) => f.trim())
                .filter((f) => f.length > 0);

            // ✅ لو selectedFields فاضي أو كله OBJECTID فقط → رجعه ["*"]
            if (
                selectedFields.length === 0 ||
                (selectedFields.length === 1 &&
                    /^objectid$/i.test(selectedFields[0]))
            ) {
                selectedFields = ["*"];
            }
        } else {
            // ✅ fallback: لو مفيش SELECT أصلاً
            selectedFields = ["*"];
        }

        // 2) استخرج الشرط بعد WHERE
        const parts = sqlResponse.split(/where/i);
        if (parts.length > 1) {
            whereClause = parts[1].trim();
            // شيل ; و المسافات الزيادة
            whereClause = whereClause.replace(/;$/g, "").trim();
        }
    } catch (err) {
        console.error("parseSqlResponse error:", err);
    }

    return {
        whereClause,
        selectedFields,
    };
}

// ---------------------------- getFeatures
/**
 * Fetches features from a feature layer service based on a SQL query.
 *
 * @param {string} query - SQL query string.
 * @param {string} url - Feature layer REST API URL.
 * @param {List} outFields - Feature layer REST API URL.
 * @returns {Promise<Object>} JSON response with features.
 */
getFeatures = async (query, outFields, url) => {
    try {
        if (!url) {
            throw new Error("Invalid service URL");
        }
        const params = new URLSearchParams();
        params.append("f", "json");
        params.append("where", query && query.length > 0 ? query : "1=1");
        params.append(
            "outFields",
            outFields && outFields.length > 0 ? outFields : "*"
        );
        params.append("returnGeometry", true);
        const response = await fetch(`${url}/query?${params.toString()}`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(
                `FeatureServer request failed with status ${response.status}`
            );
        }
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error.message || "ArcGIS service error");
        }
        return {
            FeaturesCount: result?.features?.length || 0,
            status: "success",
            data: result,
        };
    } catch (error) {
        return {
            status: "faild",
            errorMessage: error?.message || "Unknown error",
            error: error,
        };
    }
};
