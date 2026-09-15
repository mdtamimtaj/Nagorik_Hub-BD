# Nagorik Hub — AI User Update Workflow

## Flow
User report → matching report count → AI web verification → Green Flag → Admin approval → publish.

### Market prices
DAM/other automated sources remain the primary price. Approved user-reported price is displayed separately underneath the automatic price.

### Bus fare
The user-reported fare is displayed only after Admin approval. AI Green Flag alone never publishes a bus fare.

## Demo mode
`update-info.html` and `admin.html` work locally using browser `localStorage`. This is useful for testing the UI, but it is not shared between users.

## Real multi-user mode
Use a shared database (the included `supabase/schema.sql` is the starting schema) and connect the frontend to it. The AI endpoint is `api/verify-update.js`; deploy it as a serverless function and set `OPENAI_API_KEY` as a server-side environment variable. Never put that key in frontend JavaScript.

The AI endpoint uses the Responses API web search tool to check public sources before assigning a Green Flag. Admin remains the final publisher.
