require ("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const bcrypt = require('bcrypt');

const authRoutes = require ("./routes/authRoutes");
const userRoutes = require ("./routes/userRoutes");
const taskRoutes = require ("./routes/taskRoutes");
const reportRoutes = require ("./routes/reportRoutes");

const app = express();

//middleeare to handle cors
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));


// middleware 
app.use(express.json());

connectDB();
//Routes
 app.use("/api/auth", authRoutes);
 app.use("/api/users", userRoutes);  
 app.use("/api/tasks", taskRoutes);
 app.use("/api/reports", reportRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});