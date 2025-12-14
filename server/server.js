import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import userRouter from "./routes/userRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";

const app = express();


let cloudinaryConnected = false;
async function init() {
  if (!cloudinaryConnected) {
    await connectCloudinary();
    cloudinaryConnected = true;
  }
}

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("server is running...");
});

app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

export default async function handler(req, res) {
  await init();
  return app(req, res);
}
