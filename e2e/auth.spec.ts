import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Check that the page contains login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    // Navigate to the signup page
    await page.goto('/signup');
    
    // Check that the page contains signup form elements
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('shows validation errors for invalid inputs', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Submit the form without filling in any fields
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check that validation errors are displayed
    await expect(page.getByText(/email is required/i)).toBeVisible();
    
    // Fill in an invalid email
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check that email validation error is displayed
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('redirects to chat page after successful login', async ({ page }) => {
    // This test would require mocking the authentication API
    // For now, we'll just check the redirect behavior
    
    // Navigate to the login page
    await page.goto('/login');
    
    // Fill in valid credentials (these would need to be test credentials)
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    
    // Intercept the API call and mock a successful response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          success: true,
          user: { 
            id: '123', 
            name: 'Test User', 
            email: 'test@example.com' 
          }
        })
      });
    });
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check that we're redirected to the chat page
    // This might need to be adjusted based on your actual redirect behavior
    await expect(page).toHaveURL(/\/chat/);
  });

  test('Google authentication button is present', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Check that the Google authentication button is present
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});
