# Booking Platform API

A REST API for managing business services and customer bookings, built with NestJS, PostgreSQL, and Drizzle ORM.

The API allows authenticated users to manage services while enabling customers to create bookings without requiring an account. It exposes a documented REST interface secured with JWT authentication and is designed to support containerized development and deployment.

## Architecture

```
 +--------------------+
 |       Client       |
 +---------+----------+
           |
      HTTPS / REST
           |
 +---------v----------+
 |      NestJS API     |
 |                     |
 |     Controllers     |
 |      Services       |
 |   Authentication    |
 +---------+----------+
           |
       Drizzle ORM
           |
 +---------v----------+
 |     PostgreSQL      |
 +--------------------+
```

## Technology Stack

| Component | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Authentication | JWT (Access & Refresh Tokens) |
| Authorization | Passport.js |
| Validation | class-validator, class-transformer |
| API Documentation | Swagger (OpenAPI) |
| Containerization | Docker & Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20 or later
- pnpm
- Docker & Docker Compose (recommended)

A local PostgreSQL installation may be used instead of Docker.

### Quick Start (Local Development)

The full sequence to get the API running locally, end to end:

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd booking-api-EN2H
pnpm install

# 2. Set up environment variables
cp .env.example .env
# then edit .env and fill in real values (see Configuration below)

# 3. Start PostgreSQL (Docker)
docker compose up -d postgres

# 4. Apply database migrations
pnpm run db:migrate

# 5. Start the API in watch mode
pnpm run start:dev
```

The API is now running at `http://localhost:3000`, with interactive docs at `http://localhost:3000/api-docs`.

Each step is explained in more detail below.

### Installation

```bash
git clone <repository-url>
cd booking-api-EN2H
pnpm install
```

### Configuration

Create a local environment file.

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Application port |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |

Generate secure JWT secrets:

```bash
openssl rand -base64 32
```

## Database

### Start PostgreSQL

Using Docker:

```bash
docker compose up -d postgres
```

Alternatively, configure a local PostgreSQL instance that matches the values in `.env`.

### Run Migrations

```bash
pnpm run db:migrate
```

Generate a new migration after modifying the schema:

```bash
pnpm run db:generate
```

## Running the Application

### Development

For day-to-day development, run PostgreSQL in Docker but the API natively — this gives the fastest feedback loop (instant hot-reload on file changes), which a fully Dockerized API doesn't provide as quickly.

```bash
docker compose up -d postgres   # database only
pnpm run start:dev              # API runs natively on your machine
```

The API will be available at `http://localhost:3000`.

### Docker (full stack)

To run both the database and the API in containers — useful for verifying the production-style build, or if you don't want Node.js installed locally at all:

```bash
docker compose up --build
```

This command builds the application image, starts PostgreSQL, waits for it to be healthy, applies database migrations automatically, and launches the API — all in one command.

**Note:** if you already have the API running locally via `pnpm run start:dev`, stop it first (or stop the local process) before running this, since both will try to use port 3000.

### Production

```bash
pnpm run build
pnpm run start:prod
```

## API Documentation

Swagger UI is available once the application is running.

```
http://localhost:3000/api-docs
```

Use the **Authorize** button and provide the access token returned by `POST /auth/login` to access protected endpoints.

## Authentication

Authentication is based on JWT access and refresh tokens.

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Register a new user |
| `POST /auth/login` | Authenticate a user and receive access and refresh tokens |
| `POST /auth/refresh` | Exchange a refresh token for a new access token |

Protected endpoints require the following header:

```
Authorization: Bearer <access_token>
```

## API Overview

### Services

| Method | Endpoint | Access |
|---|---|---|
| POST | `/services` | Protected |
| GET | `/services` | Public |
| GET | `/services/:id` | Public |
| PATCH | `/services/:id` | Protected |
| DELETE | `/services/:id` | Protected |

### Bookings

| Method | Endpoint | Access |
|---|---|---|
| POST | `/bookings` | Public |
| GET | `/bookings` | Protected |
| GET | `/bookings/:id` | Public |
| PATCH | `/bookings/:id/status` | Protected |
| PATCH | `/bookings/:id/cancel` | Protected |

## Core Functionality

- JWT authentication using access and refresh tokens
- CRUD operations for services
- Customer booking workflow
- Booking status transitions
- Search, filtering, and pagination
- Duplicate booking prevention
- Optimistic concurrency control for booking status updates
- Request validation
- OpenAPI documentation

## Project Structure

```
src/
├── auth/          # Authentication
├── bookings/       # Booking management
├── services/        # Service management
├── database/          # Database schema and connection
├── common/              # Shared utilities, DTOs and exception handling
├── app.controller.ts
└── main.ts

drizzle/
└── migrations/
```

## Design Decisions

### Service Ownership

Services store the creator's identifier, although ownership restrictions are not currently enforced. Any authenticated user can manage services.

### Booking Access

Creating a booking and retrieving an individual booking are public operations. Listing and managing bookings require authentication.

### Booking State Model

Booking status transitions follow a controlled workflow. Both `PENDING` and `CONFIRMED` bookings may be cancelled; `CANCELLED` and `COMPLETED` are terminal states.

```
PENDING → CONFIRMED → COMPLETED
   │           │
   └───→ CANCELLED ←───┘
```

### Identifier Strategy

UUIDs are used for all primary keys instead of sequential identifiers.

### Referential Integrity

Services with associated bookings cannot be deleted, preserving booking history.

### Authentication Strategy

The API uses symmetric JWT signing (HS256) with separate secrets for access and refresh tokens.

### Refresh Tokens

Refresh tokens remain valid until expiration and are not currently revocable.

## Current Limitations

- Service ownership is not enforced.
- The `isActive` field on services is not used when creating bookings.
- Refresh tokens cannot be revoked before expiration.
- Role-based authorization is not implemented.

## Roadmap

Planned improvements include:

- Role-based access control
- Service ownership enforcement
- Refresh token revocation
- Rate limiting for authentication and booking endpoints
- Expanded automated test coverage
- Relevance-based search ranking

## License

This project is privately licensed and was developed as part of a technical assessment. It is not currently published under an open-source license.
