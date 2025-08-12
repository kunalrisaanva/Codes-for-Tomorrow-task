import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middleware/error.middleware.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000/",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// home route
app.get("",(req,res) => res.json({msg:"API Is Running"}))

// routes
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";

// routes register
app.use("/api/v1/users", userRoutes);
app.use(healthRoutes);

//  404 route
app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error middleware (last)
app.use(errorMiddleware);

export { app as Server };
