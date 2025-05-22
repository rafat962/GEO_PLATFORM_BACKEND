const User = require("../models/User.Model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const otpGenerator = require("otp-generator");
const Email = require("../utils/email");
const fs = require("fs");
const path = require("path");
const sign = (user, res) => {
    const token = jwt.sign({ id: user.id }, "rafat", {
        expiresIn: "7d",
    });
    res.cookie("jwt", token, {
        httpOnly: true, // prevents client-side JavaScript from accessing the cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    return token;
};

//------------------- Protect -------------------

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        } else {
            throw "no found token";
        }
        // ------ Check if there is token
        if (!token) {
            throw "there is not token";
        }
        // ------ Check if token valid
        token = JSON.parse(token);
        const verify = jwt.verify(token, "rafat");
        if (!verify) {
            throw "INVALID TOKEN";
        }
        // ------ Check if user valied
        const decode = await promisify(jwt.verify)(token, "rafat");
        const user = await User.findById(decode.id);
        if (!user) {
            throw "INVALID USER";
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: err.message,
        });
    }
};

//------------------- Login -------------------

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // ------ Check if user exsist
        const user = await User.findOne({ email: email }).select([
            "name",
            "email",
            "password",
            "active",
            "emailActive",
            "role",
        ]);
        if (!user) {
            throw "INVALID Email";
        }
        if (user.emailActive === false) {
            throw "Your email address is not activated. Please check your inbox to verify.";
        }
        if (user.active === false && user.emailActive === true) {
            throw "Your account is awaiting approval. Please wait for admin verification.";
        }
        if (!user) {
            throw "No account found with this email address.";
        }
        // ------ Check if Password Correct
        const passwordCheck = await user.correctPasswordCompare(
            password,
            user.password
        );
        if (!passwordCheck) {
            throw "INVALID PASSWORD";
        }
        // ------ return Token
        // ------ login date
        await user.updateOne({ $push: { loginLogs: new Date() } });
        res.locals.user = user;
        const token = await sign(user, res);
        console.log(user.role);
        res.status(200).json({
            status: "success",
            token,
            message: "You have logged in successfully. Welcome back!",
            userData: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err,
        });
    }
};

//------------------- LogOut -------------------

exports.logout = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw "User not found";
        }
        await user.updateOne({ $push: { loginLogOut: new Date() } });
        res.status(200).json({
            statu: "success",
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: err,
        });
    }
};

//------------------- signup -------------------
exports.signUp = async (req, res, next) => {
    try {
        // generate OTP
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        const CurrenUser = await User.findOne({
            email: req.body.email,
        });
        // console.log(CurrenUser);
        if (CurrenUser) {
            throw "Email already Taken, please chose another email";
        }
        if (!req.body.email) {
            throw "Please provide a email.";
        }
        if (!req.body.name) {
            throw "Please provide a name.";
        }
        if (!req.body.password) {
            throw "Please provide a password.";
        }
        if (!req.body.confirmPassword) {
            throw "Please provide a confirmation password.";
        }
        if (req.body.password !== req.body.confirmPassword) {
            throw "Password and Confirm Password must match.";
        }
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            active: req.body.active,
            otp: otp,
        });
        if (req.files) {
            if (req.files[0]) {
                user.photo = req.files[0].filename;
            }
        }
        await user.save();
        if (user) {
            const token = await sign(user, res);
            req.user = user;
            req.token = token;
            const url2 = `http://localhost:5173/auth/active/token=${token}`;
            await new Email(user, url2).sendOTP();
            res.status(200).json({
                status: "success",
                message: "Email activation has been sent",
                token,
            });
        }
    } catch (err) {
        if (err.message) {
            if (err.message.split(" ")[0] === "E11000") {
                res.status(400).json({
                    status: "error",
                    message: "Signup failed. Please choose another email.",
                });
            }
        } else {
            res.status(400).json({
                status: "error",
                message: `Signup failed. ${err}`,
            });
        }
    }
};

//------------------- resetPassword -------------------
exports.resetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User not found.");
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 houre
        await user.save();
        const resetURL = `http://localhost:4200/auth/forgetpassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: "success",
            message: "Reset token generated and sent to the user.",
            data: user.resetPasswordToken,
        });
    } catch (err) {
        res.status(404).json({
            statu: "fail",
            message: `Reset password failed ${err.message}`,
        });
    }
};

exports.resetPassword2 = async (req, res, next) => {
    try {
        const token = req.params.token;
        if (!token) throw "you should enter your token";
        const user = await User.findOne({ resetPasswordToken: token }).select(
            "password"
        );
        if (!user) throw "INVALID PASSWORD";
        if (!req.body.password) {
            throw "Please provide a password.";
        }
        if (!req.body.confirmPassword) {
            throw "Please provide a confirmation password.";
        }
        if (req.body.password !== req.body.confirmPassword) {
            throw "Password and Confirm Password must match.";
        }
        if (user.resetPasswordExpires >= Date.now()) throw "Expired try again";
        user.password = req.body.password;
        user.confirmPassword = req.body.confirmPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({
            state: "success",
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err,
        });
    }
};

//------------------- UpdatePassword -------------------
exports.updatePassword = async (req, res, next) => {
    try {
        const user2 = req.user;
        const user = await User.findById(user2.id).select("password");
        // ------ Check if Password Correct
        const passwordCheck = await user.correctPasswordCompare(
            req.body.pastPassword,
            user.password
        );
        if (!passwordCheck) {
            throw "Invalid Password";
        }
        user.password = req.body.password;
        user.confirmPassword = req.body.confirmPassword;
        if (!req.body.password) {
            throw "Please provide a password.";
        }
        if (!req.body.confirmPassword) {
            throw "Please provide a confirmation password.";
        }
        if (req.body.password !== req.body.confirmPassword) {
            throw "Password and Confirm Password must match.";
        }
        await user.save();
        const token = await sign(user, res);
        res.status(200).json({
            state: "success",
            token,
        });
    } catch (err) {
        console.log(err);
        res.status(404).json({
            status: "error",
            message: err || "Error When Updateing Password",
        });
    }
};

//------------------- isLoggedin -------------------

exports.islogedIn = async (req, res, next) => {
    try {
        const token = req.headers.cookie.slice(4);
        if (token) {
            // ------ Check if token valied
            const verify = jwt.verify(token, "rafat");
            if (!verify) {
                return next(new Error("INVALID token"));
            }
            // ------ Check if user valied
            const decoded = await promisify(jwt.verify)(token, "rafat");
            const user = await User.findById(decoded.id);
            res.locals.user = user;
            req.user = user;
            next();
        }
    } catch (err) {
        next();
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = req.user;
        res.status(200).json({
            statu: "success",
            user,
        });
    } catch (err) {
        res.status(400).json({
            statu: "fail",
            message: err.message,
        });
    }
};

//------------------- token verfy -------------------

exports.verfyToken = async (req, res, next) => {
    try {
        const token = req.body.token;
        if (!token) {
            throw "there is no token";
        }
        if (token) {
            // ------ Check if token valied
            const verify = jwt.verify(token, "rafat");
            const user = await User.findById(verify.id);
            if (user.active === false) {
                throw "User don't activated";
            }
            if (!verify) {
                throw "INVALID";
            }
            res.status(200).json({
                status: "success",
                message: "VALID",
                userData: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                },
            });
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({
            status: "fail",
            message: err,
        });
    }
};

//------------------- Active Acount -------------------

exports.active = async (req, res, next) => {
    try {
        const otp = req.body.otp;
        const user = req.user;
        if (user.otp !== otp) {
            throw "INVALID OTP";
        } else {
            user.emailActive = true;
            await user.save();
            res.status(200).json({
                statu: "success",
                message: "Welcom To Our Community",
            });
        }
    } catch (err) {
        console.log(2);
        console.log(err);
        res.status(404).json({
            status: "error",
            message: err,
        });
    }
};

//------------------- Update User -------------------
exports.updateUser = async (req, res, next) => {
    try {
        // Find and update the user
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }
        // check if there is an email with the same new email
        // Update user fields except password
        // Delete the old photo if it exists and is not the default one
        if (req.file && user.photo && user.photo !== "none") {
            const oldPhotoPath = path.join(
                __dirname,
                "..",
                "public",
                "users",
                user.photo
            );
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath); // delete the old file
            }
        }
        Object.assign(user, req.body);
        // Handle file upload if any
        if (req.file) {
            user.photo = req.file.filename;
        }
        // Save the updated user
        await user.save();
        res.status(200).json({
            status: "success",
            userData: {
                name: req.body.name,
                email: req.body.email,
                photo: user.photo,
            },
        });
    } catch (err) {
        if (err.message.startsWith("E11000")) {
            res.status(404).json({
                status: "error",
                message: "this Email already Taken please Chose another EEmail",
            });
        } else {
            res.status(404).json({
                status: "error",
                message: err.message,
            });
        }
    }
};
//------------------- Delete Image -------------------

exports.deleteImage = async (req, res, next) => {
    try {
        const user = req.user;
        const oldPhotoPath = path.join(
            __dirname,
            "..",
            "public",
            "users",
            user.photo
        );
        if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath); // delete the old file
        }
        user.photo = "none";
        await user.save();
        res.status(200).json({
            statu: "success",
            message: "Image Deleted Succssfully",
        });
    } catch (err) {
        res.status(404).json({
            status: "error",
            message: err.message,
        });
    }
};
