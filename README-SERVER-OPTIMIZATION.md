# Server-Side Optimization Guide

This document provides guidance on optimizing the application by moving components to the server side and reducing client-side JavaScript.

## Overview

Next.js 15 provides powerful server components that can significantly improve performance by reducing the amount of JavaScript sent to the client. This guide explains how we've optimized the application and how to continue this optimization.

## Server Components vs. Client Components

### Server Components
- Render on the server
- No JavaScript sent to the client
- Better performance and SEO
- Use for static content and data fetching

### Client Components
- Render on the client
- JavaScript sent to the client
- Use for interactive elements
- Must be marked with `'use client'` directive

## Optimizations Implemented

1. **Server-Only Modules**
   - Added `server-only` import to server-only modules
   - Prevents accidental client-side imports

2. **Server Actions**
   - Created server actions for data fetching and processing
   - Moved PDF processing to server actions
   - Implemented training data processing on the server

3. **Component Splitting**
   - Split components into server and client parts
   - Created client-only components for interactive elements
   - Moved static rendering to server components

4. **API Optimization**
   - Streamlined API routes to use server actions
   - Reduced duplicate code between API routes and server actions

## How to Continue Optimization

1. **Identify Client Components**
   - Look for components that use React hooks, event handlers, or browser APIs
   - Mark these with `'use client'` directive

2. **Create Server Components**
   - Move data fetching and static rendering to server components
   - Use server components for layout and structure

3. **Use Server Actions**
   - Create server actions for data mutations
   - Use server actions for form submissions

4. **Optimize Data Loading**
   - Use React Suspense for loading states
   - Implement streaming for large data sets

## Best Practices

1. **Component Structure**
   - Keep client components small and focused
   - Use server components for as much as possible
   - Nest client components inside server components

2. **Data Fetching**
   - Fetch data on the server whenever possible
   - Use server actions for mutations
   - Implement proper caching strategies

3. **State Management**
   - Keep state as close to where it's used as possible
   - Use server components to avoid unnecessary client state
   - Consider server-side state management for complex apps

4. **Performance Monitoring**
   - Use Next.js Analytics to monitor performance
   - Check bundle sizes regularly
   - Test on low-end devices and slow networks

## Example: Converting a Component

### Before (Client Component)
```tsx
// Component that fetches and displays data
import { useState, useEffect } from 'react';

export default function DataComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);
  
  return <div>{data ? data.message : 'Loading...'}</div>;
}
```

### After (Server Component)
```tsx
// Server component that fetches data
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}

export default async function DataComponent() {
  const data = await getData();
  
  return <div>{data.message}</div>;
}
```

## Conclusion

By moving components to the server side and using server actions, we've significantly improved the performance of the application. Continue this optimization by identifying more opportunities to use server components and reduce client-side JavaScript.
