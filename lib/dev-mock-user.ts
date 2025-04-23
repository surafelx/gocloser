import mongoose from 'mongoose';
import User from '@/models/User';
import dbConnect from './mongoose';

// Mock user ID
export const MOCK_USER_ID = '6450f0c1f90821e8e4b5b293';

/**
 * Ensures a mock user exists in the database for development purposes
 * This is useful for testing without authentication
 */
export async function ensureMockUserExists() {
  // Only run in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  try {
    // Connect to the database
    await dbConnect();

    // Check if the mock user already exists
    let user = await User.findById(MOCK_USER_ID);

    // If the user doesn't exist, create it
    if (!user) {
      try {
        // Convert string ID to MongoDB ObjectId
        const objectId = new mongoose.Types.ObjectId(MOCK_USER_ID);
        
        user = await User.create({
          _id: objectId,
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123', // This will be hashed by the pre-save hook
        });
        console.log('Created mock user for development');
      } catch (err) {
        console.error('Error creating mock user:', err);
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('Error ensuring mock user exists:', error);
    return null;
  }
}

/**
 * Gets the mock user from the database
 * This is useful for testing without authentication
 */
export async function getMockUser() {
  // Only run in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Ensure the mock user exists
  const user = await ensureMockUserExists();
  return user;
}
