const express = require("express");
const Auth = require("../Controllers/Auth.Controller");
const multer = require("multer");

const Routing = express.Router();

//----------------- Multer -----------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/users");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.originalname.split(".")[0] +
                "-" +
                uniqueSuffix +
                "." +
                file.originalname.split(".")[1]
        );
    },
});

const upload = multer({ storage: storage });

//----------------- Auth Routs -----------------
Routing.route("/signup").post(Auth.signUp);
Routing.route("/deleteImage").post(Auth.protect, Auth.deleteImage);
Routing.route("/login").post(Auth.login);
Routing.route("/logout").post(Auth.protect, Auth.logout);
Routing.route("/resetPassword").post(Auth.resetPassword);
Routing.route("/resetPassword2/:token").patch(Auth.resetPassword2);
Routing.route("/updatePassword").patch(Auth.protect, Auth.updatePassword);
Routing.route("/updateUser").post(
    Auth.protect,
    upload.single("file"),
    Auth.updateUser
);
// Routing.route("/getme").get(Auth.protect, Auth.getMe);
Routing.route("/token").post(Auth.verfyToken);
Routing.route("/active").post(Auth.protect, Auth.active);

module.exports = Routing;
