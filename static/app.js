const transactionList = JSON.parse('{{ transactions | tojson | safe }}');
const transactionsTableBody = document.getElementById('transactions-table-body');
const summary = {
    income: {{ summary.income }},
    expenses: {{ summary.expenses }},
    balance: {{ summary.balance }}
};

const transactionModal = document.getElementById('transactionModal');
const openModalBtn = document.getElementById('openModalBtn');
const transactionForm = document.getElementById('transactionForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const transactionIdInput = document.getElementById('transactionId');

const filterModal = document.getElementById('filterModal');
const openFilterModalBtn = document.getElementById('openFilterModalBtn');
const filterForm = document.getElementById('filterForm');

// Initial render
renderTransactions(transactionList);
updateSummary(summary);

// Modal functions for adding/editing transactions
openModalBtn.onclick = () => {
    resetForm();
    modalTitle.textContent = 'Add New Transaction';
    submitBtn.textContent = 'Add Transaction';
    transactionModal.style.display = 'block';
};

// Modal functions for filtering
openFilterModalBtn.onclick = () => {
    // Set the initial values in the modal based on current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    document.getElementById('filterCategory').value = urlParams.get('category') || 'all';
    document.getElementById('filterType').value = urlParams.get('type') || 'all';
    document.getElementById('filterYear').value = urlParams.get('year') || 'all';
    document.getElementById('filterMonth').value = urlParams.get('month') || 'all';
    
    filterModal.style.display = 'block';
};

// Handle closing both modals
document.querySelectorAll('.close-button').forEach(btn => {
    btn.onclick = () => {
        transactionModal.style.display = 'none';
        filterModal.style.display = 'none';
    };
});

window.onclick = (event) => {
    if (event.target == transactionModal) {
        transactionModal.style.display = 'none';
    }
    if (event.target == filterModal) {
        filterModal.style.display = 'none';
    }
};

// Render transactions to the table
function renderTransactions(transactionsToRender) {
    transactionsTableBody.innerHTML = '';
    transactionsToRender.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="${t.type === 'expense' ? 'expense-amount' : 'income-amount'}">$${t.amount.toFixed(2)}</td>
            <td>
                <button class="edit-button" data-id="${t.id}">Edit</button>
                <button class="delete-button" data-id="${t.id}">Delete</button>
            </td>
        `;
        transactionsTableBody.appendChild(row);
    });
}

// Update summary display
function updateSummary(newSummary) {
    document.getElementById('totalIncome').textContent = `$${newSummary.income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${newSummary.expenses.toFixed(2)}`;
    document.getElementById('netBalance').textContent = `$${newSummary.balance.toFixed(2)}`;
}

// Handle form submission (Add/Edit)
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const transactionData = {
        date: transactionForm.date.value,
        description: transactionForm.description.value,
        category: transactionForm.category.value,
        type: transactionForm.type.value,
        amount: parseFloat(transactionForm.amount.value)
    };

    const transactionId = transactionIdInput.value;
    let response;
    if (transactionId) { // Editing
        response = await fetch(`/api/transactions/${transactionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });
    } else { // Adding
        response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });
    }
    
    if (response.ok) {
        window.location.href = window.location.href;
    } else {
        alert('Error saving transaction.');
    }
});

// Handle delete and edit button clicks
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-button')) {
        const id = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this transaction?')) {
            const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (response.ok) {
                window.location.href = window.location.href;
            } else {
                alert('Error deleting transaction.');
            }
        }
    } else if (e.target.classList.contains('edit-button')) {
        const id = e.target.dataset.id;
        const transactionToEdit = transactionList.find(t => t.id == id);
        if (transactionToEdit) {
            modalTitle.textContent = 'Edit Transaction';
            submitBtn.textContent = 'Update Transaction';
            transactionIdInput.value = transactionToEdit.id;
            transactionForm.date.value = transactionToEdit.date;
            transactionForm.description.value = transactionToEdit.description;
            transactionForm.category.value = transactionToEdit.category;
            transactionForm.type.value = transactionToEdit.type;
            transactionForm.amount.value = transactionToEdit.amount;
            transactionModal.style.display = 'block';
        }
    }
});

// Handle filter form submission
filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const url = new URL(window.location.href.split('?')[0]);
    const formData = new FormData(filterForm);
    
    for (const [key, value] of formData.entries()) {
        if (value !== 'all') {
            url.searchParams.set(key, value);
        }
    }
    
    window.location.href = url.toString();
});

function resetForm() {
    transactionForm.reset();
    const today = new Date().toISOString().split('T')[0];
    transactionForm.date.value = today;
    transactionIdInput.value = '';
}