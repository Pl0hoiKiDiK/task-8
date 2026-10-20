# CV Builder frontend

Next.js frontend for the CV Builder application. The app includes authentication and email verification, employee profiles, skills and languages, CV editing and PDF preview, and administrator screens for employees and catalogs. Data operations use the local GraphQL API through Apollo Client; Redux Toolkit stores session and interface state.

## Setup

Requires Node.js 22.12 or newer and a running local API. See the [repository README](../README.md) for backend setup.

```sh
npm install
```

Copy `.env.example` to `.env.local`. By default, `NEXT_PUBLIC_GRAPHQL_URL` points to `http://localhost:3001/api/graphql`.

```sh
npm run dev
```

Open `http://localhost:3000`.

## Checks

```sh
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

Tests use Vitest and React Testing Library. They are colocated with source files as `*.test.ts` and `*.test.tsx`. The coverage report is written to `coverage/`. E2E tests are not included.

## Code layout

- `src/app`: routes, layouts and application providers
- `src/components`: screens and reusable interface elements
- `src/lib`: GraphQL operations, session handling, shared data helpers and Redux state

`NEXT_PUBLIC_` values are visible in the browser; do not put secrets in them.
