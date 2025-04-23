import { test, expect } from '@playwright/test';

test.describe('Chat Page', () => {
  test('loads and displays welcome message', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Check that the page title contains expected text
    await expect(page).toHaveTitle(/AI Sales Coach/);
    
    // Check that the welcome message is displayed
    const welcomeMessage = await page.getByText("Hi there! I'm your AI sales coach");
    await expect(welcomeMessage).toBeVisible();
  });

  test('allows sending a message and receives a response', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Type a message in the input field
    await page.getByPlaceholder(/Type your message/).fill('How do I handle price objections?');
    
    // Click the send button
    await page.getByRole('button', { name: /send/i }).click();
    
    // Wait for the user message to appear
    await expect(page.getByText('How do I handle price objections?')).toBeVisible();
    
    // Wait for the AI response (this may take some time)
    await page.waitForResponse(response => 
      response.url().includes('/api/gemini') && 
      response.status() === 200, 
      { timeout: 30000 }
    );
    
    // Check that an AI response is displayed
    const assistantResponse = await page.getByText(/AI Assistant/);
    await expect(assistantResponse).toBeVisible();
  });

  test('allows uploading a file', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Create a mock file
    const fileInput = await page.getByLabel('Upload file', { exact: false });
    
    // Upload a test file
    await fileInput.setInputFiles({
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test document for sales training.'),
    });
    
    // Check that the file preview is displayed
    await expect(page.getByText('test-document.txt')).toBeVisible();
  });

  test('shows suggested prompts for new users', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Check that suggested prompts are displayed
    const suggestedPrompts = await page.getByText('Suggested Questions');
    await expect(suggestedPrompts).toBeVisible();
    
    // Click on a suggested prompt
    await page.getByText('How can I improve my closing techniques?').click();
    
    // Check that the prompt is filled in the input
    const inputField = await page.getByPlaceholder(/Type your message/);
    await expect(inputField).toHaveValue('How can I improve my closing techniques?');
  });

  test('allows recording audio', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Click the microphone button to start recording
    await page.getByRole('button', { name: /mic/i }).click();
    
    // Check that recording UI is displayed
    await expect(page.getByText('Recording...')).toBeVisible();
    
    // Click the done button to stop recording
    await page.getByRole('button', { name: /done/i }).click();
    
    // Check that the audio player appears (this may require mocking browser APIs)
    // This is a simplified check - in a real test, you might need to mock the MediaRecorder API
    await expect(page.getByText(/recorded_audio/i)).toBeVisible();
  });
});
