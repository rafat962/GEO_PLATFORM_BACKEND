const { Router } = require("express");
const { sendMessage } = require("../Controllers/Chat/chat.controller");

const router = Router();
router.post("/", sendMessage);

module.exports = router;
