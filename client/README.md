# CV Builder

CV Builder is a web application for maintaining employee profiles and creating CVs. Employees can organize their skills and experience, build a CV, preview it and export it as a PDF. Administrators manage the employee directory, CVs and the catalogs shared across the application.

## What the application does

| Area | Features |
| --- | --- |
| Accounts | Sign up, sign in, email verification, password recovery and password changes. |
| Employees | Search and sort the employee directory; open profiles to view contact details, skills and languages. |
| Profiles | Update names, department, position, avatar, skills and language proficiency. |
| CVs | Create and edit CV details, add skills and projects, preview the result and export a PDF. |
| Administration | Create, update and delete employees; manage CVs for a selected employee and the skills, languages, departments, positions and projects catalogs. |
| Settings | Choose a light, dark or device theme and change the account password. |

The application has **Employee** and **Admin** roles. Employees can edit their own profile and CVs and view other employees' profiles. Administrators can manage employee profiles, CVs and shared catalogs. The interface supports desktop and tablet layouts.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| GraphQL and state | Apollo Client, `@apollo/client-integration-nextjs`, Redux Toolkit |
| Backend | NestJS, GraphQL, TypeORM, PostgreSQL |
| PDF export | Server-side Chromium export with a browser-side `html2pdf.js` fallback |
| Tests | Vitest, React Testing Library, user-event, jsdom |

The repository contains the frontend in `client/` and the API in `server/`. The frontend uses GraphQL for application data operations.

## Run locally

You need Node.js 22.12 or newer, npm, pnpm 10 and Docker Desktop with Docker Compose.

1. Configure the API environment files following [server/README.md](server/README.md). Start the API and PostgreSQL from `server/`:

   ```sh
   pnpm install --frozen-lockfile
   pnpm run image:up
   ```

2. Install and configure the frontend from `client/`:

   ```sh
   npm ci
   cp .env.example .env.local
   npm run dev
   ```

3. Open <http://localhost:3000>. The GraphQL API is available at <http://localhost:3001/api/graphql>.

The frontend example sets `NEXT_PUBLIC_GRAPHQL_URL` to the local API URL. Restart the development server after changing `.env.local`. Variables with the `NEXT_PUBLIC_` prefix are sent to the browser; do not put secrets in them.

Signup, verification and password recovery require working SMTP settings on the API. Avatar uploads require Cloudinary. Server-side PDF export uses a browser service; the frontend can fall back to local browser export. Configuration details are in [server/README.md](server/README.md).

The bundled database backup is optional. Run `pnpm run backup` from `server/` after the containers are running to load sample data. **This replaces existing data in the local database.** A fresh database can be used through signup instead.

## Project structure

```text
client/
  src/app/          Routes, layouts and providers
  src/components/   Pages and reusable UI
  src/lib/          GraphQL operations, authentication and shared state
  .env.example      Frontend environment template
server/
  src/             GraphQL API and domain modules
  docker/          Docker Compose configuration
  backups/         Optional local database backup
```

Frontend routes are grouped into `(auth)` for public account pages and `(app)` for signed-in pages. Administrative pages are under `/admin`.

## Commands and checks

Run frontend commands from `client/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run test` | Run unit and component tests |
| `npm run test:coverage` | Generate a coverage report in `client/coverage/` |

Run `pnpm run lint`, `pnpm run typecheck` and `pnpm run build` from `server/` to check the API. Frontend tests are colocated with their source as `*.test.ts` and `*.test.tsx`.

## Troubleshooting

- **The app reports a network error:** check that the API is running, confirm `NEXT_PUBLIC_GRAPHQL_URL` in `client/.env.local`, and restart the frontend.
- **Verification or recovery email does not arrive:** check the SMTP settings in `server/docker/.env.cv_backend` and the spam folder.
- **Port 3000 is occupied:** start the frontend with `npm run dev -- -p 3002` and open <http://localhost:3002>. Port 3001 is reserved for the local API.
