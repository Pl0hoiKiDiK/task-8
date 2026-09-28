## Quick Start

Start the backend first, then the frontend.

### 1. Run the backend

Make sure Docker Desktop is running.

```sh
cd server
pnpm install
```

Create the two env files in `server/docker/` (`.env.cv_backend` and `.env.cv_postgres`). Their contents are listed in [server/README.md](server/README.md). Then start the containers and restore the database:

```sh
pnpm run image:up
pnpm run backup
```

When it finishes, the GraphQL API is available at http://localhost:3001/api/graphql

### 2. Run the frontend

In a new terminal, from the repository root:

```sh
cd client
npm install
copy .env.example .env.local   # macOS/Linux: cp .env.example .env.local
npm run dev
```

The application opens at http://localhost:3000. `NEXT_PUBLIC_GRAPHQL_URL` in `.env.local` should point to http://localhost:3001/api/graphql.

## More information

- Backend setup, env variables, and optional services (Cloudinary, Browserless, SMTP): [server/README.md](server/README.md)
- Frontend scripts, checks, and project structure: [client/README.md](client/README.md)