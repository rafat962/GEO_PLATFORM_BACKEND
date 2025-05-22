const express = require("express");
const Auth = require("../Controllers/Auth.Controller");
const {
    getPendingUsers,
    acceptPendingEmail,
    rejectUser,
    getAllUsers,
    deActiviteUser,
    ActiviteUser,
} = require("../Controllers/Users.Controller");
const Routing = express.Router();

//----------------- Auth Routs -----------------
Routing.route("/getPendingUsers").get(getPendingUsers);
Routing.route("/getAllUsers").get(getAllUsers);
Routing.route("/acceptPendingEmail/:userId").patch(acceptPendingEmail);
Routing.route("/rejectUser/:userId").delete(rejectUser);
Routing.route("/deActiviteUser/:userId").patch(deActiviteUser);
Routing.route("/ActiviteUser/:userId").patch(ActiviteUser);

module.exports = Routing;
