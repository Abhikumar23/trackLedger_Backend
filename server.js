const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const connectDb = require("./database/db");

// 🔍 Route logger
function logRoutes(appOrRouter) {
  ["use", "get", "post", "put", "delete", "patch"].forEach((method) => {
    const original = appOrRouter[method];
    appOrRouter[method] = function (path, ...rest) {
      if (typeof path === "string") {
        console.log(`[ROUTE] ${method.toUpperCase()} ${path}`);
      }
      return original.call(this, path, ...rest);
    };
  });
}

logRoutes(app); // Call right after app is created

// Connect to DB
connectDb();

// CORS config
const corsOptions = {
  origin: [
    "https://track-ledger-frontend-8tlx.vercel.app",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/api/test", (req, res) => {
  res.json({ message: "App is running" });
});
app.use("/api/transaction", require("./routes/transaction"));
app.use("/api/transactionLog", require("./routes/transactionLog"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/reset-password", require("./routes/resetPassword"));
app.use("/api/expenses", require("./routes/expenseRoute"));
app.use("/api/friends", require("./routes/friendsRoute"));

// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`🚀 App is running on http://localhost:${port}`);
  });
}

module.exports = app;
