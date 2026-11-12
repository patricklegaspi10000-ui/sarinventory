require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));
app.use("/api/v1/auth", require("./src/routes/authRoutes"));
app.use("/api/v1/categories", require("./src/routes/categoryRoutes"));
connectDB()
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log(`Server on port ${process.env.PORT}`)
    )
  )
  .catch((err) => console.error(err));