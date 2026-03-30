# � SpendSense — Expense Tracker with Analytics

A full-stack expense tracker web application with **beautiful dark-themed dashboard**, **rich analytics**, and **interactive Charts**. Built with vanilla HTML/CSS/JavaScript on the frontend and Node.js + Express + MongoDB on the backend.

![Tech Stack](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-blue?logo=javascript) ![Backend](https://img.shields.io/badge/Backend-Node%2FExpress-green?logo=node.js) ![Database](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📁 Project Organization — For 3 Team Members

This project is organized into **3 independent folders** so each team member can work on their assigned area and push to GitHub separately:

### Folder Structure

```
Expense Tracker with Analytics/
├── Frontend/          → Frontend Developer (UI/UX, JavaScript)
│   ├── index.html
│   ├── app.js
│   └── README.md
├── Backend/           → Backend Developer (API, Node.js)
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── README.md
├── Database/          → Database/DevOps Engineer (MongoDB, Config)
│   ├── schema.md
│   ├── setup-guide.md
│   ├── sample-data.json
│   └── README.md
└── README.md          → This file
```

---

## 👥 Team Member Roles & GitHub Setup

### Team Member 1: Frontend Developer

**Responsibility:** UI/UX, HTML, CSS, JavaScript Client-side Logic

```bash
# Create GitHub repo: spendsense-frontend
cd Frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/spendsense-frontend.git
git push -u origin main
```

📖 Full details: [Frontend/README.md](Frontend/README.md)

### Team Member 2: Backend Developer

**Responsibility:** REST API, Node.js/Express, Business Logic

```bash
# Create GitHub repo: spendsense-backend
cd Backend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/spendsense-backend.git
git push -u origin main
```

📖 Full details: [Backend/README.md](Backend/README.md)

### Team Member 3: Database/DevOps Engineer

**Responsibility:** MongoDB Setup, Configuration, Schema, Deployment

```bash
# Create GitHub repo: spendsense-database
cd Database
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/spendsense-database.git
git push -u origin main
```

📖 Full details: [Database/README.md](Database/README.md)

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript     |
| Charts     | Chart.js 4.x                        |
| Fonts      | Syne, Instrument Sans, DM Mono     |
| Backend    | Node.js + Express.js                |
| Database   | MongoDB + Mongoose ODM              |
| Auth       | JWT + bcryptjs                      |
| Dev Tools  | Nodemon, dotenv                     |

---

## 🚀 Quick Start (Development)

### Prerequisites

- **Node.js** v18+ — [https://nodejs.org](https://nodejs.org)
- **MongoDB** running locally or [MongoDB Atlas](https://www.mongodb.com/cloud)

### Step 1: Setup Database

```bash
# Option A: Local MongoDB
mongod

# Option B: MongoDB Atlas (Cloud)
# Get connection string from atlas.mongodb.com
```

### Step 2: Setup Backend

```bash
cd Backend
npm install
# Edit .env with your MONGO_URI
npm start
# Server runs on http://localhost:5000
```

### Step 3: Open Frontend

Open `Frontend/index.html` in your browser or:

```bash
# Serve locally
cd Frontend
npx http-server
# Visit http://localhost:8080

# 4. Start the development server
npm run dev

# 5. Open in browser
#    http://localhost:5000
```

> **Standalone mode:** You can also open `public/index.html` directly in a browser — the frontend uses `localStorage` as its data layer and works completely offline without the backend.

---

## 📡 REST API Reference

### Base URL: `http://localhost:5000/api`

### Expenses CRUD

| Method   | Endpoint              | Description              | Query / Body                                                                 |
|----------|-----------------------|--------------------------|------------------------------------------------------------------------------|
| `GET`    | `/api/expenses`       | List all expenses        | `?category=Food&month=2025-06&search=coffee&sortBy=date&order=desc`          |
| `POST`   | `/api/expenses`       | Create new expense       | Body: `{ name, amount, date, category, payment?, notes? }`                   |
| `PUT`    | `/api/expenses/:id`   | Update an expense        | Body: any fields to update                                                   |
| `DELETE` | `/api/expenses/:id`   | Delete an expense        | —                                                                            |

### Analytics

| Method | Endpoint                     | Description                        | Query                    |
|--------|------------------------------|------------------------------------|--------------------------|
| `GET`  | `/api/analytics/monthly`     | Monthly breakdown & stats          | `?month=2025-06`         |
| `GET`  | `/api/analytics/trend`       | Daily trend (last N days)          | `?days=7`                |
| `GET`  | `/api/analytics/summary`     | Aggregated monthly summaries       | —                        |

### Example Responses

#### `GET /api/expenses`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "665abc123...",
      "name": "Morning Coffee",
      "amount": 180,
      "date": "2025-06-15",
      "category": "Food",
      "payment": "UPI",
      "notes": "Starbucks",
      "createdAt": "2025-06-15T08:30:00Z",
      "updatedAt": "2025-06-15T08:30:00Z"
    }
  ]
}
```

#### `GET /api/analytics/monthly?month=2025-06`
```json
{
  "success": true,
  "data": {
    "total": 15420,
    "count": 20,
    "dailyAvg": 514,
    "days": 30,
    "categoryWise": { "Food": 4200, "Transport": 1200, "Shopping": 3500 },
    "highestCategory": { "name": "Food", "amount": 4200 },
    "dailyTotals": { "2025-06-01": 450, "2025-06-02": 1200 },
    "topDay": { "date": "2025-06-02", "amount": 1200 },
    "top5": [ { "name": "New Headphones", "amount": 3499, "category": "Shopping" } ]
  }
}
```

#### `GET /api/analytics/trend?days=7`
```json
{
  "success": true,
  "data": [
    { "date": "2025-06-09", "total": 650, "count": 3 },
    { "date": "2025-06-10", "total": 1200, "count": 5 }
  ]
}
```

---

## ✨ Features

### Core
- Add, edit, delete expenses with full validation
- 8 categories: Food 🍔, Transport 🚗, Entertainment 🎬, Health 💊, Shopping 🛍️, Utilities ⚡, Education 📚, Other 📦
- 4 payment modes: UPI, Card, Cash, Net Banking
- Indian Rupee (₹) formatting with `en-IN` locale
- Auto-seed 20 demo expenses on first load

### Analytics
- Monthly spending dashboard with 4 stat cards
- 7-day spending trend (line chart)
- Category distribution (doughnut + pie charts)
- Daily spending bar chart for any month
- Category breakdown with animated progress bars
- Top 5 expenses ranking (gold/silver/bronze)
- Month-by-month navigation

### UX
- Dark-themed modern UI with animated gradient background
- Three-page SPA: Dashboard, Expenses, Analytics
- Smooth page transitions (fadeUp animation)
- Fixed sidebar with monthly total widget
- Responsive design (mobile hamburger menu)
- Toast notifications for all actions
- Search, filter, and sort expenses
- Works offline with localStorage (no backend required)

---

## 📊 Dataset Sources

For additional sample data and inspiration:

- [Kaggle — Personal Finance Dataset](https://www.kaggle.com/datasets) — Search "personal finance", "expense tracker", "daily expenses"
- [Kaggle — Monthly Expenses](https://www.kaggle.com/datasets/ramjasmaurya/personal-finance-and-expenses-dataset)
- [Kaggle — Indian Household Expense](https://www.kaggle.com/datasets/goyaladi/personal-expenses)

---

## 📜 License

MIT
