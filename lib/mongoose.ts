import mongoose from "mongoose";

// Get MongoDB URI from environment variables or use a fallback for local development
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Define the type for our cached connection
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Define the global type
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 60000, // Increased timeout to 60 seconds
        socketTimeoutMS: 90000, // Increased socket timeout to 90 seconds
        family: 4, // Use IPv4, skip trying IPv6
        maxPoolSize: 10, // Maintain up to 10 socket connections
        retryWrites: true,
        retryReads: true,
        connectTimeoutMS: 60000, // Connection timeout
        heartbeatFrequencyMS: 10000, // Check server status more frequently
        autoIndex: true, // Build indexes
        maxConnecting: 10, // Maximum number of connections being established
        minPoolSize: 0, // Minimum number of connections in the pool
        compressors: "zlib", // Use compression for better performance
      };

      // We know MONGODB_URI is defined because we checked above
      cached.promise = mongoose
        .connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log("MongoDB connected successfully");
          return mongoose;
        })
        .catch((error) => {
          console.error("MongoDB connection error:", error);
          cached.promise = null; // Reset the promise on error
          throw error; // Re-throw to handle it in the calling function
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Database connection failed");
  }
}

export default dbConnect;
