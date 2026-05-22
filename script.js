// =============================================
// DATA: Load transactions from localStorage
// =============================================
// localStorage is the browser's built-in storage — it saves data
// even after the page is closed or refreshed.
// If no data exists yet, we start with an empty array [].
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];


// =============================================
// DOM REFERENCES
// =============================================
// We grab each HTML element once and store it in a variable.
// This is faster than calling getElementById() every time we need it.
const balanceEl = document.getElementById("balance");        // the big balance number
const incomeEl  = document.getElementById("income");         // total income display
const expenseEl = document.getElementById("expense");        // total expense display
const listEl    = document.getElementById("transactionList"); // the <ul> list
const errorEl   = document.getElementById("error-msg");      // error message paragraph
const descEl    = document.getElementById("description");    // description input field
const amountEl  = document.getElementById("amount");         // amount input field


// =============================================
// ADD TRANSACTION
// Called when the user clicks the "+ Add Transaction" button
// =============================================
function addTransaction() {

    // Read and clean up the values from the input fields
    const desc   = descEl.value.trim(); // .trim() removes accidental spaces
    const amount = Number(amountEl.value);      // convert string to number

    // VALIDATION: Check for specific errors and provide targeted messages
    // 1. Empty description check
    if (!desc) {
        errorEl.textContent = "⚠ Please enter a description.";
        return; // "return" exits the function early — nothing else runs
    }

    // 2. Invalid number check (including non-numeric input)
    if (isNaN(amount) || !isFinite(amount)) {
        errorEl.textContent = "⚠ Please enter a valid number.";
        return;
    }

    // 3. Zero amount check
    if (amount === 0) {
        errorEl.textContent = "⚠ Amount cannot be zero.";
        return;
    }

    // Clear any previous error message if validation passes
    errorEl.textContent = "";

    // Build a transaction object with three properties:
    // - id: a unique number based on the current timestamp (Date.now() = milliseconds since 1970)
    // - desc: the description text the user typed
    // - amount: the number (positive = income, negative = expense)
    const transaction = {
        id: Date.now(),
        desc,
        amount
    };

    // Add the new transaction to our array
    transactions.push(transaction);

    // Save the updated array to localStorage so it persists on refresh
    saveToLocalStorage();

    // Re-draw the list and recalculate totals
    render();

    // Clear the input fields so the user can add another transaction immediately
    descEl.value = "";
    amountEl.value = "";

    // Return focus to the description field for better UX
    descEl.focus();
}


// =============================================
// DELETE TRANSACTION
// Called when the user clicks the "✕" button on a transaction.
// The id parameter tells us WHICH transaction to remove.
// =============================================
function deleteTransaction(id) {
    // .filter() creates a NEW array that only keeps items where the condition is true.
    // We keep everything EXCEPT the transaction that matches the given id.
    transactions = transactions.filter(t => t.id !== id);

    // Save the updated array (now without the deleted transaction)
    saveToLocalStorage();

    // Re-draw the list and recalculate totals
    render();
}


// =============================================
// SAVE TO LOCALSTORAGE
// We call this every time transactions change.
// JSON.stringify() converts the array into a text string for storage.
// =============================================
function saveToLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}


// =============================================
// CALCULATE & UPDATE TOTALS
// Reads the transactions array and updates the
// balance, income, and expense display values.
// =============================================
function calculate() {

    // Extract just the amounts into a separate array
    // e.g. [500, -30, 200, -15] 
    const amounts = transactions.map(t => t.amount);

    // BALANCE: Add up ALL amounts (positives and negatives cancel out)
    // .reduce() loops through the array and accumulates a running total.
    // Starting value is 0 (the second argument after the callback).
    const total = amounts
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2); // round to 2 decimal places

    // INCOME: Filter to only positive amounts, then sum them
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2);

    // EXPENSE: Filter to only negative amounts, sum them, then multiply by -1
    // so it displays as a positive number (e.g. 45.00 instead of -45.00)
    const expense = (
        amounts
            .filter(item => item < 0)
            .reduce((acc, item) => acc + item, 0) * -1
    ).toFixed(2);

    // --- UPDATE THE DOM ---

    // Balance: show value with $ sign
    balanceEl.textContent = `$${total}`;

    // Color the balance green if positive, red if negative
    balanceEl.style.color = total >= 0 ? "#4ade80" : "#f87171";

    // Income and expense always show with $ sign
    incomeEl.textContent  = `$${income}`;
    expenseEl.textContent = `$${expense}`;
}


// =============================================
// RENDER
// Clears and redraws the entire transaction list.
// We call this every time the data changes.
// =============================================
function render() {

    // Clear the current list so we can redraw it fresh
    listEl.innerHTML = "";

    // EMPTY STATE: If there are no transactions, show a friendly message
    if (transactions.length === 0) {
        listEl.innerHTML = `
            <li class="empty-state">
                <span>📭</span>
                No transactions yet. Add one above!
            </li>
        `;
        // Still run calculate() so totals reset to $0.00
        calculate();
        return;
    }

    // Loop through each transaction and create a list item for it
    transactions.forEach(t => {

        // Create a new <li> element
        const li = document.createElement("li");

        // Determine color: green for income, red for expense
        const color = t.amount > 0 ? "#4ade80" : "#f87171";

        // Format the amount:
        // - Always show 2 decimal places (.toFixed(2))
        // - Show "+" for income, nothing extra for expense (negative sign is already there)
        // - Always show absolute value with $ sign, then apply color separately
        const sign           = t.amount > 0 ? "+" : "-";
        const formattedAmt   = `${sign}$${Math.abs(t.amount).toFixed(2)}`;

        // --- FIX #1: PREVENT XSS VULNERABILITY ---
        // Instead of using innerHTML with user input, we now use safe DOM methods.
        // This prevents malicious scripts from being injected via the description field.

        // Create and populate the description span safely
        const descSpan = document.createElement("span");
        descSpan.className = "li-desc";
        descSpan.textContent = t.desc;  // textContent is safe — it treats input as plain text

        // Create the amount span (formatted amount is app-generated, not user input)
        const amountSpan = document.createElement("span");
        amountSpan.className = "li-amount";
        amountSpan.style.color = color;
        amountSpan.textContent = formattedAmt;

        // Create the delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.textContent = "✕";
        deleteBtn.onclick = () => deleteTransaction(t.id);  // Use arrow function to bind the id safely

        // Append all elements to the list item
        li.appendChild(descSpan);
        li.appendChild(amountSpan);
        li.appendChild(deleteBtn);

        // Add the completed <li> to the <ul> list in the HTML
        listEl.appendChild(li);
    });

    // After drawing the list, recalculate and update the totals at the top
    calculate();
}


// =============================================
// INITIAL RENDER
// When the page first loads, render whatever
// transactions were saved in localStorage.
// =============================================
render();
