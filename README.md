# StockSense — Intelligent Modular Inventory Management System (IMS)

[![Architecture](https://img.shields.io/badge/Architecture-Modular%20IMS-714B67.svg)](https://github.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TypeScript-339933.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(Prisma%20ORM)-003B57.svg)](https://www.prisma.io/)

StockSense is an enterprise-grade Inventory Management System (IMS) designed to digitize and streamline stock-related operations across warehouses, production floors, and distribution channels. Built in alignment with the Odoo IMS philosophy, it replaces error-prone spreadsheets and manual registers with a centralized, real-time double-entry stock ledger.

---

## 🏗️ Modular Architecture & Core Components

```
StockSense/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Top Navbar, DynamicFilterBar, Modals, Operation Details
│   │   ├── pages/              # Dashboard, Products Catalog, Operations, Move History, Settings, Login
│   │   ├── context/            # AuthContext with OTP Password Reset
│   │   ├── services/           # Axios REST Client with Token Interceptor
│   │   └── types/              # TypeScript Interfaces & Operation Data Models
│   └── vite.config.ts          # Vite Configuration with API Proxy
│
├── server/                     # Backend Application (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── routes/             # Auth, Products, Operations, Ledger, Warehouse Endpoints
│   │   ├── middleware/         # JWT Verification & Role-Based Access Control (RBAC)
│   │   └── db.ts               # Prisma ORM Singleton
│   └── prisma/
│       ├── schema.prisma       # Double-Entry Inventory Database Schema
│       └── seed.ts             # Realistic Scenario Demonstration Seeder
```

---

## 🚀 Key Features & Flow Alignment

### 1. Authentication & Security
- **Role-Based Access Control (RBAC)**: Distinguishes between `Inventory Manager` and `Warehouse Staff`.
- **OTP Password Reset**: 3-step modal flow (Request OTP -> Verify 6-digit Code -> Set New Password) with simulated local delivery for frictionless testing.
- **Instant Demo Logins**: One-click authentication for `manager@stocksense.com` (pass: `admin123`) and `staff@stocksense.com` (pass: `staff123`).

### 2. Executive Dashboard & Real-Time KPIs
- **Live Counters**:
  - Total Products in Stock & physical units count.
  - Low Stock / Out of Stock alerts (clickable to filter).
  - Pending Receipts.
  - Pending Deliveries.
  - Scheduled Internal Transfers.
- **Dynamic Multi-Criteria Filters**:
  - By Document Type: Receipts / Deliveries / Internal Transfers / Adjustments
  - By Status: Draft / Waiting (Picked) / Ready (Packed) / Done / Canceled
  - By Warehouse / Location
  - By Product Category
  - Instant text search across SKU, references, and notes.
- **Live Move History Ticker**: Real-time ticker showing recent stock movements as they occur.

### 3. Product Catalog & Reordering Rules
- **Full Product CRUD**: Name, SKU / Code, Category, UoM (kg, Units, Boxes, etc.), Cost, Initial Stock.
- **Stock Availability per Location**: Visual breakdown showing current stock levels across all internal racks and warehouses (`Main Store`, `Production Rack`, `Rack A`, `Rack B`).
- **Automated Reordering Rules**: Configurable minimum thresholds and suggested replenishment quantities.

### 4. End-to-End Inventory Operations
1. **Receipts (Incoming Goods)**:
   - Vendor receipt creation -> validate -> automated stock quant increment in target warehouse rack -> logged to Stock Ledger.
2. **Delivery Orders (Outgoing Goods)**:
   - Interactive 3-stage flow: `Step 1: Pick Items` -> `Step 2: Pack Items` -> `Step 3: Validate & Ship`.
   - Built-in stock validation prevents negative inventory.
3. **Internal Transfers**:
   - Move stock inside the company (e.g. `Main Store -> Production Rack`, `Rack A -> Rack B`, `Warehouse 1 -> Warehouse 2`).
   - Source location decrements, destination increments, total company balance remains invariant.
4. **Stock Adjustments**:
   - Reconcile physical count vs system recorded stock.
   - Calculates positive/negative delta and writes directly to double-entry ledger with `Inventory Loss & Scrap` accounting.
5. **Print Slip Generator**: One-click printable receipts and shipping slips.
6. **View Toggle**: Toggle between List Table (`≣`) and Kanban Grid (`⊞`).

### 5. Move History / Stock Ledger
- Complete double-entry audit trail tracking every single item movement with Timestamp, Document Reference, Product SKU, Source Location, Destination Location, Quantity, User, and Notes.
- Instant **CSV Export** for audit compliance.

---

## 🛠️ Getting Started (Local Setup)

### Prerequisites
- Node.js (v18+ or v24+)
- npm

### 1. Install Dependencies
```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
```

### 2. Initialize Database & Seed Demo Data
```bash
cd server
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run the Application
In two separate terminals:

```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Demonstration Data Matching Problem Statement Example

The seeded database directly reflects the exact scenario described in the problem statement:
- **Step 1: Receive Goods from Vendor**: 100 kg Steel Rods from National Steel Corp into Main Store (`+100 kg`).
- **Step 2: Internal Transfer**: 40 kg Steel moved from Main Store -> Production Rack (total stock unchanged).
- **Step 3: Deliver Finished Goods**: 20 kg Steel dispatched to Apex Construction (`-20 kg`).
- **Step 4: Adjust Damaged Items**: 3 kg damaged steel recorded during cutting (`-3 kg` logged to Stock Ledger).
- **Current Balance**:
  - Main Store: 60 kg
  - Production Rack: 17 kg
  - Total Steel Stock: 77 kg
