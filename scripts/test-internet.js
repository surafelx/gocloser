// Simple script to test internet connectivity
const https = require('https');

console.log('Testing internet connectivity...');

// Test connection to Google
const testGoogle = new Promise((resolve, reject) => {
  https.get('https://www.google.com', (res) => {
    console.log(`Google: Status code: ${res.statusCode}`);
    resolve(true);
  }).on('error', (err) => {
    console.error(`Google: Error: ${err.message}`);
    resolve(false);
  });
});

// Test connection to MongoDB Atlas
const testMongoDB = new Promise((resolve, reject) => {
  https.get('https://cloud.mongodb.com', (res) => {
    console.log(`MongoDB Atlas: Status code: ${res.statusCode}`);
    resolve(true);
  }).on('error', (err) => {
    console.error(`MongoDB Atlas: Error: ${err.message}`);
    resolve(false);
  });
});

// Run all tests
Promise.all([testGoogle, testMongoDB])
  .then(results => {
    const [googleOk, mongoOk] = results;
    
    console.log('\nTest Results:');
    console.log(`Google: ${googleOk ? 'OK' : 'FAILED'}`);
    console.log(`MongoDB Atlas: ${mongoOk ? 'OK' : 'FAILED'}`);
    
    if (googleOk && mongoOk) {
      console.log('\nInternet connectivity looks good.');
      console.log('The MongoDB connection issue might be related to:');
      console.log('1. Incorrect connection string');
      console.log('2. Firewall or network restrictions');
      console.log('3. MongoDB Atlas server issues');
      console.log('4. IP address not whitelisted in MongoDB Atlas');
    } else if (!googleOk && !mongoOk) {
      console.log('\nGeneral internet connectivity issue detected.');
      console.log('Please check your network connection.');
    } else {
      console.log('\nPartial connectivity issue detected.');
      console.log('Some services are reachable while others are not.');
    }
  })
  .catch(err => {
    console.error('Error running tests:', err);
  });
