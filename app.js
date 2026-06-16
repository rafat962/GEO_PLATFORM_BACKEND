const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const authRoutes = require("./Routes/Auth.Route");
const userRoutes = require("./Routes/Users.Route");
const featureRoutes = require("./Routes/Feature.Route");

const AIRoutes = require("./Routes/ChatBot.Route");
const chatRoutes = require("./Routes/chat.routes");

// Configurations
app.use(cors());
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Routers
app.use("/api/v1/Auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/feature", featureRoutes);
app.use("/api/v1/ai", AIRoutes);
app.use("/api/v1/chat", chatRoutes);

module.exports = app;
