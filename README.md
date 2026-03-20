# Salon Backend (Node.js + Express + Sequelize + MySQL)

## Quick Start
1. Copy `.env.example` to `.env` and fill DB credentials.
2. Install deps: `npm install`
3. Seed DB: `npm run seed`
4. Run: `npm run dev` (defaults to port 4000)

## Auth
- `POST /auth/register` { name, username, password, role?, branchId? }
- `POST /auth/login` { username, password } -> returns JWT

## Core Endpoints (JWT required)
- Branches: `GET /branches`, `POST /branches`
- Services: `GET /services`, `POST /services`
- Customers: `POST /customers`, `GET /customers`, `POST /customers/:id/check-in`, `POST /customers/:id/check-out`
- Assignments: `POST /assignments`, `POST /assignments/:id/services` (serviceIds[]), `POST /assignments/:id/complete`, `GET /assignments`
- Invoices: `POST /invoices/generate/:customerId`, `POST /invoices/:id/pay`, `GET /invoices`
- Attendance: `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance`

Commission rate is controlled by `DEFAULT_COMMISSION_RATE` in `.env` (default 0.10).
