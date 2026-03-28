# Truth N Dare Backend

Express + MongoDB + Socket.IO backend for the Truth N Dare app.

## Highlights

- JWT access and refresh token flow
- Guest session support
- Room creation and join APIs
- Room-scoped Socket.IO events for chat, leader-controlled spins, truth/dare choices, round history, and room updates
- Centralized error handling and health endpoint
- Render deployment blueprint included

## Environment

Copy [`.env.example`](/Users/kunjghevariya/Desktop/git1/TruthNdare-backend/.env.example) to `.env` and update the values:

```bash
cp .env.example .env
```

Required variables:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `ALLOWED_ORIGINS`

## Local development

```bash
npm install
npm run dev
```

Production start:

```bash
npm run start
```

## API surface

- `GET /api/v1/health`
- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `POST /api/v1/users/guest`
- `POST /api/v1/users/refresh-token`
- `POST /api/v1/users/logout`
- `POST /api/v1/room/create`
- `POST /api/v1/room/join`
- `POST /api/v1/room/leave`
- `GET /api/v1/room/showroom?code=ROOM_CODE`

## Live game events

The active multiplayer game flow is socket-driven rather than REST-driven:

- `joinRoom`
- `sendMessage`
- `start`
- `countdown`
- `rotateWheel`
- `chooseTruthOrDare`
- `challengeUpdated`
- `resetRound`
- `roomUpdated`

## Deployment

Render blueprint:

- [`render.yaml`](/Users/kunjghevariya/Desktop/git1/TruthNdare-backend/render.yaml)

## Verification completed

Backend source syntax checked with:

```bash
find src -name '*.js' -print0 | xargs -0 -n1 node --check
```
