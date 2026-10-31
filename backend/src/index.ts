import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();

// CORS: izinkan frontend (credentials untuk cookie refresh)
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);

// M1-A: route lain menyusul di modul berikutnya (M2: programs/classes/teachers)

const PORT = Number(process.env.BACKEND_PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`[backend] server berjalan di http://localhost:${PORT}`);
});
