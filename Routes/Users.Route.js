const express = require("express");
const { protect } = require("../Controllers/Auth.Controller");
const {
    getPendingUsers,
    acceptPendingEmail,
    rejectUser,
    getAllUsers,
    deActiviteUser,
    ActiviteUser,
    getUserLogs,
    setPermissions,
    getPermissions,
} = require("../Controllers/Users.Controller");
const Routing = express.Router();

//----------------- Auth Routs -----------------
Routing.route("/getPendingUsers").get(getPendingUsers);
Routing.route("/getAllUsers").get(getAllUsers);
Routing.route("/acceptPendingEmail/:userId").patch(acceptPendingEmail);
Routing.route("/rejectUser/:userId").delete(rejectUser);
Routing.route("/deActiviteUser/:userId").patch(deActiviteUser);
Routing.route("/ActiviteUser/:userId").patch(ActiviteUser);
Routing.route("/logs/:id").get(protect, getUserLogs);
Routing.route("/permissions/:id").post(protect, setPermissions);
Routing.route("/getPermissions/:id").get(protect, getPermissions);

module.exports = Routing;
