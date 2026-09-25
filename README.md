# CV Builder

Frontend for creating and managing CVs. The application is at the initial setup stage; CV screens and GraphQL operations will be added as the team implements the requirements and reviews the design.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Redux Toolkit and React Redux for shared mutable UI state
- Apollo Client and GraphQL for backend data
- Vitest and React Testing Library for unit and component tests

## Requirements

- Node.js 22.12 or newer
- npm
- Local [CV Builder API](https://github.com/innowise-frontend/cv-backend) for GraphQL features

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and adjust `NEXT_PUBLIC_GRAPHQL_URL` if the API uses another address. The API README currently specifies `http://localhost:3001/api/graphql`.
3. Run `npm run dev` and open `http://localhost:3000`.

`.env.local` is ignored by Git. Do not place secrets in `NEXT_PUBLIC_` variables; those values are exposed to the browser.

## Checks

- `npm run lint` checks the source with ESLint.
- `npm run typecheck` checks TypeScript.
- `npm run test` runs unit and component tests once.
- `npm run test:coverage` produces the coverage report.
- `npm run build` checks the production build.

## Project structure

- `src/app`: routes, layout and app providers
- `src/lib`: Redux store and UI state
- `vitest.config.mts`: test runner setup

## Current status

The frontend scaffold and GraphQL client are configured. The backend connection, authorization flow, application screens, and API operations still need to be implemented and tested with the locally running API. A UI component library is still to be agreed with the mentor; Tailwind CSS supplies styling utilities rather than ready-made UI components.
