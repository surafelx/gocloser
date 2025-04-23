# MongoDB Setup Guide

This guide will help you set up a MongoDB database for the GoCloser application.

## Option 1: MongoDB Atlas (Recommended)

MongoDB Atlas is a fully-managed cloud database service that makes it easy to set up, operate, and scale MongoDB deployments.

### Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account

### Step 2: Create a Cluster

1. After signing in, click "Build a Database"
2. Choose the "FREE" tier
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure) and region
4. Click "Create Cluster" (this may take a few minutes)

### Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (make sure to remember these)
5. Set "Database User Privileges" to "Atlas admin"
6. Click "Add User"

### Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. To allow access from anywhere (for development), click "Allow Access from Anywhere"
4. Click "Confirm"

### Step 5: Get Your Connection String

1. In the left sidebar, click "Database" under "Deployments"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as your driver and the appropriate version
5. Copy the connection string
6. Replace `<password>` with your database user's password
7. Replace `<dbname>` with a name for your database (e.g., "gocloser")

### Step 6: Add the Connection String to Your .env.local File

1. Open the `.env.local` file in your project
2. Add or update the `MONGODB_URI` variable with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gocloser?retryWrites=true&w=majority
   ```

## Option 2: Local MongoDB Installation

If you prefer to run MongoDB locally:

### Step 1: Install MongoDB Community Edition

Follow the [official MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-community/) for your operating system.

### Step 2: Start MongoDB

Start the MongoDB service according to your operating system's instructions.

### Step 3: Add the Connection String to Your .env.local File

1. Open the `.env.local` file in your project
2. Add or update the `MONGODB_URI` variable:
   ```
   MONGODB_URI=mongodb://localhost:27017/gocloser
   ```

## Troubleshooting MongoDB Connection Issues

If you're experiencing connection issues:

1. **Check your connection string**: Make sure it's correctly formatted and includes your username, password, and database name.

2. **Network issues**: Ensure your IP address is allowed in the MongoDB Atlas Network Access settings.

3. **Timeout issues**: The application is configured with the following connection options to handle timeouts:
   - `serverSelectionTimeoutMS`: 10000 (10 seconds)
   - `socketTimeoutMS`: 45000 (45 seconds)
   - `maxPoolSize`: 10 connections

4. **Check MongoDB Atlas status**: Visit the [MongoDB Status page](https://status.mongodb.com/) to see if there are any ongoing issues with the service.

5. **Firewall issues**: Make sure your firewall isn't blocking outgoing connections to MongoDB Atlas.

6. **VPN interference**: If you're using a VPN, try disconnecting it as it might interfere with the connection.

If you continue to experience issues, please check the server logs for more detailed error messages.
