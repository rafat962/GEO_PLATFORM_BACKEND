const User = require("../models/User.Model");
const Email = require("../utils/email");
exports.getPendingUsers = async (req, res, next) => {
    try {
        const users = await User.find({ emailActive: true, active: false });
        res.status(200).json(users);
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err,
        });
    }
};
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err,
        });
    }
};

exports.acceptPendingEmail = async (req, res, next) => {
    try {
        const acceptedUserId = req.params.userId;
        const user = await User.findByIdAndUpdate(
            acceptedUserId,
            {
                active: true,
            },
            {
                returnDocument: "after",
            }
        );
        res.status(200).json({
            status: "success",
            message: `User ${user.name} has been activated successfully.`,
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err,
        });
    }
};

exports.rejectUser = async (req, res, next) => {
    try {
        const rejUserId = req.params.userId;
        const user = await User.findByIdAndDelete(rejUserId);
        res.status(200).json({
            status: "success",
            message: "User has been deleted successfully",
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};

exports.deActiviteUser = async (req, res, next) => {
    try {
        const UserId = req.params.userId;
        const user = await User.findByIdAndUpdate(UserId, {
            active: false,
        });
        res.status(200).json({
            status: "success",
            message: "User has been deActivited successfully",
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};

exports.ActiviteUser = async (req, res, next) => {
    try {
        const UserId = req.params.userId;
        const user = await User.findByIdAndUpdate(UserId, {
            active: true,
            emailActive: true,
        });
        const url2 = `http://localhost:5173/auth/login`;
        await new Email(user, url2).sendWelcome();
        res.status(200).json({
            status: "success",
            message: "User has been deActivited successfully",
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};
//------------------- getUserLogs -------------------

exports.getUserLogs = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const userData = await User.findById(userId).select("loginLogs");
        res.status(200).json(userData);
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};
//------------------- Set Permissions -------------------

exports.setPermissions = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const permissions = req.body.permissions;
        const userData = await User.findByIdAndUpdate(userId, { permissions });
        res.status(200).json(userData);
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};
//------------------- getPermissions -------------------

exports.getPermissions = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const userData = await User.findById(userId).select("permissions");
        res.status(200).json(userData);
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err || "",
        });
    }
};
