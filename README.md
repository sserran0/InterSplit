# InterSplit
A full-stack expense splitting web-application with embedded real-time currency conversion, designed for international friend groups and study abroad students. Built as final individual project for CS312 course at Colorado State University

## The Problem

While studying abroad in South Korea, I found splitting expenses with my friends at the end of meals and outings to always be the least fun part of the night. Someone pays for dinner in Korean Won, but then the group contains members from Mexico, Italy, UK, and everyone is scrambling to do the rough mental math to agree on what they owe. The calaculations are hasty, sometimes inaccurate, and nobody wants to be that person who got it wrong.

Intersplit solves this by letting each person see their share of any expense automatically converted into their home currency in real time as expenses are added.

## Features
- User registration and authentication with JWT 
- Group creation and member addtion with preferred currency for each member
- Expense creation in any supported currency
- Each member sees their share in their own currency automatically
- Live per-member currency preview while entering an expense amount
- Balance tracking displaying what each person owes or is owed
- Group member removal and expense deletion
- Group removal on dashboard
- 14 supported currencies covering major study abroad destinations

## Tech-Stack

### Frontend

- React 19 with TypeScript
- Vite for development and bundling
- Tailwind CSS v4 for styling
- shadcn/ui for component primitives
- Zustand for global state management with localStorage persistence
- Axios for API communication with automatic JWT injection via interceptors
- Framer Motion for UI animations
- Lucide React for icons

### Backend

- Go with Chi router
- PostgreSQL for data storage
- JWT authentication via golang-jwt
- bcrypt for password hashing
- Frankfurter API for exchange rate data, cached hourly in database

## Architecture
```
client/                   React + TypeScript frontend
  src/
    components/           Reusable UI components
    pages/                LoginPage, DashboardPage, GroupPage
    hooks/                useCurrency — global rate store and converter
    store/                Zustand auth store with persistence
    lib/                  axios instance, formatCurrency, currencyConfig

server/                   Go backend
  main.go                 Entry point, router, middleware registration
  auth.go                 Register and login handlers
  groups.go               Group CRUD and member management
  expenses.go             Expense creation, retrieval, deletion
  rates.go                Exchange rate endpoint
  currency.go             Frankfurter API service and hourly refresher
  db.go                   PostgreSQL connection
  migrate.go              SQL migration runner
  jwt.go                  Token generation and verification middleware
  cors.go                 CORS middleware
  migrations/             SQL schema files
  ```

  ## Database Schema
  `
  users           id, email, name, password_hash, preferred_currency
  groups          id, name, created_by
  group_members   group_id, user_id
  expenses        id, group_id, paid_by, amount, currency, description
  expense_splits  id, expense_id, user_id, share_amount, is_settled
  exchange_rates  base_currency, target_currency, rate, fetched_at
  migrations_run  filename, applied_at
`
## How to Run

### Prerequisites

Go 1.22+
Node 20+
PostgreSQL 15+

#### 1. Clone the repository
`bashgit clone https://github.com/sserran0/InterSplit.git
cd InterSplit
2. Set up the database
bashpsql postgres
CREATE DATABASE inter_split_dev;
CREATE USER intersplit_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE inter_split_dev TO intersplit_user;`
\q
#### 3. Configure the backend
`Create server/.env:
DATABASE_URL=postgres://intersplit_user:yourpassword@localhost:5432/inter_split_dev?sslmode=disable
PORT=8080
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173`
#### 4. Run the backend
`bashcd server
go mod tidy
go run .`
#### 5. Run the front end
`
cd client
npm install
npm run dev
`

