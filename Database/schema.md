# Database Schema — SpendSense

Complete MongoDB schema documentation for the SpendSense expense tracker.

## 📋 Collections Overview

| Collection | Purpose                                 |
|------------|----------------------------------------|
| `users`    | Store user accounts & authentication   |
| `expenses` | Store expense records linked to users  |

---

## 👥 Users Collection

**Purpose:** Store user credentials and profile info.

### Schema

```javascript
{
  _id: ObjectId,                          // Unique identifier
  name: {
    type: String,
    required: true,
    trim: true                            // Remove whitespace
  },
  email: {
    type: String,
    required: true,
    unique: true,                         // No duplicate emails
    trim: true,
    lowercase: true                       // Normalize to lowercase
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    // Hashed with bcryptjs before saving (see userSchema.pre('save'))
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true                       // Cannot be changed
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Methods

- `comparePassword(candidatePassword)` — Verify password during login
  ```javascript
  const isMatch = await user.comparePassword('guess123');
  ```

### Indexes

- `email` — Unique index for fast lookups and preventing duplicates

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$12$abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab",
  "createdAt": ISODate("2024-03-01T10:00:00Z"),
  "updatedAt": ISODate("2024-03-01T10:00:00Z")
}
```

---

## 💸 Expenses Collection

**Purpose:** Store individual expense records linked to users.

### Schema

```javascript
{
  _id: ObjectId,                          // Unique identifier
  userId: {
    type: ObjectId,
    ref: 'User',                          // Reference to users collection
    required: true,
    index: true                           // Indexed for fast user queries
  },
  name: {
    type: String,
    required: true,
    trim: true                            // e.g., "Lunch at cafe"
  },
  amount: {
    type: Number,
    required: true,
    min: 0                                // Cannot be negative
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/         // Format: YYYY-MM-DD
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Food',
      'Transport',
      'Entertainment',
      'Health',
      'Shopping',
      'Utilities',
      'Education',
      'Other'
    ]
  },
  payment: {
    type: String,
    enum: ['UPI', 'Card', 'Cash', 'Net Banking'],
    default: 'UPI'
  },
  notes: {
    type: String,
    default: ''                           // Optional notes field
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true                       // Cannot be changed
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Constraints

- **User-scoped:** Each expense is tied to a specific user via `userId`
- **Amount validation:** Must be non-negative
- **Date format:** YYYY-MM-DD only
- **Category validation:** Only predefined categories allowed
- **Payment validation:** Only predefined payment methods allowed

### Indexes

- `userId` — Indexed for fast lookups of user's expenses
- `date` — Can be indexed for range queries on date ranges

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Lunch at cafe",
  "amount": 450,
  "date": "2024-03-30",
  "category": "Food",
  "payment": "UPI",
  "notes": "Met with team for project discussion",
  "createdAt": ISODate("2024-03-30T12:30:00Z"),
  "updatedAt": ISODate("2024-03-30T12:30:00Z")
}
```

---

## 🔍 Query Examples

### Find all expenses for a user (this month)

```javascript
db.expenses.find({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  date: { $regex: "^2024-03" }
})
```

### Find expenses by category

```javascript
db.expenses.find({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  category: "Food"
})
```

### Count expenses by category

```javascript
db.expenses.aggregate([
  { $match: { userId: ObjectId("507f1f77bcf86cd799439011") } },
  { $group: { 
    _id: "$category", 
    total: { $sum: "$amount" },
    count: { $sum: 1 }
  }},
  { $sort: { total: -1 }}
])
```

### Find top 5 most expensive

```javascript
db.expenses.find({
  userId: ObjectId("507f1f77bcf86cd799439011")
})
.sort({ amount: -1 })
.limit(5)
```

### Calculate monthly summary

```javascript
db.expenses.aggregate([
  { $match: { userId: ObjectId("507f1f77bcf86cd799439011") } },
  {
    $addFields: {
      monthStr: { $substr: ["$date", 0, 7] }
    }
  },
  {
    $group: {
      _id: "$monthStr",
      total: { $sum: "$amount" },
      count: { $sum: 1 },
      avg: { $avg: "$amount" }
    }
  },
  { $sort: { _id: -1 }}
])
```

---

## 🔐 Data Security

### Password Hashing
- Passwords are hashed using **bcryptjs** with 12 salt rounds **before** being saved
- Raw passwords are never stored
- Password comparison uses `user.comparePassword()`

### User Privacy
- Each user can only see their own expenses
- API validates `userId` in auth middleware
- Database queries filter by authenticated user

### Validation
- Email uniqueness enforced at database level
- Amount and date format validated in schema
- Categories restricted to predefined enum values

---

## 📈 Growth Considerations

For production with large datasets:

- Add compound index: `{ userId: 1, date: -1 }`
- Partition expenses collection if > 10M records
- Archive old expenses (>2 years) to separate collection
- Consider denormalization for analytics queries
- Enable MongoDB Atlas Auto-Scaling

---

## 🔄 Data Relationships

```
┌──────────────────┐
│     users        │
│  ╔════════════╗  │
│  ║   _id      ║◄──────┐
│  ║   name     ║       │
│  ║   email    ║       │ userId (foreign key)
│  ║ password   ║       │
│  ║ timestamps ║       │
│  ╚════════════╝       │
└──────────────────┘    │
                        │
                        │
┌──────────────────┐    │
│   expenses       │    │
│  ╔════════════╗  │    │
│  ║   _id      ║      │
│  ║ userId────────────┘
│  ║   name     ║
│  ║   amount   ║
│  ║   date     ║
│  ║  category  ║
│  ║  payment   ║
│  ║   notes    ║
│  ║ timestamps ║
│  ╚════════════╝
└──────────────────┘
```

---

**Database Team:** Responsible for schema, indexes, and optimization

Visit [MongoDB Docs](https://docs.mongodb.com/) for more details.
