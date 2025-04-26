const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const loanRoutes = require("./routes/loanRoutes");
app.use(bodyParser.json());
app.use(cors());
app.use("/api/users", userRoutes);
app.use("/api/loans", loanRoutes);
app.get("/", (req, res) => res.send(""));

const ghatkPenDrown = process.env.ghatk-append-drown;

mongoose.connect(process.env.MONGODB_SERVER_PORT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB") && console.log(`ID: ${ghatkPenDrown}`))
  .catch((err) => console.error("MongoDB connection error:", err));

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});