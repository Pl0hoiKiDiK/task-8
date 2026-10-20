# CV Builder

CV Builder is a web application for maintaining employee profiles and creating CVs. Employees can manage their own profile, skills, languages, CVs and CV projects. Administrators can manage employees, CVs and the catalogs of projects, skills, languages, positions and departments. CVs can be previewed and exported as PDF.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Data and state: GraphQL, Apollo Client, Redux Toolkit
- Tests: Vitest and React Testing Library
- Local API: NestJS, GraphQL, PostgreSQL and TypeORM in Docker

The frontend is in `client/`; the local API is in `server/`. The API exposes GraphQL at `http://localhost:3001/api/graphql`. The application opens at `http://localhost:3000`.

## Requirements

- Node.js 22.12 or newer, npm and pnpm
- Docker Desktop for the local API and PostgreSQL
- Optional API services: Cloudinary for avatar uploads, Browserless for server-side PDF export, and SMTP for email flows. See [server/README.md](server/README.md) for configuration.

## Run locally

1. In `server/`, run `pnpm install`.
2. Create `server/docker/.env.cv_backend` and `server/docker/.env.cv_postgres` using the examples in [server/README.md](server/README.md).
3. In `server/`, run `pnpm run image:up` and then `pnpm run backup` to restore the sample database.
4. In `client/`, run `npm install` and copy `.env.example` to `.env.local`.
5. Set `NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/api/graphql` in `client/.env.local`.
6. In `client/`, run `npm run dev`.

## Frontend checks

Run these commands from `client/`:

```sh
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

Unit and component tests are colocated with the code as `*.test.ts` and `*.test.tsx`. `npm run test:coverage` writes an HTML report to `client/coverage/`. E2E tests are not part of this project.

Next.js prerenders static routes and renders dynamic routes on demand. Authenticated GraphQL data is requested by the client after session restoration.
