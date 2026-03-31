# 💾 Database — MongoDB Setup & Configuration

This folder contains MongoDB configuration and documentation for the **SpendSense** expense tracker.

## 📁 Structure

```
Database/
├── schema.md         ← Database schema documentation
├── sample-data.json  ← Sample data for testing
├── setup-guide.md    ← Setup instructions (Local + Atlas)
└── README.md         ← This file
```

## ⚡ Quick Start

### Option 1: Local MongoDB (Development)

```bash
# Install MongoDB Community
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# Mac: brew install mongodb-community
# Linux: https://docs.mongodb.com/manual/administration/install-on-linux/

# Start MongoDB
mongod

# Default connection: mongodb://localhost:27017/spendsense
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create account & new cluster
3. Get connection string
4. Update `.env` in Backend folder:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spendsense?retryWrites=true&w=majority
   ```
5. Add your IP to IP Allowlist in Atlas

## 📊 Collections Created Automatically

When the backend starts, **Mongoose automatically creates** these collections:

### 1. **users**
Stores user accounts with encrypted passwords.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **expenses**
Stores all expenses linked to users.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users._id),
  name: String,
  amount: Number,
  date: String (YYYY-MM-DD format),
  category: String (enum: Food, Transport, Entertainment, Health, Shopping, Utilities, Education, Other),
  payment: String (UPI, Card, Cash, Net Banking),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `userId` is indexed for fast queries per user.

---

## 🔧 Database Management

### View Data via MongoDB Shell

```bash
# Connect to local MongoDB
mongosh

# Switch to spendsense database
use spendsense

# View collections
show collections

# Query users
db.users.find()

# Query expenses for a user
db.expenses.find({ userId: ObjectId("...") })

# Count expenses
db.expenses.countDocuments()

# Delete all expenses (WARNING!)
db.expenses.deleteMany({})

# Drop entire database (WARNING!)
db.dropDatabase()
```

### MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Browse collections visually
4. Write queries, view data in real-time

---

## 🚀 Deployment Checklist

Before pushing to production:

- [ ] Use MongoDB Atlas (managed cloud database)
- [ ] Add strong password to `.env`
- [ ] Configure IP allowlist in Atlas
- [ ] Enable encryption at rest
- [ ] Set up regular backups
- [ ] Configure connection pooling
- [ ] Enable audit logging (optional)

---

## 🐛 Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Ensure `mongod` is running or Atlas credentials are correct.

### Authentication Failed
```
Error: auth failed
```
**Fix:** Check MongoDB username/password in MONGO_URI.

### No Write Permission
```
Error: not authorized on admin
```
**Fix:** Create user with proper roles in MongoDB Atlas.

---

## 📚 Resources

- [MongoDB Official Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**Team Role:** Database / DevOps Engineer

Push this folder to GitHub as: `Database/`
