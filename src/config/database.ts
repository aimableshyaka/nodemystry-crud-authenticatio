// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const mongoURI = process.env.MONGODB_URI || "mongodb+srv://shyakaaimable55_db_user:sCrlQ4odFhXRbhoo@cluster0.ekulup5.mongodb.net/?appName=Cluster0";
//     await mongoose.connect(mongoURI);
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     process.exit(1);
//   }
// };

// export default connectDB;


import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
