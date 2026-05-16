# POS Frontend

Next.js web app for the POS system: authentication, point-of-sale, inventory, analytics, and admin dashboards. It talks to the backend API over HTTP.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm (included with Node.js)
- A running instance of the POS backend API

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Environment files are **not** committed to this repository (including `.env.example`). Create a local file named `.env.local` in the project root:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the POS backend (no trailing slash) | `http://127.0.0.1:8000` |

Restart the dev server after changing environment variables.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  api/           # API client and endpoint modules
  app/           # Next.js App Router pages and layouts
  components/    # UI, POS, auth, admin, and shared components
  lib/           # Utilities and helpers
  stores/        # Zustand state (auth, workspace)
  wrappers/      # Page-level composition wrappers
public/          # Static assets
```

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Zustand](https://zustand.docs.pmnd.rs/) for client state
- [Radix UI](https://www.radix-ui.com/) primitives

## Production build

```bash
npm run build
npm run start
```

Set `NEXT_PUBLIC_API_BASE_URL` to your production API URL in the deployment environment (e.g. Vercel project settings).
