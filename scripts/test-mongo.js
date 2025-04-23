// Simple script to test MongoDB connection
const mongoose = require('mongoose');

// Connection string - using the same one from your mongoose.ts file
const MONGODB_URI = "mongodb+srv://surafelx:XJrKBnaydO1gvC9S@gocloser.zafdlaw.mongodb.net/?retryWrites=true&w=majority&appName=gocloser";

// Connection options
const options = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
  socketTimeoutMS: 60000, // Increased socket timeout to 60 seconds
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maintain up to 10 socket connections
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 30000, // Connection timeout
  heartbeatFrequencyMS: 10000, // Check server status more frequently
};

console.log('Connecting to MongoDB...');
console.log(`Connection string: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, options)
  .then(() => {
    console.log('MongoDB connected successfully!');
    console.log(`Connection state: ${mongoose.connection.readyState}`);
    console.log(`Database name: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    
    // Close the connection
    return mongoose.disconnect();
  })
  .then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
