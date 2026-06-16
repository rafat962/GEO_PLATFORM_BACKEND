const { runChat } = require("./services/chat.service");
const { successResponse, errorResponse } = require("./helpers/response.helper");

const sendMessage = async (req, res) => {
    try {
        console.log("start");
        const { message, sessionId } = req.body;
        console.log("message", message);

        if (!message || typeof message !== "string") {
            return res
                .status(400)
                .json(
                    errorResponse("'message' is required and must be a string"),
                );
        }
        const data = await runChat({
            sessionId: sessionId || "default",
            message,
        });
        console.log("finish");

        return res.status(200).json(successResponse(data));
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json(errorResponse(err.message));
    }
};

module.exports = { sendMessage };
