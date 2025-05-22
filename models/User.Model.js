const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        email: {
            type: String,
            require: [true, "you should enter your email"],
            unique: true,
            validate: {
                validator: validator.isEmail,
                message: "Please enter a valid email address",
            },
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
        permissions: {
            type: [String],
            default: [],
        },
        active: {
            type: Boolean,
            default: false,
        },
        emailActive: {
            type: Boolean,
            default: false,
        },
        photo: {
            type: String,
            default: "none",
        },
        password: {
            type: String,
            require: [true, "you should enter your password"],
            select: false,
            minlength: 3,
        },
        confirmPassword: {
            type: String,
            require: [true, "you should confirm your password"],
            validate: {
                validator: function (v) {
                    return v === this.password;
                },
                message: "Password and Confirm Password do not match",
            },
        },
        loginLogs: {
            type: [Date],
            default: [],
        },
        loginLogOut: {
            type: [Date],
            default: [],
        },
        otp: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    {
        timestamps: true,
    }
);

UserSchema.pre(/^find/, function (next) {
    this.select("-password");
    this.select("-confirmPassword");
    next();
});

// Middleware to handle hashing and timestamps
UserSchema.pre("save", async function (next) {
    // Set the current date
    const currentDate = new Date();

    // Set createdAt and updatedAt
    if (this.isNew) {
        this.createdAt = currentDate;
    }
    this.updatedAt = currentDate;

    // Hash password if it's new or modified
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.confirmPassword = undefined; // Remove confirmPassword from the document
    }

    next();
});

UserSchema.methods.correctPasswordCompare = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
