const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const authRoutes = require("./Routes/Auth.Route");
const userRoutes = require("./Routes/Users.Route");
const featureRoutes = require("./Routes/Feature.Route");
//--------------------------- configurations ---------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
//--------------------------- Routers ---------------------------

app.use("/api/v1/users", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/feature", featureRoutes);

// app.use("*", (req, res, next) => {
//     res.status(400).json({
//         status: "fail",
//         message: "INVALID URL",
//     });
// });

module.exports = app;
