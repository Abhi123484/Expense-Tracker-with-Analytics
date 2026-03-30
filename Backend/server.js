// ─── SpendSense Backend ─────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/spendsense';
const JWT_SECRET = process.env.JWT_SECRET || 'spendsense_fallback_secret';

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// ─── Mongoose Schemas ───────────────────────────────────────────────────────

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Expense Schema (now with userId)
const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Education', 'Other'],
    },
    payment: {
      type: String,
      enum: ['UPI', 'Card', 'Cash', 'Net Banking'],
      default: 'UPI',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);

// ─── Auth Middleware ─────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

// ─── Auth Routes ────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name: name.trim(), email: email.trim(), password });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me — verify token & get user info
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REST API: Expenses CRUD (all protected, user-scoped) ───────────────────

// GET /api/expenses — list with optional filters & sorting
app.get('/api/expenses', auth, async (req, res) => {
  try {
    const { category, month, search, sortBy, order } = req.query;
    const filter = { userId: req.userId };

    if (category && category !== 'All') filter.category = category;
    if (month) filter.date = { $regex: `^${month}` };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    let sortObj = { date: -1, createdAt: -1 };
    if (sortBy === 'amount') {
      sortObj = { amount: order === 'asc' ? 1 : -1 };
    } else if (sortBy === 'date') {
      sortObj = { date: order === 'asc' ? 1 : -1 };
    }

    const data = await Expense.find(filter).sort(sortObj).lean();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses — create
app.post('/api/expenses', auth, async (req, res) => {
  try {
    const { name, amount, date, category } = req.body;
    if (!name || amount == null || !date || !category) {
      return res.status(400).json({ success: false, message: 'name, amount, date, category are required' });
    }
    if (Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'amount must be >= 0' });
    }
    const expense = await Expense.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/expenses/:id — update
app.put('/api/expenses/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted', data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Analytics Endpoints (protected, user-scoped) ───────────────────────────

// GET /api/analytics/monthly?month=YYYY-MM
app.get('/api/analytics/monthly', auth, async (req, res) => {
  try {
    const month = req.query.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month query param required (YYYY-MM)' });
    }
    const [yr, mo] = month.split('-').map(Number);
    const days = daysInMonth(yr, mo);

    const expenses = await Expense.find({ userId: req.userId, date: { $regex: `^${month}` } }).lean();
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const count = expenses.length;
    const dailyAvg = days > 0 ? +(total / days).toFixed(2) : 0;

    const categoryWise = {};
    expenses.forEach((e) => {
      categoryWise[e.category] = (categoryWise[e.category] || 0) + e.amount;
    });

    let highestCategory = { name: '-', amount: 0 };
    for (const [name, amount] of Object.entries(categoryWise)) {
      if (amount > highestCategory.amount) highestCategory = { name, amount };
    }

    const dailyTotals = {};
    expenses.forEach((e) => {
      dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    });

    let topDay = { date: '-', amount: 0 };
    for (const [date, amount] of Object.entries(dailyTotals)) {
      if (amount > topDay.amount) topDay = { date, amount };
    }

    const top5 = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    res.json({
      success: true,
      data: { total, count, dailyAvg, days, categoryWise, highestCategory, dailyTotals, topDay, top5 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/trend?days=7
app.get('/api/analytics/trend', auth, async (req, res) => {
  try {
    const n = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const results = [];
    const today = new Date();

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dayExpenses = await Expense.find({ userId: req.userId, date: dateStr }).lean();
      results.push({
        date: dateStr,
        total: dayExpenses.reduce((s, e) => s + e.amount, 0),
        count: dayExpenses.length,
      });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/summary — monthly aggregation
app.get('/api/analytics/summary', auth, async (req, res) => {
  try {
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $addFields: {
          monthStr: { $substr: ['$date', 0, 7] },
        },
      },
      {
        $group: {
          _id: '$monthStr',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        },
      },
      { $sort: { _id: -1 } },
    ];
    const data = await Expense.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SPA catch-all ──────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

// ─── Start Server ───────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 SpendSense server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Starting server without database — frontend will use localStorage');
    app.listen(PORT, () => console.log(`🚀 SpendSense server running on http://localhost:${PORT} (no DB)`));
  });
