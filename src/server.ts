import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/database";

dotenv.config({});
const PORT = Number(process.env.PORT) || 3000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log("server is up and running ", PORT);
});