// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnUrB0qnFNARf6lI03cbDZGXXCCH6duiw",
  authDomain: "house-expense-tracker-32f6e.firebaseapp.com",
  projectId: "house-expense-tracker-32f6e",
  storageBucket: "house-expense-tracker-32f6e.firebasestorage.app",
  messagingSenderId: "378925627597",
  appId: "1:378925627597:web:ee6e36e69f62b299811184"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elements
const loginBtn = document.getElementById('loginBtn');
const addBtn = document.getElementById('addBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categorySelect = document.getElementById('category');

// -------- LOGIN --------
loginBtn.addEventListener('click', () => {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  if (user === 'admin' && pass === '1234') {
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('trackerDiv').style.display = 'block';
    loadCategories();
    loadExpenses();
  } else {
    alert('Invalid login');
  }
});

// -------- ADD CATEGORY --------
addCategoryBtn.addEventListener('click', async () => {
  const newCat = document.getElementById('newCategory').value.trim();
  if (!newCat) return alert('Please enter a category name');

  // Add new category to Firestore
  await db.collection('categories').add({ name: newCat });
  document.getElementById('newCategory').value = '';
  loadCategories();
});

// -------- LOAD CATEGORIES --------
async function loadCategories() {
  const snapshot = await db.collection('categories').get();
  categorySelect.innerHTML = ''; // Clear old list

  // Default categories if no user-added ones yet
  const defaultCategories = ['Material', 'Labour', 'Electrical', 'Plumbing', 'Others'];

  const allCategories = [...defaultCategories];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!allCategories.includes(data.name)) allCategories.push(data.name);
  });

  // Populate dropdown
  allCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// -------- ADD EXPENSE --------
addBtn.addEventListener('click', async () => {
  const desc = document.getElementById('desc').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value;

  if (!desc || !amount || !date) return alert('Please fill all fields');

  await db.collection('expenses').add({ desc, amount, date, category });
  loadExpenses();
});

// -------- LOAD EXPENSES --------
async function loadExpenses() {
  const snapshot = await db.collection('expenses').get();
  const table = document.getElementById('expenseTable');
  table.innerHTML = '';
  let total = 0;
  const categoryTotals = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    total += data.amount;
    categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.amount;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable='true' class='desc'>${data.desc}</td>
      <td contenteditable='true' class='category'>${data.category}</td>
      <td contenteditable='true' class='amount'>${data.amount}</td>
      <td contenteditable='true' class='date'>${data.date}</td>
      <td><button onclick="updateExpense('${doc.id}', this)">Save</button></td>
    `;
    table.appendChild(tr);
  });

  document.getElementById('total').innerText = total;
  renderChart(categoryTotals);
}

// -------- UPDATE EXPENSE --------
async function updateExpense(id, btn) {
  const row = btn.closest('tr');
  const desc = row.querySelector('.desc').innerText;
  const category = row.querySelector('.category').innerText;
  const amount = parseFloat(row.querySelector('.amount').innerText);
  const date = row.querySelector('.date').innerText;

  await db.collection('expenses').doc(id).update({ desc, category, amount, date });
  alert('Updated successfully!');
}

// -------- PIE CHART --------
function renderChart(categoryTotals) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (window.pieInstance) window.pieInstance.destroy();
  window.pieInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#8bc34a', '#9c27b0', '#ff9800', '#00bcd4']
      }]
    }
  });
}
