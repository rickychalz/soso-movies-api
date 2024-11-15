import dotenv from "dotenv";
import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middlewares.js";

dotenv.config();
const app = express();

// Simple CORS setup for testing
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Fixed: invoke cookieParser as a function

const PORT = process.env.PORT || 4000;

//connect to Database
connectDB();

// Add a test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

//routes
app.use("/api/users", userRouter);

//error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});