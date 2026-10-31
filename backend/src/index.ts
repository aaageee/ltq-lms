import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// M0-A: tanpa route — endpoint API dimulai dari M1-A (auth)
const PORT = Number(process.env.BACKEND_PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`[backend] server berjalan di http://localhost:${PORT}`);
});
