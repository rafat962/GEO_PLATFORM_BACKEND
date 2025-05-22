const dotenv = require("dotenv");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config({ path: `./config.env` });
exports.getAllFeatures = async (req, res, next) => {
    try {
        const {
            url,
            where = "1=1",
            outFields = "*",
            returnGeometry = false,
        } = req.query;
        const params = new URLSearchParams();
        params.append("f", "json");
        params.append("where", "1=1");
        params.append("outFields", outFields);
        params.append("returnGeometry", returnGeometry);
        const response = await fetch(`${url}/query?${params.toString()}`, {
            method: "GET",
        });
        const result = await response.json();

        res.status(200).json({
            status: "success",
            response: result,
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message || error,
        });
    }
};
// ------------------------------- AI -------------------------------
