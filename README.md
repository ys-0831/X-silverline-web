# Silverline Health — starter application

A Next.js 16 application for a fictional Brisbane general practice, with a
floating assistant backed by the Salesforce Agentforce Agent API and a patient
complaint form that writes to a custom Salesforce object.

## Quick start

```bash
npm install
cp .env.example .env.local        # then fill in your Salesforce values
npm run check                     # verifies the agent connection
npm run describe:complaint        # prints your Complaint object schema
npm run dev
```

See **Silverline-Installation-and-Deployment** for the full walkthrough,
including Salesforce setup and Vercel deployment.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run check` | Validate `.env.local` and test the agent connection |
| `npm run describe:complaint` | Print the Complaint object's real field API names |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Where things live

- `lib/site-data.ts` — all page content
- `lib/sf-auth.ts` — OAuth and the Agent API client (server only)
- `lib/salesforce-rest.ts` — REST Data API client for record writes
- `lib/complaint-schema.ts` — **the only file with org-specific field names**
- `app/api/agent/*` — chat routes the browser calls
- `app/api/complaints/` — complaint submission route
- `app/globals.css` — design tokens

## Note

Silverline Health is fictional. Every clinic, practitioner, appointment time and
phone number in `lib/site-data.ts` is invented for teaching purposes.
