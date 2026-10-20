# 🚀 Node.js Express + MongoDB Boilerplate (TypeScript)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-blue)

A production-ready, secure, and well-structured REST API boilerplate built with **TypeScript**, **Node.js**, **Express**, and **MongoDB (Mongoose)**. Implements JWT authentication, layered architecture with modular domain-specific interfaces, comprehensive security hardening, and a full CRUD sample API out of the box.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)
- [Architecture Flow](#-architecture-flow)
- [API Reference](#-api-reference)
- [Error Response Format](#-error-response-format)
- [Security Overview](#-security-overview)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 📘 **100% TypeScript** — Strict type safety, clean interfaces per service/domain, and custom type definitions
- 🔐 **JWT Authentication** — Stateless Bearer token auth with expiry
- 🛡️ **Security hardened** — Helmet, CORS, Rate Limiting, Mongo Sanitize, HPP
- 🏗️ **Layered architecture** — Route → Controller → Service → Model (strict separation)
- 📐 **Modular Interfaces** — Service & model interfaces decoupled into a dedicated `interfaces/` directory
- ✅ **Request validation** — Joi schema validation with detailed field errors
- 🌐 **Standardised responses** — Every success/error uses the same JSON envelope
- 📦 **Pagination** — Built-in on list endpoints
- 📋 **Structured logging** — Winston (coloured console + rotating log files)
- 🔄 **Graceful shutdown** — SIGTERM/SIGINT handling with connection cleanup
- ⚡ **Retry logic** — MongoDB reconnection with configurable attempts

---

## 🧰 Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.4 | Type safety & modern JS features |
| `express` | ^4.19 | HTTP framework |
| `mongoose` | ^8.4 | MongoDB ODM |
| `dotenv` | ^16 | Environment variable loading |
| `helmet` | ^7 | Secure HTTP headers |
| `cors` | ^2.8 | Cross-origin resource sharing |
| `express-rate-limit` | ^7 | IP-based rate throttling |
| `express-mongo-sanitize` | ^2.2 | NoSQL injection prevention |
| `hpp` | ^0.2 | HTTP parameter pollution guard |
| `joi` | ^17 | Request body schema validation |
| `jsonwebtoken` | ^9 | JWT signing and verification |
| `bcryptjs` | ^2.4 | Password hashing |
| `morgan` | ^1.10 | HTTP request logging |
| `winston` | ^3.13 | Application logging |
| `ts-node-dev` | ^2.0 | Dev hot-reloading server |

---

## 🔧 Prerequisites

- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- **MongoDB** — Local (`mongod`) or [Atlas](https://www.mongodb.com/atlas) cloud URI

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/backend-boilerplate.git
cd backend-boilerplate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

### 4. Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:5000`.

Verify it's running:
```bash
curl http://localhost:5000/health
# → { "status": "ok", "timestamp": "..." }
```

---

## ⚙️ Environment Variables

Copy `.env.example` → `.env` and set the following:

| Variable | Description | Example |
|---|---|---|
| `PORT` | HTTP port the server listens on | `5000` |
| `NODE_ENV` | Runtime environment | `development` \| `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/mydb` |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | `a_long_random_secret_string` |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` \| `1h` \| `15m` |
| `BCRYPT_ROUNDS` | Bcrypt hash cost (10–14 recommended) | `12` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist | `http://localhost:3000` |

> ⚠️ **Never commit `.env` to version control.** It is already excluded via `.gitignore`.

---

## 📁 Folder Structure

```
backend-boilerplate/
├── .env.example                     # 📝 Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json                    # ⚙️ TypeScript compiler configuration
├── README.md                        # 📖 Project documentation & developer guide
│
└── src/
    ├── server.ts                    # 🚪 Entry point — boots DB then HTTP server
    ├── app.ts                       # 🔧 Express app — wires all middleware & routes
    │
    ├── config/
    │   ├── db.ts                    # 🔌 MongoDB connection with retry logic
    │   └── env.ts                   # ✅ Validates required env vars on startup
    │
    ├── interfaces/                  # 📐 TypeScript interfaces organized by service/domain
    │   ├── index.ts                 #   Barrel export for all interfaces
    │   ├── auth.interface.ts        #   RegisterInput, LoginInput, AuthResult, JwtPayload
    │   ├── user.interface.ts        #   IUser, UserRole
    │   └── item.interface.ts        #   IItem, CreateItemInput, UpdateItemInput, Pagination
    │
    ├── types/                       # 🏷️ Global type definitions & augmentations
    │   └── index.d.ts               #   Express Request (req.user) type extension
    │
    ├── models/                      # 📊 Mongoose schemas & models
    │   ├── user.model.ts            #   User (name, email, hashed password, role)
    │   └── item.model.ts            #   Item (title, description, price, owner)
    │
    ├── controllers/                 # 🎮 HTTP layer — thin request/response handlers
    │   ├── auth.controller.ts       #   register, login
    │   └── item.controller.ts       #   getAllItems, getItemById, create, update, delete
    │
    ├── services/                    # 💼 Business logic layer
    │   ├── auth.service.ts          #   JWT signing, password hashing, register/login
    │   └── item.service.ts          #   CRUD operations scoped to authenticated owner
    │
    ├── routes/                      # 🛣️ Express routers
    │   ├── index.ts                 #   Central aggregator — mounts all routers
    │   ├── auth.routes.ts           #   /api/v1/auth/*
    │   ├── item.routes.ts           #   /api/v1/items/*
    │   └── schemas/                 # 📐 Joi validation schemas
    │       ├── auth.schema.ts       #   register & login schemas
    │       └── item.schema.ts       #   create & update item schemas
    │
    ├── middlewares/
    │   ├── auth.middleware.ts       # 🔐 JWT verification + role-based guard
    │   ├── validate.middleware.ts   # ✅ Joi validation factory
    │   ├── error.middleware.ts      # 🚨 Global error handler
    │   └── rateLimiter.ts           # 🚦 General + strict auth rate limiters
    │
    └── utils/
        ├── ApiError.ts              # ❌ Custom operational error class
        ├── ApiResponse.ts           # ✅ Standardised response envelope
        ├── asyncHandler.ts          # 🔄 Async try/catch wrapper for controllers
        └── logger.ts                # 📋 Winston logger (console + file)
```

---

## 🏗️ Architecture Flow

Every HTTP request flows through these layers in order:

```
                    ┌─────────────┐
                    │ HTTP Client │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │           Rate Limiter                   │
                    │      (express-rate-limit)                │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │       Security Middlewares               │
                    │  helmet · cors · mongoSanitize · hpp     │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │         Express Router                   │
                    │         /api/v1/...                      │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │       auth.middleware (JWT)              │
                    │  Verify Bearer token → attach req.user   │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │     validate.middleware (Joi)            │
                    │  Schema-validate & sanitise req.body     │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │           Controller                     │
                    │   (thin HTTP layer — no business logic)  │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │            Service                       │
                    │       (all business logic lives here)    │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │         Mongoose Model                   │
                    └──────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │            MongoDB                       │
                    └──────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼───────┐       ┌─────────▼──────────┐
      │  ApiResponse  │       │  error.middleware   │
      │  (success)    │       │  (global handler)   │
      └───────┬───────┘       └─────────┬───────────┘
              │                         │
              └────────────┬────────────┘
                    ┌──────▼──────┐
                    │ HTTP Client │
                    └─────────────┘
```

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### 📖 Interactive Swagger API Documentation
- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI Spec**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)
- **Spec File**: `src/docs/swagger.json`

---

### 🔓 Auth Endpoints (Public)

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret123"
}
```
**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "user" },
    "token": "eyJhbGci..."
  }
}
```

---

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "Secret123"
}
```
**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com" },
    "token": "eyJhbGci..."
  }
}
```

---

### 🔒 Item Endpoints (JWT Required)

Add this header to all item requests:
```http
Authorization: Bearer <your_jwt_token>
```

---

#### Get All Items (Paginated)
```http
GET /items?page=1&limit=10
```
**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Items fetched successfully",
  "data": {
    "items": [ { "_id": "...", "title": "Widget", "price": 9.99, "inStock": true } ],
    "total": 42,
    "page": 1,
    "pages": 5
  }
}
```

---

#### Get Item by ID
```http
GET /items/:id
```

---

#### Create Item
```http
POST /items
Content-Type: application/json

{
  "title": "Widget Pro",
  "description": "A very useful widget",
  "price": 19.99,
  "inStock": true
}
```
**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Item created successfully",
  "data": { "item": { "_id": "...", "title": "Widget Pro", "price": 19.99 } }
}
```

---

#### Update Item
```http
PUT /items/:id
Content-Type: application/json

{
  "price": 24.99,
  "inStock": false
}
```

---

#### Delete Item
```http
DELETE /items/:id
```
**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Item deleted successfully",
  "data": null
}
```

---

### ❤️ Health Check (No Auth)
```http
GET /health
```
```json
{ "status": "ok", "timestamp": "2026-10-20T16:00:00.000Z" }
```

---

## ❌ Error Response Format

All errors follow the same JSON shape:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    "title must be at least 3 characters",
    "price must be greater than or equal to 0"
  ]
}
```

| Status Code | Meaning |
|---|---|
| `400` | Bad request / invalid ID or Mongoose validation |
| `401` | Unauthenticated — missing or invalid JWT |
| `403` | Forbidden — insufficient role |
| `404` | Resource not found |
| `409` | Conflict — duplicate unique field (e.g. email) |
| `422` | Unprocessable — Joi validation failed |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error |

> In `development` mode, error responses also include a `stack` field for debugging.

---

## 🛡️ Security Overview

| Layer | How it works |
|---|---|
| **Helmet** | Sets secure HTTP response headers: `Content-Security-Policy`, `X-XSS-Protection`, `X-Frame-Options`, `X-Content-Type-Options`, and more |
| **CORS** | Only allows requests from origins listed in `ALLOWED_ORIGINS`. Rejects all others with a CORS error |
| **Rate Limiting** | General: 100 req/15 min. Auth routes: 10 req/15 min. Protects against brute-force and DDoS |
| **Mongo Sanitize** | Strips `$` and `.` characters from user input, preventing NoSQL injection attacks |
| **HPP** | Removes duplicate query parameters that could exploit middleware expecting a single value |
| **JWT** | Stateless authentication. Tokens are signed with `JWT_SECRET` and verified on every protected request |
| **Bcrypt** | Passwords are hashed with 12 rounds of bcrypt before storage. Plain text passwords are never stored |
| **Joi Validation** | Every request body is validated against a strict schema. Unknown fields are stripped. Coerced values replace raw input |
| **Error handling** | Stack traces only sent in `development`. `500` errors logged server-side, not exposed to clients |
| **`.gitignore`** | `.env` and `logs/` are excluded from version control |

---

## 🛠️ Scripts

```bash
# Start in development mode with auto-reload (ts-node-dev)
npm run dev

# Compile TypeScript to JavaScript (dist/)
npm run build

# Start in production mode (requires running npm run build first)
npm start
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/my-feature`
3. **Commit** your changes using conventional commits:
   - `feat: add user avatar upload`
   - `fix: handle expired token edge case`
   - `chore: update dependencies`
   - `docs: update API reference`
4. **Push** to your branch: `git push origin feat/my-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
