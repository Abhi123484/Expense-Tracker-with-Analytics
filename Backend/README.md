# Backend — SpendSense API

The backend is a **Node.js + Express** server with **MongoDB** integration. It provides REST APIs for authentication, expense management, and analytics.

## 📁 Structure

```
Backend/
├── server.js        ← Main Express server (models, routes, middleware)
├── package.json     ← Dependencies & scripts
├── .env             ← Environment variables (configure here)
└── README.md        ← This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ — [https://nodejs.org](https://nodejs.org)
- **MongoDB** — [https://mongodb.com](https://mongodb.com)
  - **Local:** `mongod` running on `localhost:27017`
  - **Cloud:** MongoDB Atlas connection string

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env`:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/spendsense
JWT_SECRET=your_secret_key_here
```

**For MongoDB Atlas:**
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spendsense?retryWrites=true&w=majority
```

### 3. Start Server

```bash
# Production
npm start

# Development (auto-reload with nodemon)
npm run dev
```

Server runs on: **http://localhost:5000**

## 📜 API Documentation

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Login and get JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### GET `/api/auth/me`
Get authenticated user info.

**Headers:** `Authorization: Bearer <token>`

---

### Expenses

All expense endpoints require authentication header:
```
Authorization: Bearer eyJhbGc...
```

#### GET `/api/expenses`
List all expenses (with optional filters).

**Query Params:**
- `category` — Filter by category (e.g., `Food`)
- `month` — Filter by month (format: `YYYY-MM`)
- `search` — Search by name (case-insensitive)
- `sortBy` — Sort field: `amount` or `date` (default: date)
- `order` — Sort order: `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "name": "Lunch at cafe",
      "amount": 450,
      "date": "2024-03-30",
      "category": "Food",
      "payment": "UPI",
      "notes": "Met with team",
      "createdAt": "2024-03-30T10:30:00Z",
      "updatedAt": "2024-03-30T10:30:00Z"
    },
    ...
  ]
}
```

#### POST `/api/expenses`
Create a new expense.

**Request:**
```json
{
  "name": "Dinner",
  "amount": 800,
  "date": "2024-03-30",
  "category": "Food",
  "payment": "Card",
  "notes": "Family dinner"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...expense object... }
}
```

#### PUT `/api/expenses/:id`
Update an expense.

**URL:** `/api/expenses/507f1f77bcf86cd799439012`

**Request:** (send only fields to update)
```json
{
  "amount": 900,
  "notes": "Updated amount"
}
```

#### DELETE `/api/expenses/:id`
Delete an expense.

**URL:** `/api/expenses/507f1f77bcf86cd799439012`

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted",
  "data": { ...deleted expense... }
}
```

---

### Analytics

#### GET `/api/analytics/monthly?month=YYYY-MM`
Get monthly summary and analytics.

**Query:** `/api/analytics/monthly?month=2024-03`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5450,
    "count": 12,
    "dailyAvg": 175.8,
    "days": 31,
    "categoryWise": {
      "Food": 2100,
      "Transport": 1200,
      "Entertainment": 800,
      "Other": 1350
    },
    "highestCategory": {
      "name": "Food",
      "amount": 2100
    },
    "topDay": {
      "date": "2024-03-15",
      "amount": 650
    },
    "top5": [ ...expense objects... ]
  }
}
```

#### GET `/api/analytics/trend?days=7`
Get spending trend for last N days.

**Query:** `/api/analytics/trend?days=7`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-03-24",
      "total": 450,
      "count": 2
    },
    ...
  ]
}
```

#### GET `/api/analytics/summary`
Get monthly aggregation across all months.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2024-03",
      "total": 5450,
      "count": 12,
      "avg": 454.17
    },
    ...
  ]
}
```

---

## 📊 Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Expense
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String (required),
  amount: Number (required, >= 0),
  date: String (format: YYYY-MM-DD),
  category: Enum [...],
  payment: String (UPI/Card/Cash/Net Banking),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Features

- **Password Hashing** — bcryptjs with salt rounds
- **JWT Authentication** — 30-day token expiration
- **User-scoped Data** — Each user only sees their own expenses
- **CORS Enabled** — Allow cross-origin requests
- **MongoDB Indexing** — userId index for fast queries

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error: connect ECONNREFUSED
```

**Solution:**
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in `.env`
- For Atlas, verify IP allowlist includes your IP

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
- Change PORT in `.env`
- Or kill process: `lsof -i :5000` (Mac/Linux)

### JWT Token Expired
```
Invalid or expired token
```

**Solution:**
- Generate new token (login again)
- Tokens expire in 30 days

---

## 📞 Tech Stack

| Component | Tech                |
|-----------|-------------------|
| Runtime   | Node.js            |
| Framework | Express.js         |
| Database  | MongoDB + Mongoose |
| Auth      | JWT + bcryptjs    |
| CORS      | cors package       |

---

**Team Role:** Backend Developer

Push this folder to GitHub as: `Backend/`
