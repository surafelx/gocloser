import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOCK_USER_ID } from "./dev-mock-user";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = "7d"; // Token expires in 7 days

// Types
export interface JwtPayload {
  userId: string;
  id?: string; // Added for compatibility
  email: string;
  name: string;
}

// Generate JWT token
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Set auth token in cookies
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Get auth token from cookies
export function getAuthToken(request: NextRequest): string | undefined {
  return request.cookies.get("auth_token")?.value;
}

// Clear auth token from cookies
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

// Get current user from token
export function getCurrentUser(request: NextRequest): JwtPayload | null {
  const token = getAuthToken(request);

  // For development: if no token is present, return a mock user
  if (!token && process.env.NODE_ENV !== "production") {
    console.log('Using mock user for development');
    return {
      id: MOCK_USER_ID, // Mock ObjectId
      userId: MOCK_USER_ID, // Mock ObjectId (for backward compatibility)
      email: "test@example.com",
      name: "Test User",
    };
  }

  if (!token) return null;
  return verifyToken(token);
}

// Set auth token in cookies (for client-side)
export function setClientAuthCookie(token: string): void {
  document.cookie = `auth_token=${token}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Strict; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
}

// Clear auth token from cookies (for client-side)
export function clearClientAuthCookie(): void {
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict;";
}

// Get auth token from server-side cookies
export function getServerAuthToken(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get("auth_token")?.value;
}

// Get current user from server-side token
export function getServerCurrentUser(): JwtPayload | null {
  const token = getServerAuthToken();

  // For development: if no token is present, return a mock user
  if (!token && process.env.NODE_ENV !== "production") {
    return {
      id: MOCK_USER_ID, // Mock ObjectId
      userId: MOCK_USER_ID, // Mock ObjectId (for backward compatibility)
      email: "test@example.com",
      name: "Test User",
    };
  }

  if (!token) return null;
  return verifyToken(token);
}
