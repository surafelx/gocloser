# Server-Side PDF Processing for Training Materials

This document explains how to use the server-side PDF processing system for training materials.

## Overview

The system processes PDF files from the `training` folder and makes their content available to the Gemini AI assistant. This allows the AI to provide better and more context-aware responses based on your training materials.

## Setup

1. Install the required dependencies:
   ```bash
   npm run install:pdf-deps
   ```

2. Process the training PDFs:
   ```bash
   npm run process:training
   ```

## How It Works

1. PDF files in the `training` folder are processed on the server side
2. Text is extracted and stored in a structured format in `data/training-documents.json`
3. When users ask questions, the system enhances Gemini's prompts with relevant content from the training materials
4. No PDFs are processed on the client side for better security and performance

## API Endpoints

### Refresh Training Data

```
POST /api/training/refresh
```

This endpoint reprocesses all PDFs in the training folder and updates the training data.

### Get Training Documents

```
GET /api/training/documents
```

This endpoint returns metadata about all processed training documents.

Query parameters:
- `category`: Filter documents by category
- `query`: Search documents by title or content

### Get Training Document by ID

```
GET /api/training/documents/{id}
```

This endpoint returns a specific training document by ID.

## Adding New Training Materials

1. Add new PDF files to the `training` folder
2. Run the processing script:
   ```bash
   npm run process:training
   ```
3. Alternatively, call the API endpoint:
   ```
   POST /api/training/refresh
   ```

## Categories

The system automatically categorizes PDFs based on their filenames:

- Files containing "script" → scripts
- Files containing "closing" → closing
- Files containing "interview" → interview
- Files containing "intelligence" → intelligence
- Files containing "preparation" → preparation
- Other files → general

## Implementation Details

- `lib/pdf-processor.ts`: Handles PDF processing and document management
- `lib/training-data-loader.ts`: Loads and formats training data for the AI
- `lib/gemini.ts`: Integrates training data with Gemini API
- `app/api/training/*`: API endpoints for training data management

## Security Considerations

- PDFs are processed on the server side only
- Original PDFs are not exposed to clients
- Only processed text content is used by the AI assistant
- API endpoints are protected with authentication
