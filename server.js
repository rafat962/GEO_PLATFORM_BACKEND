const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: `./config.env` });

mongoose.connect(process.env.DB).then(() => {
    console.log("DB connection successfully");
});

app.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`app is lisining on Host ${process.env.PORT}`);
});
