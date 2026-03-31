# MongoDB Setup Guide

Complete setup instructions for SpendSense database.

## 🚀 Option 1: Local MongoDB (Development)

### Step 1: Install MongoDB Community

#### Windows
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer (.msi)
3. Choose "Complete" installation
4. MongoDB will install as a Windows Service

#### Mac
```bash
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

sudo systemctl start mongod
```

### Step 2: Verify Installation

```bash
# Should show MongoDB version
mongod --version

# Or in a new terminal, connect to MongoDB shell
mongosh
```

### Step 3: Configure Backend

Update `.env` in Backend folder:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/spendsense
JWT_SECRET=your-secret-key
```

### Step 4: Start Backend

```bash
cd Backend
npm install
npm start
# Server running on http://localhost:5000
```

---

## ☁️ Option 2: MongoDB Atlas (Cloud) — Recommended

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create organization & project

### Step 2: Create a Cluster

1. Click "Create"
2. Select "M0 Sandbox" (free tier)
3. Select region closest to you
4. Click "Create Deployment"

### Step 3: Set Up Authentication

1. Go to "Database Access"
2. Click "Add New Database User"
3. **Username:** `spendsense`
4. **Password:** Create strong password
5. **Built-in Role:** `readWriteAnyDatabase`
6. Click "Add User"

### Step 4: Configure IP Allowlist

1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Or add your specific IP: `1.2.3.4/32`
5. Click "Confirm"

### Step 5: Get Connection String

1. Go back to "Deployments"
2. Click "Connect"
3. Copy connection string
4. Replace `<password>` with your database password

Example:
```
mongodb+srv://spendsense:mypassword123@cluster0.mongodb.net/spendsense?retryWrites=true&w=majority
```

### Step 6: Configure Backend

Update `.env` in Backend folder:

```
PORT=5000
MONGO_URI=mongodb+srv://spendsense:mypassword123@cluster0.mongodb.net/spendsense?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

### Step 7: Start Backend

```bash
cd Backend
npm install
npm start
# Server running on http://localhost:5000
```

---

## 🔍 Connect to Database

### MongoDB Shell (mongosh)

#### Local
```bash
mongosh
# or
mongosh --host localhost:27017
```

#### Atlas (Cloud)
```bash
mongosh "mongodb+srv://spendsense:password@cluster0.mongodb.net/spendsense"
```

### MongoDB Compass (GUI)

1. Download: https://www.mongodb.com/products/compass
2. **Local:** Connection String = `mongodb://localhost:27017`
3. **Atlas:** Connection String = `mongodb+srv://...`
4. Click "Connect"
5. Browse data visually

### VS Code Extension

1. Install "MongoDB for VS Code"
2. Connect to MongoDB
3. Browse collections in sidebar

---

## 📊 Common Database Operations

### View Stats

```bash
mongosh
use spendsense
db.stats()
db.users.countDocuments()
db.expenses.countDocuments()
```

### Insert Sample Data

```javascript
db.users.insertOne({
  name: "Test User",
  email: "test@example.com",
  password: "hashedpassword"
})

db.expenses.insertOne({
  userId: ObjectId("..."),
  name: "Sample Expense",
  amount: 500,
  date: "2024-03-30",
  category: "Food",
  payment: "UPI",
  notes: ""
})
```

### Query Data

```javascript
// Find all users
db.users.find()

// Find expenses for user
db.expenses.find({ userId: ObjectId("...") })

// Find expensive items
db.expenses.find({ amount: { $gt: 1000 } })
```

### Delete Data

```javascript
// Delete one expense
db.expenses.deleteOne({ _id: ObjectId("...") })

// Delete all expenses for user
db.expenses.deleteMany({ userId: ObjectId("...") })
```

---

## ⚠️ Troubleshooting

### MongoDB Service Not Starting

**Windows:**
```bash
# Restart service
net stop MongoDB
net start MongoDB

# Or check status
sc query MongoDB
```

**Mac:**
```bash
brew services restart mongodb-community
```

**Linux:**
```bash
sudo systemctl restart mongod
```

### Connection Refused (Local)

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Ensure MongoDB is running
mongod

# Check if port 27017 is in use
netstat -an | grep 27017
```

### Authentication Failed (Atlas)

```
Error: authentication failed
```

**Solutions:**
- Verify username & password in connection string
- Check IP is in allowlist
- Ensure `@` symbol in password is URL-encoded: `%40`

### Database Already Exists

Just start using it — MongoDB creates automatically.

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Use MongoDB Atlas (managed cloud)
- [ ] Set strong password (20+ chars, special symbols)
- [ ] Restrict IP allowlist (no "Allow Anywhere")
- [ ] Enable two-factor authentication
- [ ] Enable encryption at rest
- [ ] Enable backup snapshots
- [ ] Set up monitoring & alerts
- [ ] Review security settings quarterly
- [ ] Use connection pooling
- [ ] Enable audit logging

---

**Next Steps:**
1. Set up database (choose Local or Atlas)
2. Run Backend server
3. Open Frontend in browser
4. Create account & start tracking expenses!

Questions? See main project README.
