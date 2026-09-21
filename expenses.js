// ============================================================
// FROSTYOPS - EXPENSES
// Offline-first expense management
// ============================================================

const API =
window.APP_CONFIG.API;

let adminUser = null;
let expenses = [];
let editingExpenseId = null;
let currentFormType = "general";
let selectedInvoice = null;

// ============================================================
// HELPERS
// ============================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function formatMoney(value) {
const number = Number(value);
if (!Number.isFinite(number)) return "0";
return number.toLocaleString("en-PK");
}

function formatDate(value) {
if (!value) return "-";


const date = parseExpenseDate(value);
if (!date) return "-";

return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});

}

function toInputDate(value) {
const date = parseExpenseDate(value);
if (!date) return "";


const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;

}

function parseExpenseDate(value) {
if (!value) return null;

if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
) {
    const [year, month, day] = value.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    return Number.isNaN(localDate.getTime())
        ? null
        : localDate;
}

const date = new Date(value);

return Number.isNaN(date.getTime())
    ? null
    : date;

}

function startOfDay(date) {
return new Date(
date.getFullYear(),
date.getMonth(),
date.getDate()
);
}

function getTomorrow(date) {
const result = new Date(date);
result.setDate(result.getDate() + 1);
return result;
}

function generateExpenseId() {
return `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isSalary(expense) {
return expense?.expenseType === "salary";
}

function getExpenseCategory(expense) {
return expense?.category ||
(isSalary(expense) ? "Worker Salaries" : "Other");
}

// ============================================================
// ELEMENTS
// ============================================================

const adminElement =
document.getElementById("admin");

const currentDateElement =
document.getElementById("currentDate");

const syncStatusElement =
document.getElementById("syncStatus");

const expenseForm =
document.getElementById("expenseForm");

const expenseFormTitle =
document.getElementById("expenseFormTitle");

const saveExpenseBtn =
document.getElementById("saveExpenseBtn");

const cancelEditBtn =
document.getElementById("cancelEditBtn");

const editingExpenseIdInput =
document.getElementById("editingExpenseId");

const generalExpenseFields =
document.getElementById("generalExpenseFields");

const salaryFields =
document.getElementById("salaryFields");

const generalExpenseTab =
document.getElementById("generalExpenseTab");

const salaryExpenseTab =
document.getElementById("salaryExpenseTab");

const expenseCategory =
document.getElementById("expenseCategory");

const expenseName =
document.getElementById("expenseName");

const expenseQuantity =
document.getElementById("expenseQuantity");

const expenseUnit =
document.getElementById("expenseUnit");

const expenseUnitPrice =
document.getElementById("expenseUnitPrice");

const expenseAmount =
document.getElementById("expenseAmount");

const workerName =
document.getElementById("workerName");

const salaryType =
document.getElementById("salaryType");

const salaryPeriod =
document.getElementById("salaryPeriod");

const baseSalary =
document.getElementById("baseSalary");

const extraPayment =
document.getElementById("extraPayment");

const salaryDeductions =
document.getElementById("salaryDeductions");

const salaryNetPaid =
document.getElementById("salaryNetPaid");

const expenseDate =
document.getElementById("expenseDate");

const paymentMethod =
document.getElementById("paymentMethod");

const expenseNotes =
document.getElementById("expenseNotes");

const historyPeriodFilter =
document.getElementById("historyPeriodFilter");

const historyCustomRange =
document.getElementById("historyCustomRange");

const historyStartDate =
document.getElementById("historyStartDate");

const historyEndDate =
document.getElementById("historyEndDate");

const historyCategoryFilter =
document.getElementById("historyCategoryFilter");

const historySearch =
document.getElementById("historySearch");

const expenseHistoryBody =
document.getElementById("expenseHistoryBody");

const totalExpensesElement =
document.getElementById("totalExpenses");

const salaryExpensesElement =
document.getElementById("salaryExpenses");

const otherExpensesElement =
document.getElementById("otherExpenses");

const monthExpensesElement =
document.getElementById("monthExpenses");

const totalExpensesLabel =
document.getElementById("totalExpensesLabel");

const expenseInvoiceModal =
document.getElementById("expenseInvoiceModal");

const expenseInvoiceContent =
document.getElementById("expenseInvoiceContent");

const modalInvoiceNo =
document.getElementById("modalInvoiceNo");

// ============================================================
// USER / HEADER
// ============================================================

function getLocalStorageUser() {
const raw = localStorage.getItem("user");

```
if (!raw) {
    window.location.href = "login.html";
    return null;
}

try {
    return JSON.parse(raw);
}
catch (error) {
    console.error("Invalid local user:", error);
    window.location.href = "login.html";
    return null;
}
```

}

adminUser = getLocalStorageUser();

if (adminUser && adminElement) {
adminElement.textContent = adminUser.email || "";
}

if (currentDateElement) {
currentDateElement.textContent = new Date().toLocaleDateString(
"en-GB",
{
day: "2-digit",
month: "long",
year: "numeric"
}
);
}

// ============================================================
// STATUS
// ============================================================

function setSyncStatus(text) {
if (syncStatusElement) {
syncStatusElement.textContent = text;
}
}

// ============================================================
// SALARY CALCULATION
// ============================================================

function updateSalaryNet() {
const base = Number(baseSalary?.value || 0);
const extra = Number(extraPayment?.value || 0);
const deductions = Number(salaryDeductions?.value || 0);

const net = Math.max(
    base + extra - deductions,
    0
);

if (salaryNetPaid) {
    salaryNetPaid.value = net;
}


}

// ============================================================
// GENERAL EXPENSE CALCULATION
// ============================================================

function updateGeneralAmount() {
const quantity = Number(expenseQuantity?.value || 0);
const unitPrice = Number(expenseUnitPrice?.value || 0);

const hasQuantity =
    expenseQuantity?.value !== "" &&
    Number.isFinite(quantity) &&
    quantity > 0;

const hasUnitPrice =
    expenseUnitPrice?.value !== "" &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0;

if (hasQuantity && hasUnitPrice) {
    const total = quantity * unitPrice;

    if (expenseAmount) {
        expenseAmount.value = total;
        expenseAmount.readOnly = true;
    }
}
else if (expenseAmount) {
    expenseAmount.readOnly = false;
}

}

// ============================================================
// FORM TYPE
// ============================================================

function setFormType(type) {
currentFormType = type;

const salary =
    type === "salary";

generalExpenseTab?.classList.toggle("active", !salary);
salaryExpenseTab?.classList.toggle("active", salary);

generalExpenseFields?.classList.toggle(
    "hidden",
    salary
);

salaryFields?.classList.toggle(
    "hidden",
    !salary
);


}

generalExpenseTab?.addEventListener(
"click",
() => setFormType("general")
);

salaryExpenseTab?.addEventListener(
"click",
() => setFormType("salary")
);

// ============================================================
// DATE RANGE FOR EXPENSE HISTORY
// ============================================================

function getHistoryDateRange() {
const period =
historyPeriodFilter?.value || "thisMonth";


const today =
    startOfDay(new Date());

const tomorrow =
    getTomorrow(today);

// --------------------------------------------------------
// TODAY
// --------------------------------------------------------

if (period === "today") {
    return {
        start: today,
        end: tomorrow
    };
}

// --------------------------------------------------------
// YESTERDAY
// --------------------------------------------------------

if (period === "yesterday") {
    const start = new Date(today);

    start.setDate(
        start.getDate() - 1
    );

    return {
        start,
        end: today
    };
}

// --------------------------------------------------------
// LAST 7 DAYS
// Today + previous 6 days
// --------------------------------------------------------

if (period === "7days") {
    const start = new Date(today);

    start.setDate(
        start.getDate() - 6
    );

    return {
        start,
        end: tomorrow
    };
}

// --------------------------------------------------------
// THIS MONTH
// From first day of current month through today
// --------------------------------------------------------

if (period === "thisMonth") {
    const start =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    return {
        start,
        end: tomorrow
    };
}

// --------------------------------------------------------
// PAST MONTH
// Complete previous calendar month
// --------------------------------------------------------

if (period === "previousMonth") {
    const start =
        new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );

    const end =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    return {
        start,
        end
    };
}

// --------------------------------------------------------
// CUSTOM DATE
// --------------------------------------------------------

if (period === "custom") {
    const start =
        parseExpenseDate(
            historyStartDate?.value
        );

    const selectedEnd =
        parseExpenseDate(
            historyEndDate?.value
        );

    if (!start || !selectedEnd) {
        return null;
    }

    const end =
        getTomorrow(selectedEnd);

    if (start >= end) {
        return null;
    }

    return {
        start,
        end
    };
}

// --------------------------------------------------------
// FALLBACK
// This Month
// --------------------------------------------------------

const start =
    new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

return {
    start,
    end: tomorrow
};


}

function invoiceMatchesRange(expense, range) {
if (!range) return true;


const date = parseExpenseDate(expense?.date);

if (!date) return false;

return (
    date >= range.start &&
    date < range.end
);

}

// ============================================================
// FILTERED EXPENSES
// ============================================================

function getFilteredExpenses() {
const range = getHistoryDateRange();


const category =
    historyCategoryFilter?.value || "all";

const search =
    String(historySearch?.value || "")
        .trim()
        .toLowerCase();

return expenses.filter(expense => {
    if (!invoiceMatchesRange(expense, range)) {
        return false;
    }

    const expenseCategory =
        getExpenseCategory(expense);

    if (
        category !== "all" &&
        expenseCategory !== category
    ) {
        return false;
    }

    if (search) {
        const haystack = [
            expense?.invoiceNo,
            expense?.expenseName,
            expense?.workerName,
            expense?.category,
            expense?.notes,
            expense?.paymentMethod
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (!haystack.includes(search)) {
            return false;
        }
    }

    return true;
});


}

// ============================================================
// UPDATE HISTORY CATEGORY OPTIONS
// ============================================================

function refreshCategoryFilter() {
if (!historyCategoryFilter) return;


const currentValue =
    historyCategoryFilter.value || "all";

const categories = [
    ...new Set(
        expenses.map(getExpenseCategory)
    )
].sort((a, b) =>
    String(a).localeCompare(String(b))
);

historyCategoryFilter.innerHTML = `
    <option value="all">All Categories</option>
    ${categories
        .map(
            category =>
                `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
        )
        .join("")}
`;

if (
    categories.includes(currentValue)
) {
    historyCategoryFilter.value =
        currentValue;
}

}

// ============================================================
// STATS
// ============================================================

function getPeriodLabel() {
const value =
historyPeriodFilter?.value || "thisMonth";

const labels = {
    today: "Today",
    yesterday: "Yesterday",
    "7days": "Last 7 days",
    thisMonth: "This month",
    previousMonth: "Past month",
    custom: "Custom date"
};

return labels[value] || "Selected period";


}

function updateStats() {
const range = getHistoryDateRange();


const periodExpenses =
    expenses.filter(expense =>
        invoiceMatchesRange(expense, range)
    );

const total =
    periodExpenses.reduce(
        (sum, expense) =>
            sum + Number(expense?.amount || 0),
        0
    );

const salaryTotal =
    periodExpenses
        .filter(isSalary)
        .reduce(
            (sum, expense) =>
                sum + Number(expense?.amount || 0),
            0
        );

const otherTotal =
    periodExpenses
        .filter(expense => !isSalary(expense))
        .reduce(
            (sum, expense) =>
                sum + Number(expense?.amount || 0),
            0
        );

const currentDate = new Date();

const currentMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
);

const nextMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    1
);

const monthTotal =
    expenses
        .filter(expense => {
            const date = parseExpenseDate(
                expense?.date
            );

            return (
                date &&
                date >= currentMonthStart &&
                date < nextMonthStart
            );
        })
        .reduce(
            (sum, expense) =>
                sum + Number(expense?.amount || 0),
            0
        );

if (totalExpensesElement) {
    totalExpensesElement.textContent =
        `PKR ${formatMoney(total)}`;
}

if (salaryExpensesElement) {
    salaryExpensesElement.textContent =
        `PKR ${formatMoney(salaryTotal)}`;
}

if (otherExpensesElement) {
    otherExpensesElement.textContent =
        `PKR ${formatMoney(otherTotal)}`;
}

if (monthExpensesElement) {
    monthExpensesElement.textContent =
        `PKR ${formatMoney(monthTotal)}`;
}

if (totalExpensesLabel) {
    totalExpensesLabel.textContent =
        getPeriodLabel();
}


}

// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {
if (!expenseHistoryBody) return;


const filtered =
    [...getFilteredExpenses()].sort(
        (a, b) => {
            const dateA =
                parseExpenseDate(a?.date)?.getTime() || 0;

            const dateB =
                parseExpenseDate(b?.date)?.getTime() || 0;

            if (dateB !== dateA) {
                return dateB - dateA;
            }

            return String(
                b?.invoiceNo || ""
            ).localeCompare(
                String(a?.invoiceNo || "")
            );
        }
    );

expenseHistoryBody.innerHTML = "";

if (filtered.length === 0) {
    expenseHistoryBody.innerHTML = `
        <tr>
            <td class="empty-history" colspan="8">
                No expenses found for the selected filters.
            </td>
        </tr>
    `;
    return;
}

filtered.forEach(expense => {
    const row =
        document.createElement("tr");

    const quantity =
        Number(expense?.quantity || 0);

    const quantityText =
        quantity > 0
            ? `${formatMoney(quantity)} ${expense?.unit || ""}`.trim()
            : "-";

    const particular =
        isSalary(expense)
            ? expense?.workerName || "Worker Salary"
            : expense?.expenseName || "Expense";

    row.innerHTML = `
        <td>
            <button
                type="button"
                class="invoice-link"
                data-action="view"
                data-id="${escapeHTML(expense.id)}"
            >
                ${escapeHTML(expense.invoiceNo)}
            </button>
        </td>

        <td>
            ${escapeHTML(formatDate(expense.date))}
        </td>

        <td>
            ${escapeHTML(getExpenseCategory(expense))}
        </td>

        <td>
            ${escapeHTML(particular)}
        </td>

        <td>
            ${escapeHTML(quantityText)}
        </td>

        <td class="amount-cell">
            ${formatMoney(expense.amount)}
        </td>

        <td>
            ${escapeHTML(expense.paymentMethod || "-")}
        </td>

        <td>

            <div class="action-group">

                <button
                    class="action-btn"
                    type="button"
                    data-action="edit"
                    data-id="${escapeHTML(expense.id)}"
                >
                    Edit
                </button>

                <button
                    class="action-btn danger"
                    type="button"
                    data-action="delete"
                    data-id="${escapeHTML(expense.id)}"
                >
                    Delete
                </button>

            </div>

        </td>
    `;

    expenseHistoryBody.appendChild(row);
});


}

// ============================================================
// BUILD EXPENSE OBJECT
// ============================================================

function buildExpenseFromForm() {
const selectedDate =
expenseDate?.value || toInputDate(new Date());


const id =
    editingExpenseId || generateExpenseId();

const existing =
    expenses.find(expense =>
        String(expense.id) === String(id)
    );

if (currentFormType === "salary") {
    const base =
        Number(baseSalary?.value || 0);

    const extra =
        Number(extraPayment?.value || 0);

    const deductions =
        Number(salaryDeductions?.value || 0);

    const amount =
        Math.max(
            base + extra - deductions,
            0
        );

    return {
        ...(existing || {}),

        id,

        invoiceNo:
            existing?.invoiceNo ||
            generateExpenseInvoiceNo(),

        date:
            selectedDate,

        type:
            "expense",

        expenseType:
            "salary",

        category:
            "Worker Salaries",

        expenseName:
            "Worker Salary",

        workerName:
            String(
                workerName?.value || ""
            ).trim(),

        salaryType:
            salaryType?.value ||
            "Monthly",

        salaryPeriod:
            String(
                salaryPeriod?.value || ""
            ).trim(),

        baseSalary:
            base,

        extraPayment:
            extra,

        deductions:
            deductions,

        quantity:
            0,

        unit:
            "",

        unitPrice:
            0,

        amount:
            amount,

        paymentMethod:
            paymentMethod?.value ||
            "Cash",

        notes:
            String(
                expenseNotes?.value || ""
            ).trim(),

        updatedAt:
            new Date().toISOString(),

        createdAt:
            existing?.createdAt ||
            new Date().toISOString()
    };
}

const quantity =
    Number(expenseQuantity?.value || 0);

const unitPrice =
    Number(expenseUnitPrice?.value || 0);

const amount =
    quantity > 0 &&
    unitPrice >= 0 &&
    expenseUnitPrice?.value !== ""
        ? quantity * unitPrice
        : Number(
            expenseAmount?.value || 0
        );

return {
    ...(existing || {}),

    id,

    invoiceNo:
        existing?.invoiceNo ||
        generateExpenseInvoiceNo(),

    date:
        selectedDate,

    type:
        "expense",

    expenseType:
        "general",

    category:
        expenseCategory?.value ||
        "Other",

    expenseName:
        String(
            expenseName?.value || ""
        ).trim(),

    workerName:
        "",

    salaryType:
        "",

    salaryPeriod:
        "",

    baseSalary:
        0,

    extraPayment:
        0,

    deductions:
        0,

    quantity:
        quantity > 0
            ? quantity
            : 0,

    unit:
        expenseUnit?.value ||
        "",

    unitPrice:
        unitPrice > 0
            ? unitPrice
            : 0,

    amount:
        amount,

    paymentMethod:
        paymentMethod?.value ||
        "Cash",

    notes:
        String(
            expenseNotes?.value || ""
        ).trim(),

    updatedAt:
        new Date().toISOString(),

    createdAt:
        existing?.createdAt ||
        new Date().toISOString()
};

}

function generateExpenseInvoiceNo() {
const date =
new Date();


const y =
    date.getFullYear();

const m =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");

const d =
    String(
        date.getDate()
    ).padStart(2, "0");

const suffix =
    String(
        Date.now()
    ).slice(-6);

return `EXP-${y}${m}${d}-${suffix}`;

}

// ============================================================
// VALIDATE FORM
// ============================================================

function validateExpense(expense) {
if (!expense.date) {
alert(
"Please select the expense date."
);


    return false;
}

if (
    !Number.isFinite(
        Number(expense.amount)
    ) ||
    Number(expense.amount) <= 0
) {
    alert(
        "Please enter a valid expense amount."
    );

    return false;
}

if (
    expense.expenseType ===
    "salary"
) {

    if (!expense.workerName) {
        alert(
            "Please enter the worker name."
        );

        return false;
    }

    if (
        Number(
            expense.baseSalary
        ) <= 0
    ) {
        alert(
            "Please enter the base salary."
        );

        return false;
    }
}
else {

    if (!expense.expenseName) {
        alert(
            "Please enter the expense name."
        );

        return false;
    }
}

return true;


}

// ============================================================
// SAVE LOCAL + BACKEND
// ============================================================

async function saveExpense(expense) {


const isEditing =
    Boolean(editingExpenseId);

const endpoint =
    isEditing
        ? `/expenses/${encodeURIComponent(expense.id)}`
        : "/expenses";

const method =
    isEditing
        ? "PUT"
        : "POST";

// --------------------------------------------------------
// Always save locally first.
// --------------------------------------------------------

await saveToOfflineDB(
    "expenses",
    expense
);

// --------------------------------------------------------
// Offline -> queue.
// --------------------------------------------------------

if (!navigator.onLine) {

    await addToSyncQueue({
        endpoint,
        method,
        body: expense
    });

    setSyncStatus(
        "Saved offline · pending sync"
    );

    return true;
}

// --------------------------------------------------------
// Online -> backend immediately.
// --------------------------------------------------------

try {

    const response =
        await fetch(
            `${API}${endpoint}`,
            {
                method,
                headers: {
                    "Content-Type":
                        "application/json"
                },
                credentials:
                    "include",
                body:
                    JSON.stringify(expense)
            }
        );

    if (response.status === 401) {
        window.location.href =
            "login.html";

        return false;
    }

    const responseData =
        await response
            .json()
            .catch(() => null);

    if (!response.ok) {

        alert(
            responseData?.message ||
            `Expense save failed: ${response.status}`
        );

        return false;
    }

    if (responseData?.expense) {

        await saveToOfflineDB(
            "expenses",
            responseData.expense
        );
    }

    setSyncStatus(
        "Synced with backend"
    );

    return true;
}
catch (error) {

    console.error(
        "Expense save request failed. Queuing operation:",
        error
    );

    await addToSyncQueue({
        endpoint,
        method,
        body: expense
    });

    setSyncStatus(
        "Saved locally · pending sync"
    );

    return true;
}


}

// ============================================================
// FORM SUBMIT
// ============================================================

expenseForm?.addEventListener(
"submit",
async event => {

    event.preventDefault();

    const expense =
        buildExpenseFromForm();

    if (!validateExpense(expense)) {
        return;
    }

    saveExpenseBtn.disabled =
        true;

    try {

        const saved =
            await saveExpense(
                expense
            );

        if (!saved) return;

        expenses =
            expenses.filter(
                item =>
                    String(item.id) !==
                    String(expense.id)
            );

        expenses.push(expense);

        refreshCategoryFilter();
        updateStats();
        renderHistory();

        alert(
            editingExpenseId
                ? "Expense updated successfully."
                : "Expense invoice created successfully."
        );

        resetExpenseForm();
    }
    catch (error) {

        console.error(
            "Expense form save error:",
            error
        );

        alert(
            error.message ||
            "Failed to save expense."
        );
    }
    finally {

        saveExpenseBtn.disabled =
            false;
    }
}


);

// ============================================================
// RESET FORM
// ============================================================

function resetExpenseForm() {

editingExpenseId =
    null;

if (editingExpenseIdInput) {
    editingExpenseIdInput.value =
        "";
}

expenseFormTitle.textContent =
    "Add Expense";

saveExpenseBtn.textContent =
    "Create Expense Invoice";

cancelEditBtn?.classList.add(
    "hidden"
);

expenseForm?.reset();

setFormType(
    "general"
);

if (expenseDate) {
    expenseDate.value =
        toInputDate(
            new Date()
        );
}

if (extraPayment) {
    extraPayment.value =
        "0";
}

if (salaryDeductions) {
    salaryDeductions.value =
        "0";
}

if (salaryNetPaid) {
    salaryNetPaid.value =
        "0";
}

if (expenseAmount) {
    expenseAmount.readOnly =
        false;

    expenseAmount.value =
        "";
}


}

cancelEditBtn?.addEventListener(
"click",
resetExpenseForm
);

// ============================================================
// EDIT EXPENSE
// ============================================================

function editExpense(id) {


const expense =
    expenses.find(
        item =>
            String(item.id) ===
            String(id)
    );

if (!expense) return;

editingExpenseId =
    expense.id;

if (editingExpenseIdInput) {
    editingExpenseIdInput.value =
        expense.id;
}

expenseFormTitle.textContent =
    `Edit ${expense.invoiceNo}`;

saveExpenseBtn.textContent =
    "Save Expense Changes";

cancelEditBtn?.classList.remove(
    "hidden"
);

setFormType(
    isSalary(expense)
        ? "salary"
        : "general"
);

if (expenseDate) {
    expenseDate.value =
        toInputDate(
            expense.date
        );
}

if (paymentMethod) {
    paymentMethod.value =
        expense.paymentMethod ||
        "Cash";
}

if (expenseNotes) {
    expenseNotes.value =
        expense.notes ||
        "";
}

if (isSalary(expense)) {

    if (workerName) {
        workerName.value =
            expense.workerName ||
            "";
    }

    if (salaryType) {
        salaryType.value =
            expense.salaryType ||
            "Monthly";
    }

    if (salaryPeriod) {
        salaryPeriod.value =
            expense.salaryPeriod ||
            "";
    }

    if (baseSalary) {
        baseSalary.value =
            expense.baseSalary ||
            0;
    }

    if (extraPayment) {
        extraPayment.value =
            expense.extraPayment ||
            0;
    }

    if (salaryDeductions) {
        salaryDeductions.value =
            expense.deductions ||
            0;
    }

    updateSalaryNet();
}
else {

    if (expenseCategory) {
        expenseCategory.value =
            expense.category ||
            "Other";
    }

    if (expenseName) {
        expenseName.value =
            expense.expenseName ||
            "";
    }

    if (expenseQuantity) {
        expenseQuantity.value =
            expense.quantity ||
            "";
    }

    if (expenseUnit) {
        expenseUnit.value =
            expense.unit ||
            "";
    }

    if (expenseUnitPrice) {
        expenseUnitPrice.value =
            expense.unitPrice ||
            "";
    }

    if (expenseAmount) {
        expenseAmount.value =
            expense.amount ||
            "";
    }

    updateGeneralAmount();
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});


}

// ============================================================
// DELETE EXPENSE
// ============================================================

async function deleteExpense(id) {


const expense =
    expenses.find(
        item =>
            String(item.id) ===
            String(id)
    );

if (!expense) return;

const confirmed =
    confirm(
        `Delete expense invoice ${expense.invoiceNo}?`
    );

if (!confirmed) return;

try {

    await deleteFromOfflineDB(
        "expenses",
        expense.id
    );

    expenses =
        expenses.filter(
            item =>
                String(item.id) !==
                String(expense.id)
        );

    if (navigator.onLine) {

        try {

            const response =
                await fetch(
                    `${API}/expenses/${encodeURIComponent(expense.id)}`,
                    {
                        method:
                            "DELETE",

                        credentials:
                            "include"
                    }
                );

            if (response.status === 401) {
                window.location.href =
                    "login.html";

                return;
            }

            if (
                !response.ok &&
                response.status !== 404
            ) {

                const responseData =
                    await response
                        .json()
                        .catch(
                            () => null
                        );

                alert(
                    responseData?.message ||
                    `Delete failed: ${response.status}`
                );

                return;
            }

            setSyncStatus(
                "Deletion synced"
            );
        }
        catch (error) {

            console.error(
                "Online delete failed. Queuing:",
                error
            );

            await addToSyncQueue({
                endpoint:
                    `/expenses/${encodeURIComponent(expense.id)}`,

                method:
                    "DELETE",

                body:
                    null
            });

            setSyncStatus(
                "Deleted locally · pending sync"
            );
        }
    }
    else {

        await addToSyncQueue({
            endpoint:
                `/expenses/${encodeURIComponent(expense.id)}`,

            method:
                "DELETE",

            body:
                null
        });

        setSyncStatus(
            "Deleted offline · pending sync"
        );
    }

    refreshCategoryFilter();
    updateStats();
    renderHistory();
}
catch (error) {

    console.error(
        "Expense delete error:",
        error
    );

    alert(
        "Failed to delete expense."
    );
}


}

// ============================================================
// HISTORY ACTIONS
// ============================================================

expenseHistoryBody?.addEventListener(
"click",
event => {


    const button =
        event.target.closest(
            "[data-action]"
        );

    if (!button) return;

    const action =
        button.dataset.action;

    const id =
        button.dataset.id;

    if (action === "view") {
        openExpenseInvoice(id);
    }
    else if (action === "edit") {
        editExpense(id);
    }
    else if (action === "delete") {
        deleteExpense(id);
    }
}


);

// ============================================================
// INVOICE MODAL
// ============================================================

function openExpenseInvoice(id) {


const expense =
    expenses.find(
        item =>
            String(item.id) ===
            String(id)
    );

if (!expense) return;

selectedInvoice =
    expense;

if (modalInvoiceNo) {
    modalInvoiceNo.textContent =
        expense.invoiceNo ||
        expense.id;
}

const particular =
    isSalary(expense)
        ? expense.workerName ||
          "Worker Salary"
        : expense.expenseName ||
          "Expense";

const quantityText =
    Number(expense.quantity || 0) > 0
        ? `${formatMoney(expense.quantity)} ${expense.unit || ""}`.trim()
        : "-";

if (expenseInvoiceContent) {

    expenseInvoiceContent.innerHTML = `

        <div class="invoice-title">

            <div>

                <strong>
                    FrostyOps
                </strong>

                <div class="invoice-meta">
                    Company Expense Invoice
                </div>

            </div>

            <div class="invoice-meta">
                ${escapeHTML(
                    formatDate(
                        expense.date
                    )
                )}
            </div>

        </div>


        <div class="invoice-grid">

            <div>

                <div class="invoice-item-label">
                    Invoice No
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        expense.invoiceNo
                    )}
                </div>

            </div>


            <div>

                <div class="invoice-item-label">
                    Category
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        getExpenseCategory(
                            expense
                        )
                    )}
                </div>

            </div>


            <div>

                <div class="invoice-item-label">
                    Particular
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        particular
                    )}
                </div>

            </div>


            <div>

                <div class="invoice-item-label">
                    Quantity
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        quantityText
                    )}
                </div>

            </div>


            <div>

                <div class="invoice-item-label">
                    Unit Price
                </div>

                <div class="invoice-item-value">
                    PKR ${formatMoney(
                        expense.unitPrice ||
                        0
                    )}
                </div>

            </div>


            <div>

                <div class="invoice-item-label">
                    Payment Method
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        expense.paymentMethod ||
                        "-"
                    )}
                </div>

            </div>


            ${
                isSalary(expense)
                    ? `
                        <div>

                            <div class="invoice-item-label">
                                Salary Period
                            </div>

                            <div class="invoice-item-value">
                                ${escapeHTML(
                                    expense.salaryPeriod ||
                                    "-"
                                )}
                            </div>

                        </div>


                        <div>

                            <div class="invoice-item-label">
                                Salary Type
                            </div>

                            <div class="invoice-item-value">
                                ${escapeHTML(
                                    expense.salaryType ||
                                    "-"
                                )}
                            </div>

                        </div>


                        <div>

                            <div class="invoice-item-label">
                                Base Salary
                            </div>

                            <div class="invoice-item-value">
                                PKR ${formatMoney(
                                    expense.baseSalary ||
                                    0
                                )}
                            </div>

                        </div>


                        <div>

                            <div class="invoice-item-label">
                                Bonus / Extra
                            </div>

                            <div class="invoice-item-value">
                                PKR ${formatMoney(
                                    expense.extraPayment ||
                                    0
                                )}
                            </div>

                        </div>


                        <div>

                            <div class="invoice-item-label">
                                Deductions
                            </div>

                            <div class="invoice-item-value">
                                PKR ${formatMoney(
                                    expense.deductions ||
                                    0
                                )}
                            </div>

                        </div>
                    `
                    : ""
            }


            <div>

                <div class="invoice-item-label">
                    Notes
                </div>

                <div class="invoice-item-value">
                    ${escapeHTML(
                        expense.notes ||
                        "-"
                    )}
                </div>

            </div>

        </div>


        <div class="invoice-total">

            <span>
                Total Expense
            </span>

            <span>
                PKR ${formatMoney(
                    expense.amount
                )}
            </span>

        </div>

    `;
}

expenseInvoiceModal?.classList.add(
    "show"
);

expenseInvoiceModal?.setAttribute(
    "aria-hidden",
    "false"
);


}

function closeExpenseInvoice() {

selectedInvoice =
    null;

expenseInvoiceModal?.classList.remove(
    "show"
);

expenseInvoiceModal?.setAttribute(
    "aria-hidden",
    "true"
);

}

document
.getElementById(
"closeExpenseModal"
)
?.addEventListener(
"click",
closeExpenseInvoice
);

document
.getElementById(
"closeExpenseModalBottom"
)
?.addEventListener(
"click",
closeExpenseInvoice
);

expenseInvoiceModal?.addEventListener(
"click",
event => {

    if (
        event.target ===
        expenseInvoiceModal
    ) {
        closeExpenseInvoice();
    }
}


);

// ============================================================
// PRINT EXPENSE INVOICE
// ============================================================

document
.getElementById(
"printExpenseBtn"
)
?.addEventListener(
"click",
() => {


        if (!selectedInvoice) return;

        const expense =
            selectedInvoice;

        const particular =
            isSalary(expense)
                ? expense.workerName ||
                  "Worker Salary"
                : expense.expenseName ||
                  "Expense";

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=700,height=800"
            );

        if (!printWindow) {

            alert(
                "Please allow popups to print the expense invoice."
            );

            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    ${escapeHTML(
                        expense.invoiceNo
                    )}
                </title>

                <style>

                    body{
                        font-family:Arial,sans-serif;
                        padding:30px;
                        color:#222;
                    }

                    h1{
                        font-size:22px;
                        margin:0 0 4px;
                    }

                    h2{
                        font-size:15px;
                        margin:0 0 18px;
                        color:#666;
                    }

                    table{
                        width:100%;
                        border-collapse:collapse;
                        margin-top:18px;
                    }

                    td{
                        padding:9px 0;
                        border-bottom:1px solid #ddd;
                    }

                    td:first-child{
                        color:#777;
                        width:38%;
                    }

                    .total{
                        font-size:18px;
                        font-weight:700;
                        text-align:right;
                        margin-top:20px;
                    }

                </style>

            </head>


            <body>

                <h1>
                    FrostyOps
                </h1>

                <h2>
                    Company Expense Invoice
                </h2>


                <table>

                    <tr>
                        <td>
                            Invoice No
                        </td>

                        <td>
                            ${escapeHTML(
                                expense.invoiceNo
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Date
                        </td>

                        <td>
                            ${escapeHTML(
                                formatDate(
                                    expense.date
                                )
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Category
                        </td>

                        <td>
                            ${escapeHTML(
                                getExpenseCategory(
                                    expense
                                )
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Particular
                        </td>

                        <td>
                            ${escapeHTML(
                                particular
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Quantity
                        </td>

                        <td>
                            ${escapeHTML(
                                Number(
                                    expense.quantity ||
                                    0
                                ) > 0
                                    ? `${formatMoney(
                                        expense.quantity
                                      )} ${expense.unit || ""}`.trim()
                                    : "-"
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Payment
                        </td>

                        <td>
                            ${escapeHTML(
                                expense.paymentMethod ||
                                "-"
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>
                            Notes
                        </td>

                        <td>
                            ${escapeHTML(
                                expense.notes ||
                                "-"
                            )}
                        </td>
                    </tr>

                </table>


                <div class="total">
                    Total Expense: PKR ${formatMoney(
                        expense.amount
                    )}
                </div>


                <script>
                    window.onload=function(){
                        window.print();
                    };

                    window.onafterprint=function(){
                        window.close();
                    };
                <\/script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }
);


// ============================================================
// LOAD LOCAL EXPENSES
// ============================================================

async function loadLocalExpenses() {


const local =
    await getAllFromOfflineDB(
        "expenses"
    );

expenses =
    Array.isArray(local)
        ? local
        : [];


}

// ============================================================
// FETCH EXPENSES FROM BACKEND
// ============================================================

async function fetchExpensesFromBackend() {

const response =
    await fetch(
        `${API}/expenses`,
        {
            method:
                "GET",

            credentials:
                "include"
        }
    );

if (response.status === 401) {

    window.location.href =
        "login.html";

    return null;
}

if (!response.ok) {

    throw new Error(
        `Expense fetch failed: ${response.status}`
    );
}

const data =
    await response.json();

if (!Array.isArray(data.expenses)) {

    throw new Error(
        "Invalid expense response."
    );
}

await clearOfflineStore(
    "expenses"
);

if (data.expenses.length > 0) {

    await saveManyToOfflineDB(
        "expenses",
        data.expenses
    );
}

expenses =
    [...data.expenses];

return expenses;


}

// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeExpensesPage() {


try {

    resetExpenseForm();

    await loadLocalExpenses();

    refreshCategoryFilter();
    updateStats();
    renderHistory();

    setSyncStatus(
        navigator.onLine
            ? "Loading latest data..."
            : "Offline · using local data"
    );

    if (navigator.onLine) {

        await processSyncQueue();

        try {

            await fetchExpensesFromBackend();

            refreshCategoryFilter();
            updateStats();
            renderHistory();

            setSyncStatus(
                "Synced with backend"
            );
        }
        catch (error) {

            console.error(
                "Backend expense refresh failed:",
                error
            );

            setSyncStatus(
                "Backend unavailable · using local data"
            );
        }
    }
}
catch (error) {

    console.error(
        "Expense page initialization failed:",
        error
    );

    setSyncStatus(
        "Failed to load expense data"
    );
}


}

// ============================================================
// FILTER EVENTS
// ============================================================

historyPeriodFilter?.addEventListener(
"change",
() => {


    const isCustom =
        historyPeriodFilter.value ===
        "custom";

    historyCustomRange?.classList.toggle(
        "hidden",
        !isCustom
    );

    updateStats();
    renderHistory();
}


);

historyStartDate?.addEventListener(
"change",
() => {


    updateStats();
    renderHistory();
}


);

historyEndDate?.addEventListener(
"change",
() => {


    updateStats();
    renderHistory();
}

);

historyCategoryFilter?.addEventListener(
"change",
renderHistory
);

historySearch?.addEventListener(
"input",
renderHistory
);

// ============================================================
// CALCULATION EVENTS
// ============================================================

expenseQuantity?.addEventListener(
"input",
updateGeneralAmount
);

expenseUnitPrice?.addEventListener(
"input",
updateGeneralAmount
);

expenseAmount?.addEventListener(
"input",
updateGeneralAmount
);

baseSalary?.addEventListener(
"input",
updateSalaryNet
);

extraPayment?.addEventListener(
"input",
updateSalaryNet
);

salaryDeductions?.addEventListener(
"input",
updateSalaryNet
);

// ============================================================
// MOBILE SIDEBAR
// ============================================================

const sidebar =
document.getElementById(
"sidebar"
);

const overlay =
document.getElementById(
"overlay"
);

const hamburgerBtn =
document.getElementById(
"hamburgerBtn"
);

function openSidebar() {

sidebar?.classList.add(
    "open"
);

overlay?.classList.add(
    "show"
);

}

function closeSidebar() {

sidebar?.classList.remove(
    "open"
);

overlay?.classList.remove(
    "show"
);

}

hamburgerBtn?.addEventListener(
"click",
() => {

   if (
        sidebar?.classList.contains(
            "open"
        )
    ) {
        closeSidebar();
    }
    else {
        openSidebar();
    }
}
);

overlay?.addEventListener(
"click",
closeSidebar
);

// ============================================================
// ONLINE EVENT
// ============================================================

let expenseOnlineSyncRunning =
false;

window.addEventListener(
"online",
async () => {

    if (
        expenseOnlineSyncRunning
    ) {
        return;
    }

    expenseOnlineSyncRunning =
        true;

    try {

        setSyncStatus(
            "Internet restored · synchronizing..."
        );

        await processSyncQueue();

        try {

            await fetchExpensesFromBackend();
        }
        catch (error) {

            console.error(
                "Expense online refresh failed:",
                error
            );
        }

        refreshCategoryFilter();
        updateStats();
        renderHistory();

        setSyncStatus(
            "Synced with backend"
        );
    }
    catch (error) {

        console.error(
            "Expense synchronization failed:",
            error
        );

        setSyncStatus(
            "Sync failed · local data preserved"
        );
    }
    finally {

        expenseOnlineSyncRunning =
            false;
    }
}


);

// ============================================================
// START
// ============================================================

initializeExpensesPage();
