const express = require("express");

const { SendMessage } = require("../Controllers/ChatBot.Controller");

const Routing = express.Router();

//----------------- ChatBot Routs -----------------

Routing.route("/sendMessage").post(SendMessage);

module.exports = Routing;
