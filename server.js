const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const connectDb = require("./database/db");
connectDb();

// Import routes
const transactionRoute = require("./routes/transaction"); 
const transactionLogRoute = require("./routes/transactionLog"); 
const userRoute = require("./routes/userRoute");
const expenseRoutes = require("./routes/expenseRoute");
const resetPasswordRoutes = require("./routes/resetPassword");
const friendsRoute = require("./routes/friendsRoute");

// Middleware
const corsOptions = {
  origin: 'https://track-ledger-frontend-8tlx.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "App is running" });
});

// Register routes
app.use('/api/transaction', transactionRoute);
app.use("/api/transactionLog", transactionLogRoute);
app.use("/api/user", userRoute);
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/friends", friendsRoute);

const port = 4000;
app.listen(port, () => {
  console.log(`🚀 App is running on http://localhost:${port}`);
});
