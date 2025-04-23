import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test('loads and displays analytics dashboard', async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('/analytics');
    
    // Check that the page title contains expected text
    await expect(page).toHaveTitle(/Analytics/);
    
    // Check that the main analytics components are displayed
    await expect(page.getByText('Performance Trends')).toBeVisible();
  });

  test('displays performance metrics', async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('/analytics');
    
    // Check that the overall score is displayed
    await expect(page.getByText(/Overall Score/)).toBeVisible();
    
    // Check that the metrics tab is available
    await page.getByRole('tab', { name: 'Metrics' }).click();
    
    // Verify that metrics content is displayed
    await expect(page.getByText(/Engagement|Objection Handling|Closing Techniques/)).toBeVisible();
  });

  test('allows filtering by time period', async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('/analytics');
    
    // Find and click the time filter dropdown
    await page.getByRole('combobox').click();
    
    // Select a different time period
    await page.getByRole('option', { name: 'Last 7 days' }).click();
    
    // Verify the filter was applied (this would depend on your UI implementation)
    await expect(page.getByText('Last 7 days')).toBeVisible();
  });

  test('displays content analysis', async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('/analytics');
    
    // Click on the content analysis tab
    await page.getByRole('tab', { name: 'Content Analysis' }).click();
    
    // Verify that content analysis is displayed
    await expect(page.getByText(/Content Type Analysis/)).toBeVisible();
    
    // Check that the different content types are displayed
    await expect(page.getByText(/Audio Content|Video Content|Text Content/)).toBeVisible();
  });
});
