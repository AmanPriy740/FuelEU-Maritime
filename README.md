FuelEU Maritime Compliance Platform

Overview

The FuelEU Maritime Compliance Platform is a full-stack application designed to help maritime operators manage their greenhouse gas (GHG) emission compliance. It implements the core regulations of the Fuel EU Maritime directive (Regulation (EU) 2023/1805), specifically focusing on:

Tracking maritime routes and fuel consumption.

Calculating Compliance Balances (CB) against the 2025 target intensity (89.3368 gCO₂e/MJ).

Managing Article 20 (Banking) operations.

Managing Article 21 (Pooling) operations using a greedy allocation algorithm.

Architecture Summary (Hexagonal Architecture)

This project strictly adheres to Hexagonal Architecture (Ports & Adapters) to ensure the core domain logic is entirely decoupled from frameworks, databases, and UI libraries.

Folder Structure

/backend (or /frontend)
└── src/
    ├── core/                  # Pure TypeScript/Business Logic (No frameworks)
    │   ├── domain/            # Entities, Value Objects, Core Math (CB Formulas)
    │   ├── application/       # Use Cases (e.g., CreatePoolUseCase, CalculateCB)
    │   └── ports/             # Interfaces (IRouteRepo, IBankingRepo)
    ├── adapters/              # Framework-specific implementations
    │   ├── inbound/           # Express HTTP Controllers / React UI Components
    │   └── outbound/          # Prisma Postgres Repositories / Fetch API Clients
    └── infrastructure/        # Setup for Express, Prisma Client, Vite, etc.


Flow of Control

Inbound Adapters (Express routes / React buttons) receive requests.

They call Application Use Cases residing in the core.

The Use Cases fetch data via Outbound Ports (Interfaces).

Outbound Adapters (Prisma DB queries) implement those interfaces and return data.

Use Cases execute Domain Logic and save results back through the ports.

Setup & Run Instructions

Prerequisites

Node.js (v18 or higher)

PostgreSQL (Running locally or via Docker)

Git

1. Backend Setup

Navigate to the backend directory:

cd backend


Install dependencies:

npm install


Configure Environment Variables:
Create a .env file in the backend root and add your database connection string:

DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_db?schema=public"
PORT=3001


Run Database Migrations and Seed Data:

npx prisma migrate dev --name init
npx prisma db seed


Start the development server:

npm run dev


2. Frontend Setup

Navigate to the frontend directory:

cd frontend


Install dependencies:

npm install


Start the Vite development server:

npm run dev


The dashboard will be available at http://localhost:5173.

How to Execute Tests

The project utilizes Jest/Vitest for comprehensive testing across the stack.

Backend Tests:

Unit Tests (Core Logic): Tests the pure domain math and use-cases.

cd backend
npm run test


Integration Tests (API Endpoints): Tests the Express routes using Supertest.

npm run test:integration


Frontend Tests:

Component Tests: Tests React components and UI state using React Testing Library.

cd frontend
npm run test


Sample Requests & Responses

1. Fetch Routes Comparison

GET /api/routes/comparison
Description: Returns the GHG intensity of all routes compared to the baseline route.

{
  "baseline": {
    "routeId": "R001",
    "ghgIntensity": 91.0
  },
  "comparisons": [
    {
      "routeId": "R002",
      "ghgIntensity": 88.0,
      "percentDiff": -3.29,
      "compliant": true
    }
  ]
}


2. Execute Pool Allocation (Article 21)

POST /api/pools
Description: Takes a list of ships and pools their compliance balances. Deficits are covered by surpluses using a greedy allocation strategy.
Request Body:

{
  "year": 2025,
  "shipIds": ["R001", "R002", "R003"]
}


Success Response (200 OK):

{
  "poolId": "pool_uuid_123",
  "allocations": [
    {
      "shipId": "R001",
      "cbBefore": -500000,
      "cbAfter": 0
    },
    {
      "shipId": "R002",
      "cbBefore": 800000,
      "cbAfter": 300000
    }
  ]
}


Error Response (400 Bad Request):

{
  "error": "Invalid Pool: Sum of Compliance Balances is less than 0."
}
