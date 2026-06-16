const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: `./config.env` });

mongoose.connect(process.env.DB).then(() => {
    console.log("DB connection successfully");
});

app.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`app is lisining on Host ${process.env.PORT}`);
});
