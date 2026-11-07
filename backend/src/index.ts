import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import programRoutes from "./routes/programs";
import classRoutes from "./routes/classes";
import teacherRoutes from "./routes/teachers";
import studentRoutes from "./routes/students";
import invoiceRoutes from "./routes/invoices";
import guruRoutes from "./routes/guru";
import attendanceRoutes from "./routes/attendances";

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
app.use("/api/programs", programRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/attendances", attendanceRoutes);

// 404 untuk endpoint tak dikenal
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// error handler terakhir
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[backend] error:", err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

const PORT = Number(process.env.BACKEND_PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`[backend] server berjalan di http://localhost:${PORT}`);
});
