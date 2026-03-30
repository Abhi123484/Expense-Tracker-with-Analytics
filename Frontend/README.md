# Frontend — SpendSense

The frontend is a single-page application (SPA) built with **vanilla HTML, CSS, and JavaScript** — no frameworks needed!

## 📁 Structure

```
Frontend/
├── index.html        ← Complete SPA with embedded CSS & JavaScript
└── README.md         ← This file
```

## 🎯 Features

- **Dark-themed Dashboard** with real-time statistics and spending trends
- **Expense Management** — Add, edit, delete expenses with rich details
- **Analytics Page** — Monthly insights, category breakdown, top 5 expenses
- **Authentication** — Register & login with JWT-based sessions
- **Responsive UI** — Works on desktop, tablet, and mobile
- **Beautiful Charts** — Chart.js for spending visualizations

## 🚀 Getting Started

### 1. Make sure Backend is running

The frontend communicates with the backend API at `/api/*` endpoints.

```bash
# From Backend folder
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Open in Browser

Simply open `index.html` in any modern browser, or serve through a local server:

```bash
# Using Python
python -m http.server 5000

# Using Node.js
npx http-server
```

Then visit: **http://localhost:5000** (or whichever port)

## 🔐 Authentication

1. **Register** — Create a new account with email & password
2. **Login** — Access your expense data securely via JWT tokens
3. **Token Storage** — JWT stored in browser's localStorage

## 📊 Pages

| Page       | Purpose                           |
|-----------|-----------------------------------|
| Dashboard | Overview stats & recent expenses |
| Expenses  | Full list with search & filters  |
| Analytics | Monthly insights & trends       |

## 🛠 Development Notes

- **No build step required** — Just edit and refresh
- **API calls** use modern `fetch()` API
- **Responsive** CSS Grid & Flexbox layouts
- **localStorage** for offline fallback data

## 📞 API Endpoints

The frontend expects the backend to provide:

- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `GET /api/auth/me` — Get current user
- `GET /api/expenses` — List expenses
- `POST /api/expenses` — Create expense
- `PUT /api/expenses/:id` — Update expense
- `DELETE /api/expenses/:id` — Delete expense
- `GET /api/analytics/monthly?month=YYYY-MM` — Monthly stats
- `GET /api/analytics/trend?days=7` — Spending trend
- `GET /api/analytics/summary` — Monthly aggregation

See [Backend README](../Backend/README.md) for full API documentation.

## 🌐 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Team Role:** Frontend Developer

Push this folder to GitHub as: `Frontend/`
