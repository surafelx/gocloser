# Training Materials

This folder contains PDF training materials that are used by the AI assistant to provide better and more context-aware responses.

## How it works

1. PDF files in this folder are processed on the server side
2. Text is extracted and stored in a structured format
3. When users ask questions, relevant content from these PDFs is used to enhance AI responses
4. No PDFs are processed on the client side for better security and performance

## Adding new training materials

1. Simply add new PDF files to this folder
2. Run the processing script to update the training data:
   ```
   node scripts/process-training-pdfs.js
   ```
3. Alternatively, call the API endpoint to refresh the training data:
   ```
   POST /api/training/refresh
   ```

## Viewing processed training data

The processed training data is stored in:
```
data/training-documents.json
```

You can also view metadata about the training documents via the API:
```
GET /api/training/documents
```

To view a specific document:
```
GET /api/training/documents/{id}
```

## Categories

The system automatically categorizes PDFs based on their filenames:

- Files containing "script" → scripts
- Files containing "closing" → closing
- Files containing "interview" → interview
- Files containing "intelligence" → intelligence
- Files containing "preparation" → preparation
- Other files → general

## Security

- PDFs are processed on the server side only
- Original PDFs are not exposed to clients
- Only processed text content is used by the AI assistant
