# 🌾 AGRI CRAFT-AI — Backend Database & REST API Platform

> **"Right Crop. Right Time. Right Action. Right Support."**

AGRI CRAFT-AI is an intelligent, bilingual (English & தமிழ்) agronomic assistance platform tailored for small and marginal farmers. This upgrade introduces a **secure, persistent PostgreSQL database** and a **Node.js + Express REST API backend** while preserving 100% of the existing frontend UI, charts, and interactions.

---

## 🏛️ Architecture Overview

```
+------------------------------------------------------------------------+
|                 AGRI CRAFT-AI Frontend (HTML5 / CSS / JS)              |
|  - Dashboard           - Crop Advisor        - Disease Detection       |
|  - Crop Risk Rating    - Agro-Weather (Live) - 4% KCC Agri Loans       |
|  - Govt Scheme Matcher - Mandi Price Trends  - Farmer Helplines        |
+-----------------------------------+------------------------------------+
                                    |
                                    | REST Requests (JSON via fetch)
                                    v
+------------------------------------------------------------------------+
|                Node.js + Express REST API Server (Port 5000)           |
|  - CORS & Helmet Security Headers                                      |
|  - Input Validation & Sanitization                                     |
|  - Parameterized Queries ($1, $2) to eliminate SQL Injection           |
|  - Resilient Fallback Engine for offline reliability                   |
+-----------------------------------+------------------------------------+
                                    |
                                    | Parameterized SQL Queries
                                    v
+------------------------------------------------------------------------+
|                      PostgreSQL Database (agricraft)                   |
|  1. farmers                5. loan_recommendations                     |
|  2. crops                  6. government_schemes                       |
|  3. market_prices          7. scheme_matches                           |
|  4. loans                                                              |
+------------------------------------------------------------------------+
```

---

## 🗄️ Database Tables (7 Core Tables)

| # | Table Name | Description | Key Columns |
|---|------------|-------------|-------------|
| 1 | `farmers` | Farmer registration profile & land tenure | `id`, `name`, `phone`, `email`, `location`, `land_area`, `land_type`, `created_at`, `updated_at` |
| 2 | `crops` | Farmer-associated crops and sowing records | `id`, `farmer_id` (FK), `crop_name`, `season`, `area`, `sowing_date`, `expected_harvest_date` |
| 3 | `market_prices` | Daily Mandi auction rates from Agmarknet / e-NAM | `id`, `crop_name`, `market_name`, `location`, `price`, `unit`, `price_date`, `source` |
| 4 | `loans` | Catalog of official agricultural bank credit schemes | `id`, `farmer_id`, `loan_name`, `provider`, `interest_rate`, `maximum_amount`, `tenure`, `eligibility`, `application_url` |
| 5 | `loan_recommendations` | Computed 5-factor weighted loan match scores | `id`, `farmer_id` (FK), `cibil_score`, `existing_loan_status`, `repayment_capacity`, `land_crop_score`, `location_score`, `total_match_score`, `recommendation_reason` |
| 6 | `government_schemes` | Central & State agricultural subsidy schemes | `id`, `scheme_name`, `description`, `eligibility`, `benefits`, `required_documents`, `official_url`, `state` |
| 7 | `scheme_matches` | Personalized farmer eligibility evaluation records | `id`, `farmer_id` (FK), `scheme_id` (FK), `eligibility_status`, `match_reason` |

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites & Installing Dependencies

Ensure you have **Node.js** (v18 or newer) and **npm** installed.

Install the required backend dependencies:
```bash
npm install
```
*(Or inside the `/backend` directory: `cd backend && npm install`)*

Installed production packages:
- `express`: REST API web framework
- `pg`: PostgreSQL client pool for Node.js
- `dotenv`: Environment variable loader
- `cors`: Cross-Origin Resource Sharing middleware
- `helmet`: Secure HTTP headers

---

### 2. Setting Up the PostgreSQL Database

1. Open your PostgreSQL prompt (`psql`) or a graphical tool like pgAdmin / DBeaver.
2. Create a database named `agricraft`:
```sql
CREATE DATABASE agricraft;
```
3. Execute the schema migration to create all 7 tables, constraints, indexes, and automatic timestamp triggers:
```bash
psql -U postgres -d agricraft -f database/schema.sql
```
4. Populate the database with verified agricultural schemes, loans, and mandi prices:
```bash
psql -U postgres -d agricraft -f database/seed.sql
```

*(On Windows, you can also run this in PowerShell:)*
```powershell
Get-Content database/schema.sql | psql -U postgres -d agricraft
Get-Content database/seed.sql | psql -U postgres -d agricraft
```

---

### 3. Configuring `.env`

Copy `.env.example` to `.env` if you haven't already:
```bash
cp .env.example .env
```

Edit `.env` to match your local PostgreSQL credentials:
```env
# Server Port
PORT=5000
NODE_ENV=development

# Option A: Full Connection URI
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/agricraft

# Option B: Individual Parameters (Used if DATABASE_URL is omitted)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=agricraft

# API Security Key
API_KEY=agri_craft_secret_key_demo
```

---

### 4. Running the Backend Server

Start the backend server:
```bash
npm start
```

Or for development with automatic restart (if nodemon is installed):
```bash
npm run dev
```

You will see:
```text
================================================================
🌾 AGRI CRAFT-AI Backend Server running on port 5000
⚡ Runtime Engine: Express.js + Middleware
🌐 Local URL: http://localhost:5000
🩺 Health API: http://localhost:5000/api/health
================================================================
✅ PostgreSQL Connected successfully (DB: agricraft)
```

---

### 5. Connecting the Frontend

1. **Integrated Server (Recommended)**:
   The backend server automatically serves the frontend static assets.
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

2. **Standalone / Live Server**:
   You can also open `index.html` directly or via VS Code Live Server (`http://127.0.0.1:5500`).
   `js/services/apiService.js` will automatically detect the server at `http://localhost:5000/api` with full CORS support.

3. **Offline-First Resiliency**:
   If the backend or PostgreSQL server is temporarily stopped, the frontend continues to work seamlessly using local client storage and in-memory agronomic databases without crashing or showing blank pages.

---

## 📡 REST API Endpoint Documentation

### Health Check
- **`GET /api/health`**
  Returns server uptime, runtime engine, and live PostgreSQL connection status.

### Farmers
- **`POST /api/farmers`**
  Registers or creates a farmer profile.
  ```json
  {
    "name": "Murugan K",
    "phone": "9876543210",
    "email": "murugan@agricraft.demo",
    "location": "Thanjavur",
    "land_area": 2.5,
    "land_type": "Alluvial"
  }
  ```
- **`GET /api/farmers/:id`**
  Retrieves farmer profile by primary key.
- **`PUT /api/farmers/:id`**
  Updates existing farmer details.

### Crops
- **`POST /api/crops`**
  Associates a cultivated crop with a farmer.
  ```json
  {
    "farmer_id": 1,
    "crop_name": "Paddy (Rice)",
    "season": "Kharif",
    "area": 2.5,
    "sowing_date": "2026-06-15",
    "expected_harvest_date": "2026-10-25"
  }
  ```
- **`GET /api/crops/:farmerId`**
  Retrieves all crops registered by the farmer.

### Mandi Market Prices
- **`GET /api/market-prices`**
  Retrieves current mandi prices. Supports filtering: `?crop=Paddy&location=Thanjavur`.
- **`POST /api/market-prices`**
  Records a new market price entry.

### Agricultural Loans & Recommendations
- **`GET /api/loans`**
  Catalog of official loan schemes (KCC 4%, Agri Gold Loan, Tractor Loan, MUDRA).
- **`POST /api/loan-recommendations`**
  Computes the 5-factor weighted loan match score:
  - CIBIL / credit history = 30%
  - Existing loan & repayment status = 25%
  - Income / repayment capacity = 20%
  - Land & crop details = 15%
  - Location / other criteria = 10%
  - Total Match Score = 0 to 100
  *Stores evaluation in `loan_recommendations` and attaches official non-guarantee disclaimer.*
- **`GET /api/loan-recommendations/:farmerId`**
  Retrieves loan recommendation history for a farmer.

### Government Schemes
- **`GET /api/government-schemes`**
  Catalog of PM-KISAN, PMFBY, PMKSY Drip, Kalaignar Scheme, SMAM Machinery.
- **`GET /api/government-schemes/match/:farmerId`**
  Evaluates farmer parameters against eligibility rules, persists match records in `scheme_matches`, and returns matched schemes with official application URLs.

---

## 🧪 Testing the APIs

### PowerShell Examples

```powershell
# 1. Test Health & DB Status
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get

# 2. Register Farmer Profile
$body = @{
    name = "Kavitha R"
    phone = "9842100001"
    email = "kavitha@farm.demo"
    location = "Coimbatore"
    land_area = 3.2
    land_type = "Red Loam"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/farmers" -Method Post -Body $body -ContentType "application/json"

# 3. Calculate 5-Factor Loan Recommendation
$loanBody = @{
    farmer_id = 1
    cibilScore = 730
    repaymentStatus = "always_on_time"
    agriIncome = 180000
    requestedAmount = 100000
    landArea = 2.5
    landTenure = "owner"
    location = "Thanjavur"
    water = "canal"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/loan-recommendations" -Method Post -Body $loanBody -ContentType "application/json"

# 4. Match Government Schemes
Invoke-RestMethod -Uri "http://localhost:5000/api/government-schemes/match/1" -Method Get
```

### cURL Examples

```bash
# Health Check
curl http://localhost:5000/api/health

# Market Prices Filtered
curl "http://localhost:5000/api/market-prices?crop=Paddy"

# Catalog of Loans
curl http://localhost:5000/api/loans
```

---

## 🛡️ Security & Integrity Highlights

1. **SQL Injection Prevention**:
   Every database interaction uses parameterized placeholders (`$1, $2, ...`) via the Node PostgreSQL driver.
2. **Environment Variable Protection**:
   Credentials and secrets are strictly loaded via `.env`. A `.gitignore` file guarantees `.env`, `node_modules/`, and logs are never committed.
3. **No Sensitive Financial Data in Frontend**:
   CIBIL scores, loan obligations, and income calculations are evaluated securely through backend services.
4. **Input Sanitization**:
   String truncation, type casting, and range checks are applied to all incoming request payloads.
5. **No Data Leakage**:
   Stack traces and raw database credentials are automatically redacted in production responses.
6. **Regulatory Compliance Notice**:
   Loan match scoring explicitly states that scores are informational recommendations and do not represent a loan guarantee or bank approval.
