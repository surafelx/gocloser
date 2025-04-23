import { test, expect } from '@playwright/test';

test.describe('Billing Page', () => {
  // This test assumes the user is already logged in
  // In a real test, you would need to handle authentication first
  
  test('loads and displays billing information', async ({ page }) => {
    // Navigate to the billing page
    await page.goto('/billing');
    
    // Check that the page title contains expected text
    await expect(page).toHaveTitle(/Billing/);
    
    // Check that the main billing components are displayed
    await expect(page.getByText('Current Plan')).toBeVisible();
    await expect(page.getByText('Available Plans')).toBeVisible();
  });

  test('displays subscription tabs correctly', async ({ page }) => {
    // Navigate to the billing page
    await page.goto('/billing');
    
    // Check that all tabs are available
    await expect(page.getByRole('tab', { name: 'Subscription' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Billing History' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Payment Methods' })).toBeVisible();
    
    // Click on the Billing History tab
    await page.getByRole('tab', { name: 'Billing History' }).click();
    
    // Verify that billing history content is displayed
    await expect(page.getByText('View your past invoices')).toBeVisible();
    
    // Click on the Payment Methods tab
    await page.getByRole('tab', { name: 'Payment Methods' }).click();
    
    // Verify that payment methods content is displayed
    await expect(page.getByText('Manage your payment methods')).toBeVisible();
  });

  test('displays available plans', async ({ page }) => {
    // Navigate to the billing page
    await page.goto('/billing');
    
    // Check that all plans are displayed
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Professional')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();
    
    // Check that plan features are displayed
    await expect(page.getByText(/Unlimited AI coaching sessions/)).toBeVisible();
  });

  test('allows changing subscription plan', async ({ page }) => {
    // Navigate to the billing page
    await page.goto('/billing');
    
    // Find and click a plan change button
    // This assumes there's a button to change to the Team plan
    const changePlanButton = page.getByRole('button', { name: 'Change Plan' }).filter({ has: page.getByText('Team') });
    await changePlanButton.click();
    
    // Mock the API response for plan change
    await page.route('**/api/billing/change-plan', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Plan changed successfully'
        })
      });
    });
    
    // Verify that a success message is displayed
    await expect(page.getByText(/Plan changed/)).toBeVisible();
  });
});
