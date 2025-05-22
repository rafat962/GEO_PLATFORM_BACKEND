const express = require("express");
const Auth = require("../Controllers/Auth.Controller");
const { getAllFeatures } = require("../Controllers/Feature.Controller");
const Routing = express.Router();

//----------------- Auth Routs -----------------
Routing.route("/getAllFeatures").get(getAllFeatures);

module.exports = Routing;
