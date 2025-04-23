# Testing Guide for Sales AI

This document outlines the testing strategy and procedures for the Sales AI application.

## Testing Strategy

The Sales AI application uses a comprehensive testing approach that includes:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Testing complete user flows through the application
4. **Accessibility Tests**: Ensuring the application is accessible to all users
5. **Performance Tests**: Ensuring the application performs well under load

## Test Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher

### Installing Dependencies

```bash
npm install
```

## Running Tests

### Unit and Integration Tests with Jest

Run all tests:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

The coverage report will be available in the `coverage` directory.

### End-to-End Tests with Playwright

Run all E2E tests:

```bash
npm run test:e2e
```

Run E2E tests with UI:

```bash
npm run test:e2e:ui
```

View the E2E test report:

```bash
npm run test:e2e:report
```

## Test Structure

### Unit and Integration Tests

Unit and integration tests are located in the `__tests__` directory, which mirrors the structure of the application code:

- `__tests__/components`: Tests for React components
- `__tests__/hooks`: Tests for custom React hooks
- `__tests__/lib`: Tests for utility functions and libraries

### End-to-End Tests

End-to-end tests are located in the `e2e` directory and are organized by feature:

- `e2e/chat.spec.ts`: Tests for the chat functionality
- `e2e/analytics.spec.ts`: Tests for the analytics functionality
- `e2e/auth.spec.ts`: Tests for the authentication functionality
- `e2e/billing.spec.ts`: Tests for the billing functionality

## Writing Tests

### Unit Tests for Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('My Component')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const onClickMock = jest.fn();
    render(<MyComponent onClick={onClickMock} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalled();
  });
});
```

### End-to-End Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can log in and access the chat', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');
  
  // Fill in the login form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Check that we're redirected to the chat page
  await expect(page).toHaveURL('/chat');
  
  // Check that the chat interface is displayed
  await expect(page.getByText('AI Assistant')).toBeVisible();
});
```

## Continuous Integration

The application uses GitHub Actions for continuous integration. The CI pipeline runs on every push to the main branch and on every pull request.

The CI pipeline includes:

1. Linting
2. Unit and integration tests
3. End-to-end tests
4. Building the application

## Best Practices

1. **Test Coverage**: Aim for at least 80% test coverage for critical components and functionality.
2. **Test Isolation**: Each test should be independent and not rely on the state from other tests.
3. **Mock External Dependencies**: Use mocks for external dependencies like APIs and databases.
4. **Test Edge Cases**: Include tests for edge cases and error conditions.
5. **Keep Tests Fast**: Unit and integration tests should run quickly to provide fast feedback.
6. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.
7. **Follow AAA Pattern**: Arrange, Act, Assert - structure tests in this way for clarity.

## Troubleshooting

### Common Issues

1. **Tests Failing Due to Timeouts**: Increase the timeout value in the test configuration.
2. **Tests Failing Due to Missing Dependencies**: Make sure all dependencies are installed.
3. **Tests Failing Due to Environment Variables**: Make sure all required environment variables are set.

### Getting Help

If you encounter issues with the tests, please:

1. Check the error message and stack trace
2. Check the test logs
3. Search for similar issues in the project's issue tracker
4. Ask for help in the project's communication channels
