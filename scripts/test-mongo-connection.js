// Simple MongoDB connection test
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = "mongodb+srv://quikflixagency:y1OCgtYZkCKQpWE0@cluster0.xqqzmv8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log('Connecting to MongoDB...');
console.log(`Connection string: ${url.replace(/:[^:]*@/, ':****@')}`);

// Use connect method to connect to the server
MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
  if (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  console.log("MongoDB connection successful!");

  // Get the admin database
  const adminDb = client.db().admin();

  // List all databases
  adminDb.listDatabases(function(err, result) {
    if (err) {
      console.error('Error listing databases:', err);
      client.close();
      process.exit(1);
    }

    console.log("Databases:");
    result.databases.forEach(function(db) {
      console.log(` - ${db.name}`);
    });

    // Close the connection
    client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});
