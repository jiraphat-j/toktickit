# TokTickIT — IT Service Desk Starter

TokTickIT is a full-stack web application designed for IT service desk ticketing, built for **CPE 334 (Software Engineering)** Lab 1.

---

## Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Bootstrap 5
* **Backend:** Node.js, Express, TypeScript
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:** Vitest, Testing Library (React), Supertest (Express API)

---

## Prerequisites

Before running the application, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/) (included with Node.js)
* [PostgreSQL](https://www.postgresql.org/) database server running locally or remotely

---

## ⚙️ Environment Configuration

1. **Frontend Environment:**
   Copy `client/.env.example` to `client/.env`:
   ```bash
   cp client/.env.example client/.env
   ```
   * `VITE_API_URL`: Base URL of the backend API (default: `http://localhost:3000`)

2. **Backend Environment:**
   Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   * `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public`)
   * `PORT`: Express server port (default: `3000`)

---

## Getting Started

### 1. Install Dependencies

Install packages in both `client` and `server` directories:

```bash
# Frontend dependencies
cd client
npm install

# Backend dependencies
cd ../server
npm install
```

### 2. Database Migration & Seed

Run Prisma migrations and seed initial data:

```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

### 3. Run Development Servers

* **Backend Dev Server:**
  ```bash
  cd server
  npm run dev
  ```
  *(Starts server at `http://localhost:3000` with `tsx watch`)*

* **Frontend Dev Server:**
  ```bash
  cd client
  npm run dev
  ```
  *(Starts Vite dev server at `http://localhost:5173`)*

---

##  Running Tests

* **Frontend Unit & Component Tests:**
  ```bash
  cd client
  npm test
  ```

* **Backend Integration Tests:**
  ```bash
  cd server
  npm test
  ```

---

## 📁 Repository Structure

```text
toktickit/
├── client/              # React + Vite + Bootstrap frontend
│   ├── src/             # Frontend source code (App.tsx, api.ts, main.tsx)
│   └── tests/           # Vitest + Testing Library tests
├── server/              # Express + TypeScript backend
│   ├── prisma/          # Prisma schema & seed script
│   ├── src/             # Backend source code (app.ts, index.ts, prisma.ts)
│   └── tests/           # Supertest integration tests
├── docs/lab-01/         # Lab documentation (ai_use.md, reviewer.md, tests.md)
├── PROJECT_STRUCTURE.md # Detailed file responsibility guide
├── .gitignore           # Git ignore configuration
└── README.md            # Setup and execution instructions
```