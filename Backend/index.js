const express = require("express");
const app = express();

const recommendationRoutes = require("./Routes/recommendationRoutes");

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Dhairyaa 🚀 API is running");
});

// Use routes
app.use("/api", recommendationRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
