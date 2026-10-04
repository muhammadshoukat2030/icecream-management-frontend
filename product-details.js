// ============================================================
// FROSTYOPS - PRODUCT DETAILS
// Product-level reporting, offline first.
// ============================================================

const API =
    window.APP_CONFIG?.API ||
    "https://ice-cream-management.vercel.app";

let adminUser = null;
let productId = null;
let product = null;
let productTransactions = [];
let filteredTransactions = [];
let selectedPeriod = "all";
let customFrom = "";
let customTo = "";


// ============================================================
// DOM
// ============================================================

const pageLoading = document.getElementById("pageLoading");
const pageError = document.getElementById("pageError");
const pageContent = document.getElementById("pageContent");
const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");
const dataSourceNote = document.getElementById("dataSourceNote");


// ============================================================
// AUTH / ADMIN DISPLAY
// ============================================================

function getLocalStorageUser() {

    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        return JSON.parse(rawUser);
    }
    catch (error) {
        console.error("Invalid local user:", error);
        window.location.href = "login.html";
        return null;
    }
}


adminUser = getLocalStorageUser();


function setupAdminDisplay() {

    const adminElement = document.getElementById("admin");

    if (adminElement) {
        adminElement.textContent =
            adminUser?.email ||
            window.currentUser?.email ||
            "Admin";
    }

    const datePill = document.getElementById("datePill");

    if (datePill) {
        datePill.textContent = new Date().toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }
}


// ============================================================
// PRODUCT ID
// ============================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const rawProductId =
    urlParams.get("id");


if (
    rawProductId === null ||
    rawProductId.trim() === ""
) {

    alert(
        "Product ID is missing."
    );

    window.location.href =
        "Products.html";

}
else {

    productId =
        Number(
            rawProductId
        );


    if (
        !Number.isInteger(
            productId
        ) ||
        productId < 0
    ) {

        alert(
            "Invalid Product ID."
        );

        window.location.href =
            "Products.html";

    }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupAdminDisplay();
    setupButtons();
    setupFilters();
    updateConnectionStatus();

    window.addEventListener("online", async () => {
        updateConnectionStatus();
        await loadProductDetails(false, true);
    });

    window.addEventListener("offline", () => {
        updateConnectionStatus();
    });

    await loadProductDetails(false, false);
});


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

    document.getElementById("backToProductsBtn")?.addEventListener(
        "click",
        () => {
            window.location.href = "Products.html";
        }
    );

    document.getElementById("refreshProductBtn")?.addEventListener(
        "click",
        async event => {

            const button = event.currentTarget;

            if (button) {
                button.disabled = true;
                button.textContent = "Refreshing...";
            }

            try {
                await loadProductDetails(true, true);
            }
            finally {
                if (button) {
                    button.disabled = false;
                    button.textContent = "Refresh";
                }
            }
        }
    );
}


// ============================================================
// FILTERS
// ============================================================

// ============================================================
// FILTERS
// ============================================================

function setupFilters() {

    const periodSelect =
        document.getElementById(
            "periodSelect"
        );

    const customRange =
        document.getElementById(
            "customDateRange"
        );

    const applyButton =
        document.getElementById(
            "applyFilterBtn"
        );

    const typeFilter =
        document.getElementById(
            "transactionTypeFilter"
        );

    const searchInput =
        document.getElementById(
            "historySearch"
        );


    // ========================================================
    // PERIOD
    // ========================================================

    periodSelect?.addEventListener(
        "change",
        event => {

            selectedPeriod =
                event.target.value;


            // ------------------------------------------------
            // Show / hide custom date controls
            // ------------------------------------------------

            if (customRange) {

                customRange.hidden =
                    selectedPeriod !==
                    "custom";

            }


            // ------------------------------------------------
            // Apply normal periods immediately
            // ------------------------------------------------

            if (
                selectedPeriod !==
                "custom"
            ) {

                customFrom = "";
                customTo = "";

                applyCurrentFilters();

            }

        }
    );


    // ========================================================
    // CUSTOM DATE APPLY
    // ========================================================

    applyButton?.addEventListener(
        "click",
        () => {

            if (
                selectedPeriod !==
                "custom"
            ) {

                applyCurrentFilters();

                return;

            }


            const from =
                document.getElementById(
                    "dateFrom"
                )?.value || "";


            const to =
                document.getElementById(
                    "dateTo"
                )?.value || "";


            if (
                !from ||
                !to
            ) {

                alert(
                    "Please select both start and end dates."
                );

                return;

            }


            if (
                from >
                to
            ) {

                alert(
                    "Start date cannot be after end date."
                );

                return;

            }


            customFrom =
                from;

            customTo =
                to;


            applyCurrentFilters();

        }
    );


    // ========================================================
    // TRANSACTION TYPE
    // ========================================================

    typeFilter?.addEventListener(
        "change",
        () => {

            renderHistory();

        }
    );


    // ========================================================
    // SEARCH
    // ========================================================

    searchInput?.addEventListener(
        "input",
        () => {

            renderHistory();

        }
    );

}


// ============================================================
// CONNECTION
// ============================================================

function updateConnectionStatus() {

    if (!connectionDot || !connectionText) {
        return;
    }

    if (navigator.onLine) {
        connectionDot.classList.remove("offline");
        connectionText.textContent = "Online · local cache + backend refresh";

        if (dataSourceNote) {
            dataSourceNote.textContent =
                "Latest product + local invoice history";
        }
    }
    else {
        connectionDot.classList.add("offline");
        connectionText.textContent =
            "Offline · showing IndexedDB data";

        if (dataSourceNote) {
            dataSourceNote.textContent =
                "IndexedDB product + saved invoice history";
        }
    }
}


// ============================================================
// LOAD PRODUCT
// ============================================================

async function loadProductDetails(
    forceRefresh = false,
    onlineEvent = false
) {

    showLoadingState(false);
    hideError();

    try {

        await loadProductFromIndexedDB();

        if (
            navigator.onLine &&
            typeof syncInvoicesToOfflineDB === "function"
        ) {

            try {

                await syncInvoicesToOfflineDB();

            }
            catch (syncError) {

                console.error(
                    "Invoice synchronization failed:",
                    syncError
                );

            }

        }

        if (
            navigator.onLine &&
            (
                forceRefresh ||
                !product ||
                onlineEvent
            )
        ) {

            await refreshProductFromBackend();

        }

        if (!product) {
            throw new Error(
                "Product was not found in IndexedDB or backend."
            );
        }

        await loadProductTransactions();

        renderPage();

        showLoadingState(true);

    }
    catch (error) {

        console.error(
            "Product details load error:",
            error
        );

        if (product) {

            renderPage();

            showLoadingState(true);

            showError(
                "Some data could not be refreshed. Showing the latest cached product information.",
                true
            );

            return;
        }

        showError(
            error.message ||
            "Unable to load product details."
        );
    }
}


function showLoadingState(hasContent) {

    if (pageLoading) {
        pageLoading.style.display =
            hasContent
                ? "none"
                : "block";
    }

    if (pageContent) {
        pageContent.style.display =
            hasContent
                ? "block"
                : "none";
    }
}


function hideError() {

    if (pageError) {
        pageError.style.display = "none";
    }
}


function showError(
    message,
    nonBlocking = false
) {

    if (!pageError) {
        return;
    }

    pageError.innerHTML =
        escapeHTML(message);

    pageError.style.display = "block";

    if (
        !nonBlocking &&
        pageContent
    ) {

        pageContent.style.display =
            "none";

    }

    if (pageLoading) {
        pageLoading.style.display =
            "none";
    }
}


// ============================================================
// PRODUCT CACHE / BACKEND
// ============================================================

async function loadProductFromIndexedDB() {

    try {

        const products =
            await getAllFromOfflineDB(
                "products"
            );

        const found =
            products.find(
                item =>
                    Number(item.id) ===
                    Number(productId)
            );

        if (found) {

            product =
                normalizeProduct(found);

        }

    }
    catch (error) {

        console.error(
            "Product IndexedDB load failed:",
            error
        );

    }
}


async function refreshProductFromBackend() {

    const response =
        await authenticatedFetch(
            `${API}/products`
        );

    if (!response) {
        return;
    }

    if (!response.ok) {

        throw new Error(
            "Unable to refresh products from backend."
        );

    }

    const result =
        await response.json();

    const products =
        result.products ||
        result.data ||
        [];

    if (!Array.isArray(products)) {

        throw new Error(
            "Invalid products response from backend."
        );

    }

    const found =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (!found) {

        throw new Error(
            "Product was not found on the backend."
        );

    }

    product =
        normalizeProduct(found);

    try {

        await saveToOfflineDB(
            "products",
            product
        );

    }
    catch (cacheError) {

        console.error(
            "Product cache update failed:",
            cacheError
        );

    }
}


async function authenticatedFetch(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,
                credentials: "include"
            }
        );

    if (response.status === 401) {

        window.location.href =
            "login.html";

        return null;
    }

    return response;
}


function normalizeProduct(item) {

    return {

        ...item,

        id:
            Number(
                item.id ??
                0
            ),

        productName:
            item.productName ??
            item.name ??
            "Unknown Product",

        name:
            item.name ??
            item.productName ??
            "Unknown Product",

        company:
            item.company ??
            item.brand ??
            "",

        purchasePrice:
            Number(
                item.purchasePrice ??
                item.price ??
                0
            ),

        salePrice:
            Number(
                item.salePrice ??
                0
            ),

        category:
            item.category ??
            "Other",

        description:
            item.description ??
            "",

        stock:
            Number(
                item.stock ??
                item.qunatity ??
                item.quantity ??
                0
            ),

        commissionApplicable:
            item.commissionApplicable,

        lastPurchase:
            item.lastPurchase ??
            ""

    };
}


// ============================================================
// PRODUCT TRANSACTIONS FROM LOCAL INVOICES
// ============================================================

async function loadProductTransactions() {

    const allInvoices =
        await getAllFromOfflineDB(
            "invoices"
        );

    productTransactions = [];

    allInvoices.forEach(invoice => {

        if (
            !invoice ||
            !Array.isArray(invoice.items)
        ) {
            return;
        }

        if (
            invoice.type !== "supplier" &&
            invoice.type !== "salesman"
        ) {
            return;
        }

        invoice.items.forEach(item => {

            if (
                Number(item.productId) !==
                Number(productId)
            ) {
                return;
            }

            const quantity =
                Number(
                    item.quantity ||
                    0
                );

            const returnQuantity =
                Number(
                    item.returnQuantity ??
                    item.returnedQuantity ??
                    0
                );

            const netQuantity =
                Math.max(
                    quantity -
                    returnQuantity,
                    0
                );

            const price =
                Number(
                    item.price ||
                    0
                );

            const amount =
                item.amount !== undefined
                    ? Number(
                        item.amount ||
                        0
                    )
                    : netQuantity *
                      price;

            productTransactions.push({

                invoiceId:
                    invoice.id,

                invoiceNo:
                    invoice.invoiceNo ??
                    invoice.id ??
                    "-",

                type:
                    invoice.type,

                partyId:
                    invoice.partyId,

                partyName:
                    invoice.partyName ||
                    "-",

                date:
                    invoice.date,

                productId:
                    item.productId,

                productName:
                    item.productName ||
                    product?.name ||
                    "-",

                quantity,

                returnQuantity,

                netQuantity,

                price,

                amount

            });

        });

    });

    productTransactions.sort(
        (a, b) => {

            const dateDifference =
                new Date(a.date) -
                new Date(b.date);

            if (dateDifference !== 0) {
                return dateDifference;
            }

            return (
                Number(a.invoiceId || 0) -
                Number(b.invoiceId || 0)
            );
        }
    );

    applyCurrentFilters();
}


// ============================================================
// PERIOD FILTERING
// ============================================================

// ============================================================
// PERIOD FILTERING
// ============================================================

function applyCurrentFilters() {

    const today =
        new Date();


    const todayKey =
        toDateKey(
            today
        );


    let fromKey =
        "";


    let toKey =
        "";


    let periodText =
        "All Time";


    // ========================================================
    // ALL TIME
    // ========================================================

    if (
        selectedPeriod ===
        "all"
    ) {

        fromKey = "";
        toKey = "";

        periodText =
            "All Time";

    }


    // ========================================================
    // TODAY
    // ========================================================

    else if (
        selectedPeriod ===
        "today"
    ) {

        fromKey =
            todayKey;

        toKey =
            todayKey;

        periodText =
            "Today";

    }


    // ========================================================
    // THIS WEEK
    // ========================================================

    else if (
        selectedPeriod ===
        "week"
    ) {

        const weekStart =
            new Date(
                today
            );


        const day =
            weekStart.getDay();


        const diff =
            day === 0
                ? 6
                : day - 1;


        weekStart.setDate(
            weekStart.getDate() -
            diff
        );


        fromKey =
            toDateKey(
                weekStart
            );


        toKey =
            todayKey;


        periodText =
            "This Week";

    }


    // ========================================================
    // THIS MONTH
    // ========================================================

    else if (
        selectedPeriod ===
        "month"
    ) {

        const monthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );


        fromKey =
            toDateKey(
                monthStart
            );


        toKey =
            todayKey;


        periodText =
            "This Month";

    }


    // ========================================================
    // LAST 30 DAYS
    // ========================================================

    else if (
        selectedPeriod ===
        "30"
    ) {

        const last30 =
            new Date(
                today
            );


        last30.setDate(
            last30.getDate() -
            29
        );


        fromKey =
            toDateKey(
                last30
            );


        toKey =
            todayKey;


        periodText =
            "Last 30 Days";

    }


    // ========================================================
    // CUSTOM
    // ========================================================

    else if (
        selectedPeriod ===
        "custom"
    ) {

        fromKey =
            customFrom;


        toKey =
            customTo;


        if (
            fromKey &&
            toKey
        ) {

            periodText =
                `${formatShortDate(
                    fromKey
                )} – ${formatShortDate(
                    toKey
                )}`;

        }
        else {

            periodText =
                "Custom Range";

        }

    }


    // ========================================================
    // FILTER TRANSACTIONS
    // ========================================================

    filteredTransactions =
        productTransactions.filter(
            transaction => {

                const transactionKey =
                    toDateKey(
                        transaction.date
                    );


                if (
                    !transactionKey
                ) {

                    return false;

                }


                // ------------------------------------------------
                // All Time
                // ------------------------------------------------

                if (
                    !fromKey &&
                    !toKey
                ) {

                    return true;

                }


                // ------------------------------------------------
                // Before start
                // ------------------------------------------------

                if (
                    fromKey &&
                    transactionKey <
                    fromKey
                ) {

                    return false;

                }


                // ------------------------------------------------
                // After end
                // ------------------------------------------------

                if (
                    toKey &&
                    transactionKey >
                    toKey
                ) {

                    return false;

                }


                return true;

            }
        );


    // ========================================================
    // UPDATE PERIOD UI
    // ========================================================

    setText(
        "periodLabel",
        periodText
    );


    setText(
        "filterSummary",
        selectedPeriod === "all"
            ? `Showing all recorded transactions · ${filteredTransactions.length} total`
            : `Showing ${filteredTransactions.length} transactions · ${periodText}`
    );


    // ========================================================
    // UPDATE CARDS + TABLE
    // ========================================================

    renderStats();

    renderHistory();

}


// ============================================================
// RENDER PAGE
// ============================================================

function renderPage() {

    renderProductHeader();

    renderProductInfo();

    applyCurrentFilters();
}


// ============================================================
// PRODUCT HEADER
// ============================================================

function renderProductHeader() {

    const productName =
        product?.name ||
        product?.productName ||
        "Product";


    setText(
        "productCode",
        `PRODUCT #${product?.id ?? productId}`
    );


    setText(
        "productName",
        productName
    );


    setText(
        "productDescription",
        product?.description ||
        "No description available."
    );


    setText(
        "productCompany",
        `Supplier: ${product?.company || "-"}`
    );


    setText(
        "productCategory",
        `Category: ${product?.category || "-"}`
    );


    setText(
        "productPrices",
        `Buy ${money(product?.purchasePrice)} · Sell ${money(product?.salePrice)}`
    );


    setText(
        "headerCurrentStock",
        quantity(product?.stock)
    );


    setText(
        "statStock",
        quantity(product?.stock)
    );


    const avatar =
        document.getElementById(
            "productAvatar"
        );


    if (avatar) {

        const imageSource =
            product?.image ||
            product?.imageUrl ||
            product?.photo ||
            product?.picture;


        if (imageSource) {

            avatar.innerHTML =
                `<img src="${escapeAttribute(imageSource)}" alt="">`;

        }
        else {

            avatar.textContent =
                productName
                    .charAt(0)
                    .toUpperCase() ||
                "P";

        }

    }
}


// ============================================================
// PRODUCT INFORMATION
// ============================================================

function renderProductInfo() {

    setText(
        "detailPurchasePrice",
        money(
            product?.purchasePrice
        )
    );


    setText(
        "detailSalePrice",
        money(
            product?.salePrice
        )
    );


    setText(
        "detailProfit",
        money(
            Number(
                product?.salePrice ||
                0
            ) -
            Number(
                product?.purchasePrice ||
                0
            )
        )
    );


    setText(
        "detailTransactionCount",
        quantity(
            productTransactions.length
        )
    );


    setText(
        "detailLastPurchase",
        product?.lastPurchase
            ? formatDate(
                product.lastPurchase
            )
            : getLastPurchaseDate()
    );
}


// ============================================================
// STATS
// ============================================================

function renderStats() {

    const purchases =
        filteredTransactions.filter(
            transaction =>
                transaction.type ===
                "supplier"
        );


    const issues =
        filteredTransactions.filter(
            transaction =>
                transaction.type ===
                "salesman"
        );


    const totalPurchased =
        sum(
            purchases.map(
                transaction =>
                    transaction.quantity
            )
        );


    const purchaseReturns =
        sum(
            purchases.map(
                transaction =>
                    transaction.returnQuantity
            )
        );


    const netPurchased =
        sum(
            purchases.map(
                transaction =>
                    transaction.netQuantity
            )
        );


    const issued =
        sum(
            issues.map(
                transaction =>
                    transaction.quantity
            )
        );


    setText(
        "statPurchased",
        quantity(
            totalPurchased
        )
    );


    setText(
        "statPurchaseReturns",
        quantity(
            purchaseReturns
        )
    );


    setText(
        "statNetPurchased",
        quantity(
            netPurchased
        )
    );


    setText(
        "statIssued",
        quantity(
            issued
        )
    );


    setText(
        "statStock",
        quantity(
            product?.stock
        )
    );
}


// ============================================================
// HISTORY TABLE
// ============================================================

function renderHistory() {

    const body =
        document.getElementById(
            "historyTableBody"
        );


    const empty =
        document.getElementById(
            "historyEmpty"
        );


    const count =
        document.getElementById(
            "historyCount"
        );


    const typeFilter =
        document.getElementById(
            "transactionTypeFilter"
        )?.value ||
        "all";


    const search =
        (
            document.getElementById(
                "historySearch"
            )?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    if (!body) {
        return;
    }


    const rows =
        filteredTransactions
            .filter(
                transaction => {

                    if (
                        typeFilter ===
                        "all"
                    ) {
                        return true;
                    }

                    return (
                        transaction.type ===
                        typeFilter
                    );
                }
            )
            .filter(
                transaction => {

                    if (!search) {
                        return true;
                    }


                    const haystack = [

                        transaction.invoiceNo,

                        transaction.invoiceId,

                        transaction.partyName,

                        transaction.type ===
                        "supplier"
                            ? "purchase supplier"
                            : "issued salesman",

                        formatDate(
                            transaction.date
                        )

                    ]
                    .join(" ")
                    .toLowerCase();


                    return haystack.includes(
                        search
                    );
                }
            )
            .sort(
                (a, b) => {

                    const dateDifference =
                        new Date(b.date) -
                        new Date(a.date);


                    if (
                        dateDifference !==
                        0
                    ) {

                        return dateDifference;

                    }


                    return (
                        Number(
                            b.invoiceId ||
                            0
                        ) -
                        Number(
                            a.invoiceId ||
                            0
                        )
                    );
                }
            );


    setText(
        "historyCount",
        `${rows.length} ${
            rows.length === 1
                ? "record"
                : "records"
        }`
    );


    body.innerHTML = "";


    if (!rows.length) {

        if (empty) {
            empty.hidden = false;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }


    rows.forEach(
        transaction => {

            const row =
                document.createElement(
                    "tr"
                );


            const isPurchase =
                transaction.type ===
                "supplier";


            const partyRole =
                isPurchase
                    ? "Supplier"
                    : "Salesman";


            const transactionText =
                isPurchase
                    ? "Purchased"
                    : "Issued to Salesman";


            const badgeClass =
                isPurchase
                    ? "purchase"
                    : "issue";


            const avatarLetter =
                (
                    transaction.partyName ||
                    "-"
                )
                .trim()
                .charAt(0)
                .toUpperCase() ||
                "-";


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        formatDate(
                            transaction.date
                        )
                    )}
                </td>


                <td>
                    <span
                        class="invoice-pill"
                    >
                        INV-${escapeHTML(
                            transaction.invoiceNo
                        )}
                    </span>
                </td>


                <td>

                    <span
                        class="type-badge ${badgeClass}"
                    >
                        ${escapeHTML(
                            transactionText
                        )}
                    </span>

                </td>


                <td>

                    <div class="party-cell">

                        <span
                            class="party-avatar"
                        >
                            ${escapeHTML(
                                avatarLetter
                            )}
                        </span>


                        <span
                            class="party-text"
                        >

                            <span
                                class="party-name"
                            >
                                ${escapeHTML(
                                    transaction.partyName
                                )}
                            </span>


                            <span
                                class="party-role"
                            >
                                ${partyRole}
                            </span>

                        </span>

                    </div>

                </td>


                <td
                    class="number qty-positive"
                >
                    ${quantity(
                        transaction.quantity
                    )}
                </td>


                <td
                    class="number qty-return"
                >
                    ${quantity(
                        transaction.returnQuantity
                    )}
                </td>


                <td
                    class="number qty-net"
                >
                    ${quantity(
                        transaction.netQuantity
                    )}
                </td>


                <td class="number">
                    ${money(
                        transaction.price
                    )}
                </td>


                <td class="number">
                    ${money(
                        transaction.amount
                    )}
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );
}


// ============================================================
// HELPERS
// ============================================================

function getLastPurchaseDate() {

    const purchases =
        productTransactions
            .filter(
                transaction =>
                    transaction.type ===
                    "supplier"
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    return purchases.length
        ? formatDate(
            purchases[0].date
        )
        : "-";
}


// ============================================================
// DATE KEY
// ============================================================

function toDateKey(value) {

    if (!value) {
        return "";
    }


    // ========================================================
    // Already a date-only value
    // Example: 2026-10-03
    // ========================================================

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return value;

    }


    // ========================================================
    // JavaScript Date / ISO timestamp
    // ========================================================

    const date =
        value instanceof Date
            ? new Date(value.getTime())
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


function formatShortDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function money(value) {

    return `Rs.${Number(
        value || 0
    ).toLocaleString(
        "en-PK"
    )}`;
}


function quantity(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-PK"
    );
}


function sum(values) {

    return values.reduce(
        (
            total,
            value
        ) =>
            total +
            Number(
                value || 0
            ),
        0
    );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    );
}