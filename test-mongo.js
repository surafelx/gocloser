const { MongoClient } = require('mongodb');

// Connection URL
const uri = "mongodb+srv://quikflixagency:y1OCgtYZkCKQpWE0@cluster0.xqqzmv8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    
    // Get the database
    const db = client.db("admin");
    
    // Ping to confirm connection
    await db.command({ ping: 1 });
    console.log("MongoDB connection verified with ping");
    
  } catch(err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log("MongoDB connection closed");
  }
}

run().catch(console.dir);
