import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

// Suppress prisma query logs in tests
process.env.NODE_ENV = "test";
