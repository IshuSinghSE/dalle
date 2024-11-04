import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";

import connectDB from "./mongodb/connect.js";
import postRoutes from "./routes/postRoutes.js";
import dalleRoutes from "./routes/dalleRoutes.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["https://dalle3.vercel.app", "localhost:5173"],
  })
);
app.use(express.json({ limit: "50mb" }));

app.use("/api/v1/post", postRoutes);
app.use("/api/v1/dalle", dalleRoutes);

app.get("/", async (req, res) => {
  var msg = "<h3>Your backend is running at : </h3> ";
  var fullUrl = msg + req.protocol + "://" + req.get("host") + req.originalUrl;
  res.send(fullUrl);
});

const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL);
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`Server has started on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

startServer();
