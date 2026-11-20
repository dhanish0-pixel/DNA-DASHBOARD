# 🏪 Smart Store Management System

A complete, production-quality retail management platform built with **React + FastAPI + SQLite/MySQL**.

---

## ✨ Features

| Module | Features |
|---|---|
| **Dashboard** | Live KPI cards, revenue vs profit charts, top products, stock status pie |
| **Stock Management** | Add/edit/delete products with photo upload, low-stock alerts |
| **Sales POS** | Multi-product cart, discounts, receipt generation, stock auto-deduction |
| **Profit & Revenue** | Gross profit, net profit, COGS, margin calculations in ₹ |
| **Expenses** | Record operating expenses deducted from net profit |
| **Reports** | Export sales, profit, and inventory reports to CSV |
| **Settings** | Manage categories, suppliers, and change password |

---

## 🛠️ Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| MySQL | Optional (SQLite fallback built-in) |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env if needed (SQLite works with no changes)

# Seed the database with admin user, categories, suppliers
python seed_data.py

# Start the API server
python -m uvicorn app.main:app --reload --port 8000
```

API will be available at: **http://localhost:8000**  
Swagger docs at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

### 3. Using Start Scripts (Windows)

Double-click or run from Command Prompt:

```
start-backend.bat    — starts FastAPI backend
start-frontend.bat   — starts React frontend
```

---

## 🔐 Default Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## 🗄️ Database

The app uses **SQLite by default** (zero configuration needed).  
The database file is created automatically at `smart_store.db`.

### Switch to MySQL

1. Install MySQL and create a database:
   ```sql
   CREATE DATABASE smart_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Update `backend/.env`:
   ```
   USE_SQLITE_FALLBACK=false
   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/smart_store
   ```

3. Re-run seed: `python seed_data.py`

---

## 🏗️ Project Structure

```
DNA Dashboard/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic (auth, stock, calculations)
│   │   └── utils/         # Helpers (currency, file storage)
│   ├── uploads/products/  # Uploaded product images
│   ├── requirements.txt
│   └── seed_data.py
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API client modules
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Route-level page components
│   │   └── utils/         # Formatters (₹ currency, dates)
│   └── package.json
├── database/
│   └── schema.sql         # MySQL schema reference
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## 💰 Financial Calculations

| Metric | Formula |
|---|---|
| Revenue | Sum of completed sale totals |
| COGS | Sum of (purchase_price_at_sale × qty) |
| Gross Profit | Revenue − COGS |
| Net Profit | Gross Profit − Total Expenses |
| Profit Margin | (Gross Profit / Revenue) × 100 |
| Inventory Value | Sum of (current_purchase_price × qty) |

> **Important:** Historical profit always uses the price snapshot stored at time of sale — never the current product price.

---

## 📸 Product Images

- Upload images via the **Add Product** / **Edit Product** modal
- Supported formats: JPG, PNG, WebP (max 5MB)
- Images stored at `backend/uploads/products/`
- Served at `http://localhost:8000/uploads/products/<filename>`

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/products` | List products |
| POST | `/api/products` | Add product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/sales` | Sales history |
| POST | `/api/sales` | Record sale |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Add expense |
| GET | `/api/dashboard/summary` | KPI summary |
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/categories` | Categories |
| GET | `/api/suppliers` | Suppliers |

Full interactive API docs at **http://localhost:8000/docs**

---

## 🛡️ Security

- JWT Bearer token authentication (HS256)
- Passwords hashed with bcrypt
- SQL injection protection via SQLAlchemy ORM
- Input validation via Pydantic schemas
- Image upload type and size validation

---

*Built with React + TypeScript + Vite + Tailwind CSS + Framer Motion + FastAPI + SQLAlchemy*
