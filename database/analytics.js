// Basic Analytics Logic

const expenses = [
  { amount: 200, category: "Food" },
  { amount: 100, category: "Travel" },
  { amount: 150, category: "Food" }
];

// Calculate total expense
let total = 0;
expenses.forEach(e => total += e.amount);

console.log("Total Expense:", total);

// Category-wise spending
const categoryWise = {};

expenses.forEach(e => {
  if (!categoryWise[e.category]) {
    categoryWise[e.category] = 0;
  }
  categoryWise[e.category] += e.amount;
});

console.log("Category-wise:", categoryWise);