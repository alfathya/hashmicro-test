require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const Router = require("./routers");
const errorHandler = require("./middlewares/errorHandler");
const prisma = require("./helpers/prisma");
const port = process.env.PORT;

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.disable("etag");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(Router);
app.use(errorHandler);

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Start server
checkDatabaseConnection()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/health`);
    });
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });

// Keep process alive
setInterval(() => {}, 1000);
