import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors())
app.use(cookieParser())

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// home route
app.get("", (req, res) => res.json({ msg: "API Is Running" }))

// routes
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";

// routes register
app.use("/api/v1/users", userRoutes);
app.use(healthRoutes);



export { app as Server };
