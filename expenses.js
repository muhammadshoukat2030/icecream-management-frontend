// ============================================================
// FROSTYOPS - EXPENSES
// Offline-first expense management
// ============================================================

const API =
    window.APP_CONFIG.API;

let adminUser = null;
let expenses = [];
let expenseProfiles = [];
let editingExpenseId = null;
let currentFormType = "general";
let selectedInvoice = null;
let selectedProfileForDetails = null;
let profileDetailsExpenses = [];
let profileDetailsEditingId = null;
let profileListFilter = "all";


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

const generalProfileSelect =
    document.getElementById("generalProfileSelect");

const workerProfileSelect =
    document.getElementById("workerProfileSelect");

const addExpenseProfileBtn =
    document.getElementById("addExpenseProfileBtn");

const expenseProfilesGrid =
    document.getElementById("expenseProfilesGrid");

const profileSearch =
    document.getElementById("profileSearch");

const profileTypeTabs =
    document.getElementById("profileTypeTabs");

const expenseProfileModal =
    document.getElementById("expenseProfileModal");

const expenseProfileModalTitle =
    document.getElementById("expenseProfileModalTitle");

const expenseProfileForm =
    document.getElementById("expenseProfileForm");

const profileType =
    document.getElementById("profileType");

const profileName =
    document.getElementById("profileName");

const profilePhone =
    document.getElementById("profilePhone");

const profileEmail =
    document.getElementById("profileEmail");

const profileAddress =
    document.getElementById("profileAddress");

const profileRole =
    document.getElementById("profileRole");

const profileSalaryType =
    document.getElementById("profileSalaryType");

const profileSalaryAmount =
    document.getElementById("profileSalaryAmount");

const profileOpeningBalance =
    document.getElementById("profileOpeningBalance");

const profileStatus =
    document.getElementById("profileStatus");

const profileNotes =
    document.getElementById("profileNotes");

const saveExpenseProfileBtn =
    document.getElementById("saveExpenseProfileBtn");

const cancelExpenseProfileBtn =
    document.getElementById("cancelExpenseProfileBtn");

const closeExpenseProfileModal =
    document.getElementById("closeExpenseProfileModal");

const expenseProfileDetailsModal =
    document.getElementById("expenseProfileDetailsModal");

const closeExpenseProfileDetailsModal =
    document.getElementById("closeExpenseProfileDetailsModal");

const profileDetailsType =
    document.getElementById("profileDetailsType");

const profileDetailsName =
    document.getElementById("profileDetailsName");

const profileDetailsMeta =
    document.getElementById("profileDetailsMeta");

const profileDetailsPeriod =
    document.getElementById("profileDetailsPeriod");

const profileDetailsCustomRange =
    document.getElementById("profileDetailsCustomRange");

const profileDetailsStartDate =
    document.getElementById("profileDetailsStartDate");

const profileDetailsEndDate =
    document.getElementById("profileDetailsEndDate");

const profileOpeningValue =
    document.getElementById("profileOpeningValue");

const profilePeriodExpenseValue =
    document.getElementById("profilePeriodExpenseValue");

const profileAllTimeExpenseValue =
    document.getElementById("profileAllTimeExpenseValue");

const profileTotalOwedValue =
    document.getElementById("profileTotalOwedValue");

const profileDetailSummaryLine =
    document.getElementById("profileDetailSummaryLine");

const profileDetailsExpenseBody =
    document.getElementById("profileDetailsExpenseBody");

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
    currentFormType = type === "salary"
        ? "salary"
        : "general";

    const salary = currentFormType === "salary";

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
// EXPENSE PROFILES
// ============================================================

function getProfileById(id) {
    if (!id) return null;

    return expenseProfiles.find(profile =>
        String(profile?._id || "") === String(id)
    ) || null;
}

function getProfileName(profileId, fallback = "Unassigned") {
    const profile = getProfileById(profileId);

    if (profile?.name) {
        return profile.name;
    }

    return fallback;
}

function getExpenseProfileTypeLabel(type) {
    return type === "worker"
        ? "Worker"
        : "Vendor / Payee";
}

function getProfileExpenses(profileId) {
    return expenses.filter(expense =>
        String(expense?.profileId || "") === String(profileId)
    );
}

function getProfileAllTimeExpenseTotal(profileId) {
    return getProfileExpenses(profileId).reduce(
        (sum, expense) =>
            sum + Number(expense?.amount || 0),
        0
    );
}

function getProfileRecordedObligation(profileId) {
    const profile = getProfileById(profileId);

    return (
        Number(profile?.openingBalance || 0) +
        getProfileAllTimeExpenseTotal(profileId)
    );
}

function refreshProfileSelectors(
    selectedGeneralId = generalProfileSelect?.value || "",
    selectedWorkerId = workerProfileSelect?.value || ""
) {

    if (generalProfileSelect) {
        generalProfileSelect.innerHTML = `
            <option value="">Select vendor / payee</option>
            ${expenseProfiles
                .filter(profile =>
                    profile?.status === "active" ||
                    String(profile?._id || "") === String(selectedGeneralId)
                )
                .filter(profile => profile?.profileType === "vendor")
                .sort((a, b) =>
                    String(a?.name || "").localeCompare(
                        String(b?.name || "")
                    )
                )
                .map(profile => `
                    <option value="${escapeHTML(profile._id)}">
                        ${escapeHTML(profile.name)}${profile.status === "inactive" ? " (Inactive)" : ""}
                    </option>
                `)
                .join("")}
        `;

        generalProfileSelect.value =
            selectedGeneralId &&
            expenseProfiles.some(profile =>
                String(profile?._id || "") === String(selectedGeneralId)
            )
                ? String(selectedGeneralId)
                : "";
    }

    if (workerProfileSelect) {
        workerProfileSelect.innerHTML = `
            <option value="">Select worker</option>
            ${expenseProfiles
                .filter(profile =>
                    profile?.status === "active" ||
                    String(profile?._id || "") === String(selectedWorkerId)
                )
                .filter(profile => profile?.profileType === "worker")
                .sort((a, b) =>
                    String(a?.name || "").localeCompare(
                        String(b?.name || "")
                    )
                )
                .map(profile => `
                    <option value="${escapeHTML(profile._id)}">
                        ${escapeHTML(profile.name)}${profile.status === "inactive" ? " (Inactive)" : ""}
                    </option>
                `)
                .join("")}
        `;

        workerProfileSelect.value =
            selectedWorkerId &&
            expenseProfiles.some(profile =>
                String(profile?._id || "") === String(selectedWorkerId)
            )
                ? String(selectedWorkerId)
                : "";
    }
}

function applyWorkerProfileDefaults() {
    const profile =
        getProfileById(workerProfileSelect?.value);

    if (!profile) return;

    if (salaryType && profile.salaryType) {
        salaryType.value = profile.salaryType;
    }

    if (
        baseSalary &&
        Number(profile.salaryAmount || 0) > 0
    ) {
        baseSalary.value =
            Number(profile.salaryAmount);
    }

    updateSalaryNet();
}

function renderExpenseProfiles() {
    if (!expenseProfilesGrid) return;

    const search =
        String(profileSearch?.value || "")
            .trim()
            .toLowerCase();

    const filtered =
        expenseProfiles
            .filter(profile =>
                profileListFilter === "all" ||
                profile?.profileType === profileListFilter
            )
            .filter(profile => {
                if (!search) return true;

                const haystack = [
                    profile?.name,
                    profile?.phone,
                    profile?.email,
                    profile?.address,
                    profile?.role
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(search);
            })
            .sort((a, b) =>
                String(a?.name || "").localeCompare(
                    String(b?.name || "")
                )
            );

    expenseProfilesGrid.innerHTML = "";

    if (filtered.length === 0) {
        expenseProfilesGrid.innerHTML = `
            <div class="profile-card-empty">
                No expense profiles found.
            </div>
        `;
        return;
    }

    filtered.forEach(profile => {
        const totalExpenses =
            getProfileAllTimeExpenseTotal(profile._id);

        const recordedObligation =
            getProfileRecordedObligation(profile._id);

        const expenseCount =
            getProfileExpenses(profile._id).length;

        const workerInfo =
            profile.profileType === "worker"
                ? [
                    profile.role,
                    profile.salaryType
                        ? `${profile.salaryType} · PKR ${formatMoney(profile.salaryAmount || 0)}`
                        : ""
                ]
                    .filter(Boolean)
                    .join(" · ")
                : "Vendor / Payee";

        const card =
            document.createElement("article");

        card.className = "profile-card";

        card.innerHTML = `
            <div class="profile-card-head">
                <div>
                    <h3 class="profile-card-title">
                        ${escapeHTML(profile.name)}
                    </h3>
                    <div class="profile-card-sub">
                        ${escapeHTML(workerInfo || getExpenseProfileTypeLabel(profile.profileType))}
                    </div>
                </div>
                <span class="profile-status ${profile.status === "active" ? "active" : ""}">
                    ${escapeHTML(profile.status || "active")}
                </span>
            </div>

            <div class="profile-card-stats">
                <div class="profile-mini-stat">
                    <span>Recorded Expenses</span>
                    <strong>PKR ${formatMoney(totalExpenses)}</strong>
                </div>
                <div class="profile-mini-stat">
                    <span>Total Recorded Obligation</span>
                    <strong>PKR ${formatMoney(recordedObligation)}</strong>
                </div>
                <div class="profile-mini-stat">
                    <span>Opening Balance</span>
                    <strong>PKR ${formatMoney(profile.openingBalance || 0)}</strong>
                </div>
                <div class="profile-mini-stat">
                    <span>Invoices</span>
                    <strong>${formatMoney(expenseCount)}</strong>
                </div>
            </div>

            <div class="profile-card-actions">
                <button class="action-btn" type="button" data-profile-action="view" data-id="${escapeHTML(profile._id)}">View</button>
                <button class="action-btn" type="button" data-profile-action="edit" data-id="${escapeHTML(profile._id)}">Edit</button>
                <button class="action-btn danger" type="button" data-profile-action="delete" data-id="${escapeHTML(profile._id)}">Delete</button>
            </div>
        `;

        expenseProfilesGrid.appendChild(card);
    });
}

function setProfileFormType(type) {
    const isWorker = type === "worker";

    document
        .querySelectorAll(".worker-profile-field")
        .forEach(field =>
            field.classList.toggle("hidden", !isWorker)
        );

    if (!isWorker) {
        if (profileRole) profileRole.value = "";
        if (profileSalaryType) profileSalaryType.value = "";
        if (profileSalaryAmount) profileSalaryAmount.value = "";
    }
}

function resetProfileForm() {
    profileDetailsEditingId = null;

    expenseProfileForm?.reset();

    if (profileType) {
        profileType.disabled = false;
        profileType.value = "vendor";
    }

    setProfileFormType("vendor");

    if (profileOpeningBalance) {
        profileOpeningBalance.value = "0";
    }

    if (profileStatus) {
        profileStatus.value = "active";
    }

    if (expenseProfileModalTitle) {
        expenseProfileModalTitle.textContent =
            "Add Profile";
    }

    if (saveExpenseProfileBtn) {
        saveExpenseProfileBtn.textContent =
            "Create Profile";
    }
}

function openProfileForm(profile = null) {
    resetProfileForm();

    if (profile) {
        profileDetailsEditingId = profile._id;

        expenseProfileModalTitle.textContent =
            "Edit Profile";

        saveExpenseProfileBtn.textContent =
            "Save Profile Changes";

        profileType.value =
            profile.profileType || "vendor";

        profileName.value =
            profile.name || "";

        profilePhone.value =
            profile.phone || "";

        profileEmail.value =
            profile.email || "";

        profileAddress.value =
            profile.address || "";

        profileRole.value =
            profile.role || "";

        profileSalaryType.value =
            profile.salaryType || "";

        profileSalaryAmount.value =
            profile.salaryAmount || "";

        profileOpeningBalance.value =
            profile.openingBalance || 0;

        profileStatus.value =
            profile.status || "active";

        profileNotes.value =
            profile.notes || "";

        const linkedCount =
            getProfileExpenses(profile._id).length;

        profileType.disabled = linkedCount > 0;
    }

    setProfileFormType(profileType.value);

    expenseProfileModal?.classList.add("show");
    expenseProfileModal?.setAttribute("aria-hidden", "false");
}

function closeProfileForm() {
    expenseProfileModal?.classList.remove("show");
    expenseProfileModal?.setAttribute("aria-hidden", "true");
    resetProfileForm();
}

async function saveExpenseProfile() {
    if (!navigator.onLine) {
        alert(
            "Expense profiles require an internet connection to create or edit. Cached profiles remain available offline."
        );
        return;
    }

    const name =
        String(profileName?.value || "").trim();

    if (!name) {
        alert("Please enter the profile name.");
        return;
    }

    const type =
        profileType?.value === "worker"
            ? "worker"
            : "vendor";

    const salaryAmount =
        Number(profileSalaryAmount?.value || 0);

    const openingBalance =
        Number(profileOpeningBalance?.value || 0);

    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        alert("Please enter a valid opening balance.");
        return;
    }

    if (!Number.isFinite(salaryAmount) || salaryAmount < 0) {
        alert("Please enter a valid salary amount.");
        return;
    }

    if (type === "worker" && profileSalaryType?.value && salaryAmount <= 0) {
        alert("Please enter a salary amount for the worker.");
        return;
    }

    saveExpenseProfileBtn.disabled = true;

    try {
        const editing = Boolean(profileDetailsEditingId);

        const payload = {
            profileType: type,
            name,
            phone: String(profilePhone?.value || "").trim(),
            email: String(profileEmail?.value || "").trim().toLowerCase(),
            address: String(profileAddress?.value || "").trim(),
            role: type === "worker"
                ? String(profileRole?.value || "").trim()
                : "",
            salaryType: type === "worker"
                ? (profileSalaryType?.value || "")
                : "",
            salaryAmount: type === "worker"
                ? salaryAmount
                : 0,
            openingBalance,
            status: profileStatus?.value === "inactive"
                ? "inactive"
                : "active",
            notes: String(profileNotes?.value || "").trim()
        };

        const endpoint = editing
            ? `/expense-profiles/${encodeURIComponent(profileDetailsEditingId)}`
            : "/expense-profiles";

        const response = await fetch(
            `${API}${endpoint}`,
            {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const data =
            await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Profile save failed: ${response.status}`
            );
        }

        const savedProfile =
            data?.profile;

        if (!savedProfile?._id) {
            throw new Error(
                "The backend did not return the saved profile."
            );
        }

        if (editing) {
            expenseProfiles =
                expenseProfiles.map(profile =>
                    String(profile?._id) === String(savedProfile._id)
                        ? savedProfile
                        : profile
                );
        }
        else {
            expenseProfiles = [
                ...expenseProfiles,
                savedProfile
            ];
        }

        await saveToOfflineDB(
            "expenseProfiles",
            savedProfile
        );

        refreshProfileSelectors(
            generalProfileSelect?.value || "",
            workerProfileSelect?.value || ""
        );

        renderExpenseProfiles();
        closeProfileForm();

        setSyncStatus(
            editing
                ? "Profile updated and cached"
                : "Profile created and cached"
        );

    }
    catch (error) {

        console.error(
            "Expense profile save failed:",
            error
        );

        alert(
            error.message ||
            "Failed to save expense profile."
        );

    }
    finally {
        saveExpenseProfileBtn.disabled = false;
    }
}

async function deleteExpenseProfile(id) {
    const profile = getProfileById(id);

    if (!profile) return;

    if (!navigator.onLine) {
        alert(
            "Expense profiles require an internet connection for deletion."
        );
        return;
    }

    const confirmed = confirm(
        `Delete expense profile ${profile.name}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API}/expense-profiles/${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const data =
            await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Profile deletion failed: ${response.status}`
            );
        }

        expenseProfiles =
            expenseProfiles.filter(item =>
                String(item?._id) !== String(id)
            );

        await deleteFromOfflineDB(
            "expenseProfiles",
            id
        );

        refreshProfileSelectors();
        renderExpenseProfiles();

        setSyncStatus("Profile deleted");

    }
    catch (error) {

        console.error(
            "Expense profile deletion failed:",
            error
        );

        alert(
            error.message ||
            "Failed to delete expense profile."
        );
    }
}

function getProfileDetailsDateRange() {
    const period =
        profileDetailsPeriod?.value || "allTime";

    const today =
        startOfDay(new Date());

    if (period === "allTime") {
        return null;
    }

    if (period === "thisMonth") {
        return {
            start: new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            ),
            end: getTomorrow(today)
        };
    }

    if (period === "thisWeek") {
        const start = new Date(today);
        const day = start.getDay();
        const distance = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - distance);

        return {
            start,
            end: getTomorrow(today)
        };
    }

    if (period === "custom") {
        const start = parseExpenseDate(
            profileDetailsStartDate?.value
        );

        const selectedEnd = parseExpenseDate(
            profileDetailsEndDate?.value
        );

        if (!start || !selectedEnd) {
            return null;
        }

        return {
            start,
            end: getTomorrow(selectedEnd)
        };
    }

    return null;
}

function renderProfileDetails() {
    if (!selectedProfileForDetails) return;

    const profile = selectedProfileForDetails;
    const allExpenses =
        Array.isArray(profileDetailsExpenses)
            ? profileDetailsExpenses
            : getProfileExpenses(profile._id);

    const range =
        getProfileDetailsDateRange();

    const periodExpenses =
        allExpenses.filter(expense =>
            invoiceMatchesRange(expense, range)
        );

    const selectedPeriodTotal =
        periodExpenses.reduce(
            (sum, expense) =>
                sum + Number(expense?.amount || 0),
            0
        );

    const allTimeTotal =
        allExpenses.reduce(
            (sum, expense) =>
                sum + Number(expense?.amount || 0),
            0
        );

    const openingBalance =
        Number(profile.openingBalance || 0);

    const recordedObligation =
        openingBalance + allTimeTotal;

    if (profileDetailsType) {
        profileDetailsType.textContent =
            getExpenseProfileTypeLabel(profile.profileType);
    }

    if (profileDetailsName) {
        profileDetailsName.textContent =
            profile.name || "Profile";
    }

    if (profileDetailsMeta) {
        profileDetailsMeta.textContent =
            profile.profileType === "worker"
                ? [
                    profile.role,
                    profile.salaryType,
                    Number(profile.salaryAmount || 0) > 0
                        ? `PKR ${formatMoney(profile.salaryAmount)}`
                        : ""
                ]
                    .filter(Boolean)
                    .join(" · ")
                : [
                    profile.phone,
                    profile.email
                ]
                    .filter(Boolean)
                    .join(" · ") ||
                  "Vendor / Payee";
    }

    if (profileOpeningValue) {
        profileOpeningValue.textContent =
            `PKR ${formatMoney(openingBalance)}`;
    }

    if (profilePeriodExpenseValue) {
        profilePeriodExpenseValue.textContent =
            `PKR ${formatMoney(selectedPeriodTotal)}`;
    }

    if (profileAllTimeExpenseValue) {
        profileAllTimeExpenseValue.textContent =
            `PKR ${formatMoney(allTimeTotal)}`;
    }

    if (profileTotalOwedValue) {
        profileTotalOwedValue.textContent =
            `PKR ${formatMoney(recordedObligation)}`;
    }

    if (profileDetailSummaryLine) {
        profileDetailSummaryLine.textContent =
            `${periodExpenses.length} invoice${periodExpenses.length === 1 ? "" : "s"} in the selected period · ${allExpenses.length} invoice${allExpenses.length === 1 ? "" : "s"} all time. Payments are not included yet.`;
    }

    if (profileDetailsExpenseBody) {
        profileDetailsExpenseBody.innerHTML = "";

        if (periodExpenses.length === 0) {
            profileDetailsExpenseBody.innerHTML = `
                <tr>
                    <td class="empty-history" colspan="5">
                        No linked expense invoices for the selected period.
                    </td>
                </tr>
            `;
        }
        else {
            [...periodExpenses]
                .sort((a, b) => {
                    const dateA =
                        parseExpenseDate(a?.date)?.getTime() || 0;
                    const dateB =
                        parseExpenseDate(b?.date)?.getTime() || 0;
                    return dateB - dateA;
                })
                .forEach(expense => {
                    const row = document.createElement("tr");

                    const particular =
                        isSalary(expense)
                            ? expense?.workerName || profile.name || "Worker Salary"
                            : expense?.expenseName || "Expense";

                    row.innerHTML = `
                        <td>
                            <button
                                type="button"
                                class="invoice-link"
                                data-profile-expense-id="${escapeHTML(expense.id)}"
                            >
                                ${escapeHTML(expense.invoiceNo || expense.id)}
                            </button>
                        </td>
                        <td>${escapeHTML(formatDate(expense.date))}</td>
                        <td>${escapeHTML(getExpenseCategory(expense))}</td>
                        <td>${escapeHTML(particular)}</td>
                        <td class="amount-cell">${formatMoney(expense.amount)}</td>
                    `;

                    profileDetailsExpenseBody.appendChild(row);
                });
        }
    }
}

async function openProfileDetails(id) {
    const localProfile = getProfileById(id);

    if (!localProfile) return;

    selectedProfileForDetails = localProfile;
    profileDetailsExpenses =
        getProfileExpenses(id);

    if (profileDetailsPeriod) {
        profileDetailsPeriod.value = "allTime";
    }

    if (profileDetailsCustomRange) {
        profileDetailsCustomRange.classList.add("hidden");
    }

    renderProfileDetails();

    expenseProfileDetailsModal?.classList.add("show");
    expenseProfileDetailsModal?.setAttribute("aria-hidden", "false");

    if (!navigator.onLine) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/expense-profiles/${encodeURIComponent(id)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Profile detail fetch failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (data?.profile?._id) {
            selectedProfileForDetails = data.profile;

            expenseProfiles =
                expenseProfiles.map(profile =>
                    String(profile?._id) === String(data.profile._id)
                        ? data.profile
                        : profile
                );

            await saveToOfflineDB(
                "expenseProfiles",
                data.profile
            );
        }

        if (Array.isArray(data?.expenses)) {
            profileDetailsExpenses =
                data.expenses;
        }

        renderProfileDetails();

    }
    catch (error) {
        console.error(
            "Expense profile details refresh failed:",
            error
        );
    }
}

function closeProfileDetails() {
    selectedProfileForDetails = null;
    profileDetailsExpenses = [];

    expenseProfileDetailsModal?.classList.remove("show");
    expenseProfileDetailsModal?.setAttribute("aria-hidden", "true");
}

// ============================================================
// PROFIT-LIKE DATE RANGE FOR EXPENSE HISTORY
// ============================================================

function getHistoryDateRange() {
    const period =
        historyPeriodFilter?.value || "thisMonth";

    const today =
        startOfDay(new Date());

    const tomorrow =
        getTomorrow(today);

    if (period === "today") {
        return {
            start: today,
            end: tomorrow
        };
    }

    if (period === "yesterday") {
        const start = new Date(today);
        start.setDate(start.getDate() - 1);

        return {
            start,
            end: today
        };
    }

    if (period === "7days") {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);

        return {
            start,
            end: tomorrow
        };
    }

    if (period === "thisMonth") {
        const start = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        return {
            start,
            end: tomorrow
        };
    }

    if (period === "previousMonth") {
        const start = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );

        const end = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        return {
            start,
            end
        };
    }

    if (period === "custom") {
        const start = parseExpenseDate(
            historyStartDate?.value
        );

        const selectedEnd = parseExpenseDate(
            historyEndDate?.value
        );

        if (!start || !selectedEnd) {
            return null;
        }

        const end = getTomorrow(selectedEnd);

        if (start >= end) {
            return null;
        }

        return {
            start,
            end
        };
    }

    return null;
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
                expense?.paymentMethod,
                getProfileName(expense?.profileId, "")
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
            <td>${escapeHTML(formatDate(expense.date))}</td>
            <td>${escapeHTML(getProfileName(expense?.profileId, expense?.workerName || "Unassigned"))}</td>
            <td>${escapeHTML(getExpenseCategory(expense))}</td>
            <td>${escapeHTML(particular)}</td>
            <td>${escapeHTML(quantityText)}</td>
            <td class="amount-cell">${formatMoney(expense.amount)}</td>
            <td>${escapeHTML(expense.paymentMethod || "-")}</td>
            <td>
                <div class="action-group">
                    <button
                        class="action-btn"
                        type="button"
                        data-action="edit"
                        data-id="${escapeHTML(expense.id)}"
                    >Edit</button>
                    <button
                        class="action-btn danger"
                        type="button"
                        data-action="delete"
                        data-id="${escapeHTML(expense.id)}"
                    >Delete</button>
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

    const selectedProfileId =
        currentFormType === "salary"
            ? String(workerProfileSelect?.value || "").trim()
            : String(generalProfileSelect?.value || "").trim();

    const selectedProfile =
        getProfileById(selectedProfileId);

    if (currentFormType === "salary") {
        const base = Number(baseSalary?.value || 0);
        const extra = Number(extraPayment?.value || 0);
        const deductions = Number(salaryDeductions?.value || 0);

        const amount = Math.max(
            base + extra - deductions,
            0
        );

        return {
            ...(existing || {}),
            id,
            invoiceNo:
                existing?.invoiceNo || generateExpenseInvoiceNo(),
            profileId:
                selectedProfileId || existing?.profileId || null,
            date: selectedDate,
            type: "expense",
            expenseType: "salary",
            category: "Worker Salaries",
            expenseName: "Worker Salary",
            workerName:
                selectedProfile?.name ||
                existing?.workerName ||
                "",
            salaryType:
                salaryType?.value ||
                selectedProfile?.salaryType ||
                existing?.salaryType ||
                "Monthly",
            salaryPeriod: String(salaryPeriod?.value || "").trim(),
            baseSalary: base,
            extraPayment: extra,
            deductions,
            quantity: 0,
            unit: "",
            unitPrice: 0,
            amount,
            paymentMethod: paymentMethod?.value || "Cash",
            notes: String(expenseNotes?.value || "").trim(),
            updatedAt: new Date().toISOString(),
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
            : Number(expenseAmount?.value || 0);

    return {
        ...(existing || {}),
        id,
        invoiceNo:
            existing?.invoiceNo || generateExpenseInvoiceNo(),
        profileId:
            selectedProfileId || existing?.profileId || null,
        date: selectedDate,
        type: "expense",
        expenseType: "general",
        category: expenseCategory?.value || "Other",
        expenseName: String(expenseName?.value || "").trim(),
        workerName: "",
        salaryType: "",
        salaryPeriod: "",
        baseSalary: 0,
        extraPayment: 0,
        deductions: 0,
        quantity: quantity > 0 ? quantity : 0,
        unit: expenseUnit?.value || "",
        unitPrice: unitPrice > 0 ? unitPrice : 0,
        amount,
        paymentMethod: paymentMethod?.value || "Cash",
        notes: String(expenseNotes?.value || "").trim(),
        updatedAt: new Date().toISOString(),
        createdAt:
            existing?.createdAt ||
            new Date().toISOString()
    };
}

function generateExpenseInvoiceNo() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const suffix = String(Date.now()).slice(-6);

    return `EXP-${y}${m}${d}-${suffix}`;
}


// ============================================================
// VALIDATE FORM
// ============================================================

function validateExpense(expense) {
    if (!expense.date) {
        alert("Please select the expense date.");
        return false;
    }

    if (
        !Number.isFinite(Number(expense.amount)) ||
        Number(expense.amount) <= 0
    ) {
        alert("Please enter a valid expense amount.");
        return false;
    }

    // New invoices must be linked to a registered profile.
    // Existing legacy invoices without a profile may still be edited.
    if (!expense.profileId && !editingExpenseId) {
        alert(
            expense.expenseType === "salary"
                ? "Please select a registered worker profile."
                : "Please select a registered vendor / payee."
        );
        return false;
    }

    const profile =
        getProfileById(expense.profileId);

    if (expense.profileId && !profile) {
        alert("The selected expense profile is no longer available.");
        return false;
    }

    if (expense.expenseType === "salary") {
        if (expense.profileId && profile?.profileType !== "worker") {
            alert("Salary expenses must use a worker profile.");
            return false;
        }

        if (!expense.workerName) {
            alert("Please select the worker profile.");
            return false;
        }

        if (Number(expense.baseSalary) <= 0) {
            alert("Please enter the base salary.");
            return false;
        }
    }
    else {
        if (expense.profileId && profile?.profileType !== "vendor") {
            alert("General expenses must use a vendor / payee profile.");
            return false;
        }

        if (!expense.expenseName) {
            alert("Please enter the expense name.");
            return false;
        }
    }

    return true;
}


// ============================================================
// SAVE LOCAL + BACKEND
// ============================================================

async function saveExpense(expense) {
    const isEditing = Boolean(editingExpenseId);
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

        setSyncStatus("Saved offline · pending sync");
        return true;
    }

    // --------------------------------------------------------
    // Online -> backend immediately.
    // --------------------------------------------------------

    try {
        const response = await fetch(
            `${API}${endpoint}`,
            {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(expense)
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return false;
        }

        const responseData =
            await response.json().catch(() => null);

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

        setSyncStatus("Synced with backend");
        return true;
    }
    catch (error) {
        console.error(
            "Expense save request failed. Queuing operation:",
            error
        );

        // The local record already exists. Keep the same ID in the
        // queue so the backend POST remains idempotent on retry.
        await addToSyncQueue({
            endpoint,
            method,
            body: expense
        });

        setSyncStatus("Saved locally · pending sync");
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

        saveExpenseBtn.disabled = true;

        try {
            const saved =
                await saveExpense(expense);

            if (!saved) return;

            expenses =
                expenses.filter(item =>
                    String(item.id) !== String(expense.id)
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
            saveExpenseBtn.disabled = false;
        }
    }
);


// ============================================================
// RESET FORM
// ============================================================

function resetExpenseForm() {
    editingExpenseId = null;

    if (editingExpenseIdInput) {
        editingExpenseIdInput.value = "";
    }

    expenseFormTitle.textContent =
        "Add Expense";

    saveExpenseBtn.textContent =
        "Create Expense Invoice";

    cancelEditBtn?.classList.add("hidden");

    expenseForm?.reset();

    refreshProfileSelectors("", "");

    setFormType("general");

    if (expenseDate) {
        expenseDate.value =
            toInputDate(new Date());
    }

    if (extraPayment) {
        extraPayment.value = "0";
    }

    if (salaryDeductions) {
        salaryDeductions.value = "0";
    }

    if (salaryNetPaid) {
        salaryNetPaid.value = "0";
    }

    if (expenseAmount) {
        expenseAmount.readOnly = false;
        expenseAmount.value = "";
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
        expenses.find(item =>
            String(item.id) === String(id)
        );

    if (!expense) return;

    editingExpenseId = expense.id;

    if (editingExpenseIdInput) {
        editingExpenseIdInput.value = expense.id;
    }

    expenseFormTitle.textContent =
        `Edit ${expense.invoiceNo}`;

    saveExpenseBtn.textContent =
        "Save Expense Changes";

    cancelEditBtn?.classList.remove("hidden");

    setFormType(
        isSalary(expense)
            ? "salary"
            : "general"
    );

    refreshProfileSelectors(
        isSalary(expense) ? "" : String(expense?.profileId || ""),
        isSalary(expense) ? String(expense?.profileId || "") : ""
    );

    if (expenseDate) {
        expenseDate.value =
            toInputDate(expense.date);
    }

    if (paymentMethod) {
        paymentMethod.value =
            expense.paymentMethod || "Cash";
    }

    if (expenseNotes) {
        expenseNotes.value =
            expense.notes || "";
    }

    if (isSalary(expense)) {
        if (workerProfileSelect) {
            workerProfileSelect.value =
                String(expense?.profileId || "");
        }

        if (salaryType) {
            salaryType.value =
                expense.salaryType || "Monthly";
        }

        if (salaryPeriod) {
            salaryPeriod.value =
                expense.salaryPeriod || "";
        }

        if (baseSalary) {
            baseSalary.value =
                expense.baseSalary || 0;
        }

        if (extraPayment) {
            extraPayment.value =
                expense.extraPayment || 0;
        }

        if (salaryDeductions) {
            salaryDeductions.value =
                expense.deductions || 0;
        }

        updateSalaryNet();
    }
    else {
        if (expenseCategory) {
            expenseCategory.value =
                expense.category || "Other";
        }

        if (expenseName) {
            expenseName.value =
                expense.expenseName || "";
        }

        if (expenseQuantity) {
            expenseQuantity.value =
                expense.quantity || "";
        }

        if (expenseUnit) {
            expenseUnit.value =
                expense.unit || "";
        }

        if (expenseUnitPrice) {
            expenseUnitPrice.value =
                expense.unitPrice || "";
        }

        if (expenseAmount) {
            expenseAmount.value =
                expense.amount || "";
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
        expenses.find(item =>
            String(item.id) === String(id)
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
            expenses.filter(item =>
                String(item.id) !== String(expense.id)
            );

        if (navigator.onLine) {
            try {
                const response = await fetch(
                    `${API}/expenses/${encodeURIComponent(expense.id)}`,
                    {
                        method: "DELETE",
                        credentials: "include"
                    }
                );

                if (response.status === 401) {
                    window.location.href = "login.html";
                    return;
                }

                if (!response.ok && response.status !== 404) {
                    const responseData =
                        await response.json().catch(() => null);

                    alert(
                        responseData?.message ||
                        `Delete failed: ${response.status}`
                    );

                    return;
                }

                setSyncStatus("Deletion synced");
            }
            catch (error) {
                console.error(
                    "Online delete failed. Queuing:",
                    error
                );

                await addToSyncQueue({
                    endpoint:
                        `/expenses/${encodeURIComponent(expense.id)}`,
                    method: "DELETE",
                    body: null
                });

                setSyncStatus("Deleted locally · pending sync");
            }
        }
        else {
            await addToSyncQueue({
                endpoint:
                    `/expenses/${encodeURIComponent(expense.id)}`,
                method: "DELETE",
                body: null
            });

            setSyncStatus("Deleted offline · pending sync");
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

        alert("Failed to delete expense.");
    }
}


// ============================================================
// HISTORY ACTIONS
// ============================================================

expenseHistoryBody?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest("[data-action]");

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
        expenses.find(item =>
            String(item.id) === String(id)
        );

    if (!expense) return;

    selectedInvoice = expense;

    if (modalInvoiceNo) {
        modalInvoiceNo.textContent =
            expense.invoiceNo || expense.id;
    }

    const particular =
        isSalary(expense)
            ? expense.workerName || "Worker Salary"
            : expense.expenseName || "Expense";

    const quantityText =
        Number(expense.quantity || 0) > 0
            ? `${formatMoney(expense.quantity)} ${expense.unit || ""}`.trim()
            : "-";

    if (expenseInvoiceContent) {
        expenseInvoiceContent.innerHTML = `
            <div class="invoice-title">
                <div>
                    <strong>FrostyOps</strong>
                    <div class="invoice-meta">Company Expense Invoice</div>
                </div>
                <div class="invoice-meta">
                    ${escapeHTML(formatDate(expense.date))}
                </div>
            </div>

            <div class="invoice-grid">
                <div>
                    <div class="invoice-item-label">Invoice No</div>
                    <div class="invoice-item-value">${escapeHTML(expense.invoiceNo)}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Category</div>
                    <div class="invoice-item-value">${escapeHTML(getExpenseCategory(expense))}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Profile</div>
                    <div class="invoice-item-value">${escapeHTML(getProfileName(expense?.profileId, expense?.workerName || "Unassigned"))}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Particular</div>
                    <div class="invoice-item-value">${escapeHTML(particular)}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Quantity</div>
                    <div class="invoice-item-value">${escapeHTML(quantityText)}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Unit Price</div>
                    <div class="invoice-item-value">PKR ${formatMoney(expense.unitPrice || 0)}</div>
                </div>
                <div>
                    <div class="invoice-item-label">Payment Method</div>
                    <div class="invoice-item-value">${escapeHTML(expense.paymentMethod || "-")}</div>
                </div>
                ${
                    isSalary(expense)
                        ? `
                            <div>
                                <div class="invoice-item-label">Salary Period</div>
                                <div class="invoice-item-value">${escapeHTML(expense.salaryPeriod || "-")}</div>
                            </div>
                            <div>
                                <div class="invoice-item-label">Salary Type</div>
                                <div class="invoice-item-value">${escapeHTML(expense.salaryType || "-")}</div>
                            </div>
                            <div>
                                <div class="invoice-item-label">Base Salary</div>
                                <div class="invoice-item-value">PKR ${formatMoney(expense.baseSalary || 0)}</div>
                            </div>
                            <div>
                                <div class="invoice-item-label">Bonus / Extra</div>
                                <div class="invoice-item-value">PKR ${formatMoney(expense.extraPayment || 0)}</div>
                            </div>
                            <div>
                                <div class="invoice-item-label">Deductions</div>
                                <div class="invoice-item-value">PKR ${formatMoney(expense.deductions || 0)}</div>
                            </div>
                        `
                        : ""
                }
                <div>
                    <div class="invoice-item-label">Notes</div>
                    <div class="invoice-item-value">${escapeHTML(expense.notes || "-")}</div>
                </div>
            </div>

            <div class="invoice-total">
                <span>Total Expense</span>
                <span>PKR ${formatMoney(expense.amount)}</span>
            </div>
        `;
    }

    expenseInvoiceModal?.classList.add("show");
    expenseInvoiceModal?.setAttribute("aria-hidden", "false");
}

function closeExpenseInvoice() {
    selectedInvoice = null;
    expenseInvoiceModal?.classList.remove("show");
    expenseInvoiceModal?.setAttribute("aria-hidden", "true");
}

document
    .getElementById("closeExpenseModal")
    ?.addEventListener("click", closeExpenseInvoice);

document
    .getElementById("closeExpenseModalBottom")
    ?.addEventListener("click", closeExpenseInvoice);

expenseInvoiceModal?.addEventListener(
    "click",
    event => {
        if (event.target === expenseInvoiceModal) {
            closeExpenseInvoice();
        }
    }
);


// ============================================================
// PRINT EXPENSE INVOICE
// ============================================================

document
    .getElementById("printExpenseBtn")
    ?.addEventListener(
        "click",
        () => {
            if (!selectedInvoice) return;

            const expense = selectedInvoice;
            const particular =
                isSalary(expense)
                    ? expense.workerName || "Worker Salary"
                    : expense.expenseName || "Expense";

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
                    <title>${escapeHTML(expense.invoiceNo)}</title>
                    <style>
                        body{font-family:Arial,sans-serif;padding:30px;color:#222;}
                        h1{font-size:22px;margin:0 0 4px;}
                        h2{font-size:15px;margin:0 0 18px;color:#666;}
                        table{width:100%;border-collapse:collapse;margin-top:18px;}
                        td{padding:9px 0;border-bottom:1px solid #ddd;}
                        td:first-child{color:#777;width:38%;}
                        .total{font-size:18px;font-weight:700;text-align:right;margin-top:20px;}
                    </style>
                </head>
                <body>
                    <h1>FrostyOps</h1>
                    <h2>Company Expense Invoice</h2>
                    <table>
                        <tr><td>Invoice No</td><td>${escapeHTML(expense.invoiceNo)}</td></tr>
                        <tr><td>Date</td><td>${escapeHTML(formatDate(expense.date))}</td></tr>
                        <tr><td>Category</td><td>${escapeHTML(getExpenseCategory(expense))}</td></tr>
                        <tr><td>Particular</td><td>${escapeHTML(particular)}</td></tr>
                        <tr><td>Quantity</td><td>${escapeHTML(Number(expense.quantity || 0) > 0 ? `${formatMoney(expense.quantity)} ${expense.unit || ""}`.trim() : "-")}</td></tr>
                        <tr><td>Payment</td><td>${escapeHTML(expense.paymentMethod || "-")}</td></tr>
                        <tr><td>Notes</td><td>${escapeHTML(expense.notes || "-")}</td></tr>
                    </table>
                    <div class="total">Total Expense: PKR ${formatMoney(expense.amount)}</div>
                    <script>
                        window.onload=function(){window.print();};
                        window.onafterprint=function(){window.close();};
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
// LOAD LOCAL EXPENSE PROFILES
// ============================================================

async function loadLocalExpenseProfiles() {
    const local =
        await getAllFromOfflineDB(
            "expenseProfiles"
        );

    expenseProfiles =
        Array.isArray(local)
            ? local
            : [];
}


// ============================================================
// FETCH EXPENSE PROFILES FROM BACKEND
// ============================================================

async function fetchExpenseProfilesFromBackend() {
    const response = await fetch(
        `${API}/expense-profiles`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (response.status === 401) {
        window.location.href = "login.html";
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Expense profile fetch failed: ${response.status}`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data.profiles)) {
        throw new Error(
            "Invalid expense profile response."
        );
    }

    await clearOfflineStore(
        "expenseProfiles"
    );

    if (data.profiles.length > 0) {
        await saveManyToOfflineDB(
            "expenseProfiles",
            data.profiles
        );
    }

    expenseProfiles =
        [...data.profiles];

    refreshProfileSelectors();
    renderExpenseProfiles();

    return expenseProfiles;
}


// ============================================================
// FETCH EXPENSES FROM BACKEND
// ============================================================

async function fetchExpensesFromBackend() {
    const response = await fetch(
        `${API}/expenses`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (response.status === 401) {
        window.location.href = "login.html";
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Expense fetch failed: ${response.status}`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data.expenses)) {
        throw new Error(
            "Invalid expense response."
        );
    }

    await clearOfflineStore("expenses");

    if (data.expenses.length > 0) {
        await saveManyToOfflineDB(
            "expenses",
            data.expenses
        );
    }

    expenses =
        [...data.expenses];

    renderExpenseProfiles();

    return expenses;
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeExpensesPage() {
    try {
        await loadLocalExpenseProfiles();
        await loadLocalExpenses();

        refreshProfileSelectors();
        renderExpenseProfiles();
        resetExpenseForm();

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
                await fetchExpenseProfilesFromBackend();
                await fetchExpensesFromBackend();

                refreshProfileSelectors();
                renderExpenseProfiles();
                refreshCategoryFilter();
                updateStats();
                renderHistory();

                setSyncStatus("Synced with backend");
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

        setSyncStatus("Failed to load expense data");
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
// PROFILE EVENTS
// ============================================================

addExpenseProfileBtn?.addEventListener(
    "click",
    () => openProfileForm()
);

cancelExpenseProfileBtn?.addEventListener(
    "click",
    closeProfileForm
);

closeExpenseProfileModal?.addEventListener(
    "click",
    closeProfileForm
);

expenseProfileModal?.addEventListener(
    "click",
    event => {
        if (event.target === expenseProfileModal) {
            closeProfileForm();
        }
    }
);

profileType?.addEventListener(
    "change",
    () => setProfileFormType(profileType.value)
);

expenseProfileForm?.addEventListener(
    "submit",
    async event => {
        event.preventDefault();
        await saveExpenseProfile();
    }
);

profileSearch?.addEventListener(
    "input",
    renderExpenseProfiles
);

profileTypeTabs?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest("[data-profile-filter]");

        if (!button) return;

        profileListFilter =
            button.dataset.profileFilter || "all";

        profileTypeTabs
            .querySelectorAll("[data-profile-filter]")
            .forEach(tab =>
                tab.classList.toggle(
                    "active",
                    tab.dataset.profileFilter === profileListFilter
                )
            );

        renderExpenseProfiles();
    }
);

expenseProfilesGrid?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest("[data-profile-action]");

        if (!button) return;

        const action =
            button.dataset.profileAction;

        const id =
            button.dataset.id;

        const profile =
            getProfileById(id);

        if (!profile) return;

        if (action === "view") {
            openProfileDetails(id);
        }
        else if (action === "edit") {
            openProfileForm(profile);
        }
        else if (action === "delete") {
            deleteExpenseProfile(id);
        }
    }
);

workerProfileSelect?.addEventListener(
    "change",
    () => {
        applyWorkerProfileDefaults();
    }
);

generalProfileSelect?.addEventListener(
    "change",
    () => renderExpenseProfiles()
);

closeExpenseProfileDetailsModal?.addEventListener(
    "click",
    closeProfileDetails
);

expenseProfileDetailsModal?.addEventListener(
    "click",
    event => {
        if (event.target === expenseProfileDetailsModal) {
            closeProfileDetails();
        }
    }
);

profileDetailsPeriod?.addEventListener(
    "change",
    () => {
        const isCustom =
            profileDetailsPeriod.value === "custom";

        profileDetailsCustomRange?.classList.toggle(
            "hidden",
            !isCustom
        );

        renderProfileDetails();
    }
);

profileDetailsStartDate?.addEventListener(
    "change",
    renderProfileDetails
);

profileDetailsEndDate?.addEventListener(
    "change",
    renderProfileDetails
);

profileDetailsExpenseBody?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest("[data-profile-expense-id]");

        if (!button) return;

        const id =
            button.dataset.profileExpenseId;

        closeProfileDetails();
        openExpenseInvoice(id);
    }
);


// ============================================================
// MOBILE SIDEBAR
// ============================================================

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");

const hamburgerBtn =
    document.getElementById("hamburgerBtn");

function openSidebar() {
    sidebar?.classList.add("open");
    overlay?.classList.add("show");
}

function closeSidebar() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
}

hamburgerBtn?.addEventListener(
    "click",
    () => {
        if (sidebar?.classList.contains("open")) {
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

let expenseOnlineSyncRunning = false;

window.addEventListener(
    "online",
    async () => {
        if (expenseOnlineSyncRunning) return;

        expenseOnlineSyncRunning = true;

        try {
            setSyncStatus("Internet restored · synchronizing...");

            await processSyncQueue();

            try {
                await fetchExpenseProfilesFromBackend();
            }
            catch (error) {
                console.error(
                    "Expense profile online refresh failed:",
                    error
                );
            }

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
            setSyncStatus("Synced with backend");
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
            expenseOnlineSyncRunning = false;
        }
    }
);


// ============================================================
// START
// ============================================================

initializeExpensesPage();
