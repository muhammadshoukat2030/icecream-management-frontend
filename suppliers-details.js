// ============================================================
// SUPPLIER DETAILS PAGE
// ============================================================


// ============================================================
// GLOBAL API
// ============================================================

const API =
    window.APP_CONFIG.API;


// ============================================================
// GLOBAL STATE
// ============================================================

let supplier = null;

let supplierInvoices = [];

let supplierProducts = [];

let filteredSupplierInvoices = [];

let filteredSupplierProducts = [];

let invoiceForPrint = null;

let adminUser = null;

let editingInvoice = null;

let finalInvoice = null;


// ============================================================
// AUTH / ADMIN USER
// ============================================================

function getLocalStorageUser() {

    const user =
        localStorage.getItem("user");

    if (!user) {

        window.location.href =
            "login.html";

        return null;

    }

    try {

        return JSON.parse(user);

    }
    catch (error) {

        console.error(
            "Invalid local user:",
            error
        );

        window.location.href =
            "login.html";

        return null;

    }

}


adminUser =
    getLocalStorageUser();


if (adminUser) {

    const adminElement =
        document.getElementById("admin");

    if (adminElement) {

        adminElement.textContent =
            adminUser.email || "";

    }

}


// ============================================================
// GET SUPPLIER ID FROM URL
// ============================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const supplierId =
    Number(
        urlParams.get("id")
    );


if (!supplierId) {

    alert(
        "Supplier ID is missing."
    );

    window.location.href =
        "suppliers.html";

}


// ============================================================
// DOM ELEMENTS
// ============================================================

const crumbCurrent =
    document.getElementById(
        "crumbCurrent"
    );


const supplierNameElement =
    document.querySelector(
        ".supplier-name"
    );


const infoCompanyName =
    document.getElementById(
        "infoCompanyName"
    );


const infoContactPerson =
    document.getElementById(
        "infoContactPerson"
    );


const infoAddress =
    document.getElementById(
        "infoAddress"
    );


const infoPhone =
    document.getElementById(
        "infoPhone"
    );


const infoWhatsapp =
    document.getElementById(
        "infoWhatsapp"
    );


const infoEmail =
    document.getElementById(
        "infoEmail"
    );


const infoCity =
    document.getElementById(
        "infoCity"
    );


const infoStatus =
    document.getElementById(
        "infoStatus"
    );


const detailsLogo =
    document.getElementById(
        "detailsLogo"
    );


const summaryTableBody =
    document.getElementById(
        "summaryTableBody"
    );


const invoiceTableBody =
    document.getElementById(
        "invoiceTableBody"
    );


const supplierProductsTableBody =
    document.getElementById(
        "supplierProductsTableBody"
    );


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupSidebar();

        setupTabs();

        setupButtons();

        setupDate();

        createEditButton();

        setupSearch();

        setupInvoiceEditing();

        await initializeSupplierDetails();

    }
);


// ============================================================
// INITIALIZE SUPPLIER DETAILS
// ============================================================

async function initializeSupplierDetails() {

    try {

        /*
         * Load supplier information.
         *
         * loadSupplier() loads IndexedDB first and then
         * refreshes from backend when online.
         */
        await loadSupplier();


        if (!supplier) {
            return;
        }


        /*
         * First/full invoice synchronization:
         *
         *   new device -> all invoices
         *
         * Later:
         *
         *   all invoices since last sync
         */
        if (navigator.onLine) {

            await syncInvoicesToOfflineDB();

        }


        /*
         * Build the page from local data.
         */
        await loadSupplierDetails();

    }
    catch (error) {

        console.error(
            "Supplier details initialization error:",
            error
        );

        alert(
            "Unable to load supplier information."
        );

    }

}


// ============================================================
// AUTHENTICATED FETCH
// ============================================================

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


    if (
        response.status === 401
    ) {

        window.location.href =
            "login.html";

        return null;

    }


    return response;

}


// ============================================================
// LOAD SUPPLIER
// ============================================================

async function loadSupplier() {

    showLoading();


    /*
     * ========================================================
     * 1. LOAD FROM INDEXEDDB FIRST
     * ========================================================
     */

    try {

        const cachedSuppliers =
            await getAllFromOfflineDB(
                "suppliers"
            );


        const cachedSupplier =
            cachedSuppliers.find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        supplierId
                    )
            );


        if (cachedSupplier) {

            supplier =
                cachedSupplier;


            renderSupplierInformation();

        }

    }
    catch (cacheError) {

        console.error(
            "Supplier cache load failed:",
            cacheError
        );

    }


    /*
     * ========================================================
     * 2. OFFLINE
     * ========================================================
     */

    if (
        !navigator.onLine
    ) {

        if (!supplier) {

            alert(
                "Supplier information is not available offline."
            );

        }

        return;

    }


    /*
     * ========================================================
     * 3. REFRESH FROM BACKEND
     * ========================================================
     */

    try {

        const response =
            await authenticatedFetch(
                `${API}/suppliers/${supplierId}`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load supplier"
            );

        }


        const result =
            await response.json();


        supplier =
            result.data ||
            result.supplier ||
            result;


        /*
         * Cache authoritative supplier state.
         */

        await saveToOfflineDB(
            "suppliers",
            supplier
        );


        renderSupplierInformation();

    }
    catch (error) {

        console.error(
            "Supplier online load failed:",
            error
        );


        /*
         * If cache exists, continue using it.
         */

        if (!supplier) {

            alert(
                "Unable to load supplier information."
            );

        }

    }

}


// ============================================================
// LOAD SUPPLIER DETAILS
// ============================================================

async function loadSupplierDetails() {

    if (!supplier) {
        return;
    }


    renderSupplierInformation();


    await Promise.all([
        loadSupplierInvoices(),
        loadSupplierProducts()
    ]);

filteredSupplierInvoices =
    [...supplierInvoices];

filteredSupplierProducts =
    [...supplierProducts];

filterSupplierInvoices(
    document.getElementById(
        "supplierInvoiceSearch"
    )?.value || ""
);

renderProducts();

}


// ============================================================
// SUPPLIER INFORMATION
// ============================================================

function renderSupplierInformation() {

    if (!supplier) {
        return;
    }


    const status =
        getSupplierStatusText(
            supplier.status
        );


    // --------------------------------------------------------
    // Breadcrumb
    // --------------------------------------------------------

    if (crumbCurrent) {

        crumbCurrent.textContent =
            supplier.companyName ||
            "Supplier";

    }


    // --------------------------------------------------------
    // Header
    // --------------------------------------------------------

    if (supplierNameElement) {

        supplierNameElement.innerHTML = `

            ${escapeHTML(
                supplier.companyName || ""
            )}

            <span class="status-badge inline">

                <span class="dot"></span>

                ${escapeHTML(status)}

            </span>

        `;

    }


    // --------------------------------------------------------
    // Company
    // --------------------------------------------------------

    if (infoCompanyName) {

        infoCompanyName.textContent =
            supplier.companyName || "-";

    }


    // --------------------------------------------------------
    // Contact
    // --------------------------------------------------------

    if (infoContactPerson) {

        infoContactPerson.textContent =
            supplier.contactPerson || "-";

    }


    // --------------------------------------------------------
    // Address
    // --------------------------------------------------------

    if (infoAddress) {

        infoAddress.textContent =
            supplier.address || "-";

    }


    // --------------------------------------------------------
    // Phone
    // --------------------------------------------------------

    if (infoPhone) {

        infoPhone.textContent =
            supplier.phone || "-";

    }


    // --------------------------------------------------------
    // WhatsApp
    // --------------------------------------------------------

    if (infoWhatsapp) {

        infoWhatsapp.textContent =
            supplier.whatsapp || "-";

    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    if (infoEmail) {

        infoEmail.textContent =
            supplier.email || "-";

    }


    // --------------------------------------------------------
    // City
    // --------------------------------------------------------

    if (infoCity) {

        infoCity.textContent =
            supplier.city || "-";

    }


    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

    if (infoStatus) {

        infoStatus.textContent =
            status;

    }


    // --------------------------------------------------------
    // Logo
    // --------------------------------------------------------

    renderLogo();

}


// ============================================================
// SUPPLIER STATUS
// ============================================================

function getSupplierStatusText(
    status
) {

    if (
        status === true ||
        status === "true" ||
        status === "Active" ||
        status === "active" ||
        status === 1 ||
        status === "1"
    ) {

        return "Active";

    }


    if (
        status === false ||
        status === "false" ||
        status === "Inactive" ||
        status === "inactive" ||
        status === 0 ||
        status === "0"
    ) {

        return "Inactive";

    }


    return "Active";

}


// ============================================================
// CONVERT STATUS FOR BACKEND
// ============================================================

function getSupplierStatusBoolean(
    status
) {

    return (
        status === true ||
        status === "true" ||
        status === "Active" ||
        status === "active" ||
        status === 1 ||
        status === "1"
    );

}


// ============================================================
// LOGO
// ============================================================

function renderLogo() {

    if (!detailsLogo) {
        return;
    }


    if (supplier.logo) {

        detailsLogo.innerHTML = `

            <img
                src="${escapeAttribute(
                    supplier.logo
                )}"
                alt="Supplier Logo"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:inherit;
                "
            >

        `;

    }
    else {

        const firstLetter =
            (
                supplier.companyName ||
                "S"
            )
                .charAt(0)
                .toUpperCase();


        detailsLogo.textContent =
            firstLetter;

    }

}


// ============================================================
// GET SUPPLIER INVOICES FROM INDEXEDDB
// ============================================================

async function loadSupplierInvoices() {

    try {

        const allInvoices =
            await getAllFromOfflineDB(
                "invoices"
            );


        supplierInvoices =
            allInvoices
                .filter(
                    invoice =>
                        invoice.type ===
                            "supplier" &&

                        Number(
                            invoice.partyId
                        ) ===
                        Number(
                            supplierId
                        )
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
                            Number(b.id) -
                            Number(a.id)
                        );

                    }
                );


        console.log(
            "Supplier invoices from IndexedDB:",
            supplierInvoices
        );

    }
    catch (error) {

        console.error(
            "Supplier invoice cache load failed:",
            error
        );

        supplierInvoices = [];

    }

}


// ============================================================
// LOAD SUPPLIER PRODUCTS
// ============================================================

async function loadSupplierProducts() {

    /*
     * ========================================================
     * 1. LOAD PRODUCTS FROM INDEXEDDB
     * ========================================================
     */

    try {

        const cachedProducts =
            await getAllFromOfflineDB(
                "products"
            );


        const supplierName =
            String(
                supplier?.companyName || ""
            )
                .trim()
                .toLowerCase();


        supplierProducts =
            cachedProducts
                .filter(
                    product => {

                        const company =
                            String(
                                product.company || ""
                            )
                                .trim()
                                .toLowerCase();


                        return (
                            supplierName &&
                            company ===
                            supplierName
                        );

                    }
                )
                .map(
                    product =>
                        normalizeSupplierProduct(
                            product
                        )
                );


        console.log(
            "Supplier products from IndexedDB:",
            supplierProducts
        );


    }
    catch (cacheError) {

        console.error(
            "Supplier product cache load failed:",
            cacheError
        );

        supplierProducts = [];

    }


    /*
     * ========================================================
     * 2. OFFLINE
     * ========================================================
     */

    if (
        !navigator.onLine
    ) {

        return;

    }


    /*
     * ========================================================
     * 3. REFRESH FROM SUPPLIER PRODUCTS ENDPOINT
     * ========================================================
     *
     * Keep the supplier-specific backend endpoint because
     * it may know supplier relationships that are not visible
     * from the local company field.
     */

    try {

        const response =
            await authenticatedFetch(
                `${API}/suppliers/${supplierId}/products`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load supplier products"
            );

        }


        const result =
            await response.json();


        const freshProducts =
            result.products ||
            result.data ||
            [];


        if (
            !Array.isArray(
                freshProducts
            )
        ) {

            return;

        }


        supplierProducts =
            freshProducts.map(
                product =>
                    normalizeSupplierProduct(
                        product
                    )
            );


        /*
         * Also upsert the fresh products into the common
         * products store so other offline pages can use them.
         */

        const localProducts =
            supplierProducts.map(
                product => ({

                    id:
                        Number(
                            product.id
                        ),

                    productName:
                        product.name,

                    brand:
                        product.brand ||
                        product.company,

                    company:
                        product.company,

                    purchasePrice:
                        Number(
                            product.purchasePrice || 0
                        ),

                    salePrice:
                        Number(
                            product.salePrice || 0
                        ),

                    category:
                        product.category ||
                        "Other",

                    description:
                        product.description ||
                        "",

                    stock:
                        Number(
                            product.stock || 0
                        ),

                    commissionApplicable:
                        product.commissionApplicable,

                    lastPurchase:
                        product.lastPurchase ||
                        ""

                })
            );


        if (
            localProducts.length > 0
        ) {

            await saveManyToOfflineDB(
                "products",
                localProducts
            );

        }


        console.log(
            "Fresh supplier products:",
            supplierProducts
        );

    }
    catch (error) {

        console.error(
            "Supplier products online load failed:",
            error
        );

        /*
         * Keep cached products.
         */

    }

}


// ============================================================
// NORMALIZE SUPPLIER PRODUCT
// ============================================================

function normalizeSupplierProduct(
    product
) {

    return {

        id:
            Number(
                product.id ??
                product.product_id ??
                0
            ),

        name:
            product.name ??
            product.productName ??
            product.product_name ??
            "Unknown",

        brand:
            product.brand ??
            product.company ??
            "",

        company:
            product.company ??
            "",

        purchasePrice:
            Number(
                product.purchasePrice ??
                product.price ??
                0
            ),

        salePrice:
            Number(
                product.salePrice ??
                0
            ),

        category:
            product.category ??
            "Other",

        description:
            product.description ??
            "",

        stock:
            Number(
                product.stock ??
                product.qunatity ??
                product.quantity ??
                0
            ),

        commissionApplicable:
            product.commissionApplicable,

        lastPurchase:
            product.lastPurchase ??
            ""

    };

}


// ============================================================
// SEARCH SETUP
// ============================================================

function setupSearch() {

    createInvoiceSearch();

    createProductSearch();

}


// ============================================================
// CREATE INVOICE SEARCH
// ============================================================

function createInvoiceSearch() {

    const searchInput =
        document.getElementById(
            "supplierInvoiceSearch"
        );

    const clearButton =
        document.getElementById(
            "clearSupplierInvoiceSearch"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        () => {

            filterSupplierInvoices(
                searchInput.value
            );

        }
    );


    clearButton?.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            filterSupplierInvoices(
                ""
            );

            searchInput.focus();

        }
    );

}

document
    .getElementById(
        "supplierDateFilter"
    )
    ?.addEventListener(
        "change",
        () => {

            const customRange =
                document.getElementById(
                    "supplierCustomDateRange"
                );


            const isCustom =
                document.getElementById(
                    "supplierDateFilter"
                )?.value ===
                "custom";


            if (customRange) {

                customRange.style.display =
                    isCustom
                        ? "flex"
                        : "none";

            }


            filterSupplierInvoices(
                document.getElementById(
                    "supplierInvoiceSearch"
                )?.value || ""
            );

        }
    );


document
    .getElementById(
        "supplierStartDate"
    )
    ?.addEventListener(
        "change",
        () => {

            filterSupplierInvoices(
                document.getElementById(
                    "supplierInvoiceSearch"
                )?.value || ""
            );

        }
    );


document
    .getElementById(
        "supplierEndDate"
    )
    ?.addEventListener(
        "change",
        () => {

            filterSupplierInvoices(
                document.getElementById(
                    "supplierInvoiceSearch"
                )?.value || ""
            );

        }
    );


// ============================================================
// CREATE PRODUCT SEARCH
// ============================================================

function createProductSearch() {

    if (!supplierProductsTableBody) {
        return;
    }


    const table =
        supplierProductsTableBody.closest(
            "table"
        );


    if (!table) {
        return;
    }


    if (
        document.getElementById(
            "supplierProductSearch"
        )
    ) {

        return;

    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "supplierProductSearchWrapper";


    wrapper.style.cssText = `
        display:flex;
        gap:10px;
        align-items:center;
        margin:12px 0;
        flex-wrap:wrap;
    `;


    wrapper.innerHTML = `

        <div style="
            position:relative;
            flex:1;
            min-width:220px;
        ">

            <input
                type="text"
                id="supplierProductSearch"
                placeholder="Search product name, ID, category or company..."
                autocomplete="off"
                style="
                    width:100%;
                    padding:10px 14px;
                    border:1px solid #d5d9df;
                    border-radius:8px;
                    outline:none;
                    font-size:14px;
                "
            >

        </div>


        <button
            type="button"
            id="clearSupplierProductSearch"
            style="
                padding:10px 15px;
                border:1px solid #d5d9df;
                background:#fff;
                border-radius:8px;
                cursor:pointer;
            "
        >
            Clear
        </button>

    `;


    table.parentElement.insertBefore(
        wrapper,
        table
    );


    const searchInput =
        document.getElementById(
            "supplierProductSearch"
        );


    const clearButton =
        document.getElementById(
            "clearSupplierProductSearch"
        );


    searchInput?.addEventListener(
        "input",
        () => {

            filterSupplierProducts(
                searchInput.value
            );

        }
    );


    clearButton?.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            filterSupplierProducts(
                ""
            );

            searchInput.focus();

        }
    );

}

// ============================================================
// SUPPLIER SUMMARY DATE FILTER
// ============================================================

function getSupplierStartOfWeek(date) {

    const result =
        new Date(date);

    const day =
        result.getDay();

    const diff =
        day === 0
            ? -6
            : 1 - day;

    result.setHours(
        0,
        0,
        0,
        0
    );

    result.setDate(
        result.getDate() + diff
    );

    return result;

}


function getSupplierStartOfMonth(date) {

    const result =
        new Date(date);

    result.setDate(1);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;

}


function getSupplierDateRange() {

    const filterValue =
        document.getElementById(
            "supplierDateFilter"
        )?.value ||
        "today";


    const now =
        new Date();


    now.setHours(
        23,
        59,
        59,
        999
    );


    if (
        filterValue ===
        "today"
    ) {

        const start =
            new Date();

        start.setHours(
            0,
            0,
            0,
            0
        );


        return {
            start,
            end: now
        };

    }


    if (
        filterValue ===
        "week"
    ) {

        return {

            start:
                getSupplierStartOfWeek(
                    new Date()
                ),

            end:
                now

        };

    }


    if (
        filterValue ===
        "month"
    ) {

        return {

            start:
                getSupplierStartOfMonth(
                    new Date()
                ),

            end:
                now

        };

    }


    if (
        filterValue ===
        "custom"
    ) {

        const startValue =
            document.getElementById(
                "supplierStartDate"
            )?.value ||
            "";


        const endValue =
            document.getElementById(
                "supplierEndDate"
            )?.value ||
            "";


        let start =
            null;


        let end =
            null;


        if (startValue) {

            start =
                new Date(
                    `${startValue}T00:00:00`
                );

        }


        if (endValue) {

            end =
                new Date(
                    `${endValue}T23:59:59.999`
                );

        }


        return {
            start,
            end
        };

    }


    return {

        start: null,
        end: null

    };

}


function getDateFilteredSupplierInvoices() {

    const range =
        getSupplierDateRange();


    return supplierInvoices.filter(
        invoice => {

            const invoiceDate =
                new Date(
                    invoice.date
                );


            if (
                Number.isNaN(
                    invoiceDate.getTime()
                )
            ) {

                return false;

            }


            if (
                range.start &&
                invoiceDate <
                    range.start
            ) {

                return false;

            }


            if (
                range.end &&
                invoiceDate >
                    range.end
            ) {

                return false;

            }


            return true;

        }
    );

}

// ============================================================
// FILTER INVOICES
// ============================================================

function filterSupplierInvoices(
    searchValue
) {

    const search =
        String(
            searchValue || ""
        )
            .trim()
            .toLowerCase();


    // --------------------------------------------------------
    // FIRST: APPLY DATE FILTER
    // --------------------------------------------------------

    const dateFilteredInvoices =
        getDateFilteredSupplierInvoices();


    // --------------------------------------------------------
    // SECOND: APPLY INVOICE SEARCH
    // --------------------------------------------------------

    if (!search) {

        filteredSupplierInvoices =
            [...dateFilteredInvoices];

    }
    else {

        filteredSupplierInvoices =
            dateFilteredInvoices.filter(
                invoice => {

                    const invoiceId =
                        String(
                            invoice.id ??
                            invoice.invoiceId ??
                            invoice.invoiceNo ??
                            ""
                        )
                            .toLowerCase();


                    return invoiceId.includes(
                        search
                    );

                }
            );

    }

updateStats();

renderSummary();

}

// ============================================================
// FILTER PRODUCTS
// ============================================================

function filterSupplierProducts(
    searchValue
) {

    const search =
        String(
            searchValue || ""
        )
            .trim()
            .toLowerCase();


    if (!search) {

        filteredSupplierProducts =
            [...supplierProducts];

    }
    else {

        filteredSupplierProducts =
            supplierProducts.filter(
                product => {

                    const name =
                        String(
                            product.name || ""
                        )
                            .toLowerCase();


                    const id =
                        String(
                            product.id || ""
                        )
                            .toLowerCase();


                    const category =
                        String(
                            product.category || ""
                        )
                            .toLowerCase();


                    const company =
                        String(
                            product.company || ""
                        )
                            .toLowerCase();


                    return (
                        name.includes(search) ||
                        id.includes(search) ||
                        category.includes(search) ||
                        company.includes(search)
                    );

                }
            );

    }


    renderProducts();

}


// ============================================================
// SUMMARY TABLE
// ============================================================

function renderSummary() {

    if (!summaryTableBody) {
        return;
    }


    summaryTableBody.innerHTML =
        "";


    const invoices =
        filteredSupplierInvoices;


    if (!invoices.length) {

        summaryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No purchases found.
                </td>

            </tr>

        `;

        return;

    }


    invoices.forEach(
        (
            invoice,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.style.cursor =
                "pointer";


            row.classList.add(
                "clickable-invoice-row"
            );


            const date =
                formatDate(
                    invoice.date
                );


            const items =
                Array.isArray(
                    invoice.items
                )
                    ? invoice.items
                    : [];


            const totalItems =
                items.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.quantity || 0
                        ),
                    0
                );


            const particulars =
                items
                    .map(
                        item =>
                            item.productName
                    )
                    .filter(Boolean)
                    .join(", ");


            const amount =
                Number(
                    invoice.netTotal ??
                    invoice.subtotal ??
                    invoice.amount ??
                    0
                );


            const commission =
                Number(
                    invoice.commission || 0
                );


            const cash =
                Number(
                    invoice.cash || 0
                );


            const balance =
                Number(
                    invoice.balance || 0
                );


            const invoiceId =
                invoice.id ??
                invoice.invoiceId ??
                invoice.invoiceNo ??
                "-";


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>

                    <span
                        class="invoice-number"
                        style="
                            font-weight:600;
                        "
                    >
                        INV-${escapeHTML(
                            String(invoiceId)
                        )}
                    </span>

                </td>

                <td>
                    ${escapeHTML(
                        particulars || "-"
                    )}
                </td>

                <td>
                    ${totalItems}
                </td>

                <td>
                    ${formatMoney(amount)}
                </td>

                <td>
                    ${formatMoney(commission)}
                </td>

                <td>
                    ${formatMoney(cash)}
                </td>

                <td>
                    ${formatMoney(balance)}
                </td>

            `;


            row.addEventListener(
                "click",
                async () => {

                    await showInvoice(
                        Number(invoiceId)
                    );

                }
            );


            summaryTableBody.appendChild(
                row
            );

        }
    );

}


// ============================================================
// GET LATEST SUPPLIER INVOICE LOCALLY
// ============================================================

function getLatestSupplierInvoice() {

    if (
        !supplierInvoices.length
    ) {

        return null;

    }


    return (
        [...supplierInvoices]
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
                        Number(b.id) -
                        Number(a.id)
                    );

                }
            )[0] ||
        null
    );

}


// ============================================================
// SHOW INVOICE
// ============================================================

async function showInvoice(
    invoiceId
) {

    try {

        /*
         * Read directly from IndexedDB.
         */

        const allInvoices =
            await getAllFromOfflineDB(
                "invoices"
            );


        const invoice =
            allInvoices.find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        invoiceId
                    ) &&
                    item.type ===
                    "supplier" &&
                    Number(
                        item.partyId
                    ) ===
                    Number(
                        supplierId
                    )
            );


        if (!invoice) {

            alert(
                "Invoice is not available locally."
            );

            return;

        }


        console.log(
            "Selected supplier invoice:",
            invoice
        );


        renderInvoice(
            invoice
        );


        invoiceForPrint =
            invoice;


        /*
         * Determine latest supplier invoice locally.
         */

        finalInvoice =
            getLatestSupplierInvoice();


        /*
         * Only the latest supplier invoice is editable.
         */

        if (
            finalInvoice &&
            Number(
                finalInvoice.id
            ) ===
            Number(
                invoice.id
            )
        ) {

            openInvoiceEditPopup(
                invoice
            );

        }

    }
    catch (error) {

        console.error(
            "showInvoice error:",
            error
        );


        alert(
            "Unable to load invoice details."
        );

    }

}


// ============================================================
// RENDER INVOICE
// ============================================================

function renderInvoice(
    invoice
) {

    if (!invoice) {
        return;
    }


    const invoiceNo =
        document.getElementById(
            "invoiceNo"
        );


    if (invoiceNo) {

        invoiceNo.textContent =
            `INV-${invoice.id}`;

    }


    if (!invoiceTableBody) {
        return;
    }


    invoiceTableBody.innerHTML =
        "";


    const items =
        Array.isArray(
            invoice.items
        )
            ? invoice.items
            : [];


    items.forEach(
        item => {

            const quantity =
                Number(
                    item.quantity || 0
                );


            const returnQuantity =
                Number(
                    item.returnQuantity ??
                    item.returnedQuantity ??
                    0
                );


            const net =
                Math.max(
                    quantity -
                    returnQuantity,
                    0
                );


            const price =
                Number(
                    item.price || 0
                );


            const amount =
                item.amount !== undefined
                    ? Number(
                        item.amount || 0
                    )
                    : net * price;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        String(
                            item.productId || "-"
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.productName || "-"
                    )}
                </td>

                <td>
                    ${formatMoney(price)}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    ${returnQuantity}
                </td>

                <td>
                    ${net}
                </td>

                <td>
                    ${formatMoney(amount)}
                </td>

            `;


            invoiceTableBody.appendChild(
                row
            );

        }
    );


    updateInvoiceTotals(
        invoice
    );

}


// ============================================================
// INVOICE TOTALS
// ============================================================

function updateInvoiceTotals(
    invoice
) {

    const totals =
        document.querySelectorAll(
            ".invoice-totals .t-row"
        );


    if (!invoice) {
        return;
    }


    const subtotal =
        Number(
            invoice.subtotal || 0
        );


    const commission =
        Number(
            invoice.commission || 0
        );


    const discount =
        Number(
            invoice.discount || 0
        );


    const netTotal =
        Number(
            invoice.netTotal || 0
        );


    const cash =
        Number(
            invoice.cash || 0
        );


    const arrears =
        Number(
            invoice.arrears || 0
        );


    const balance =
        Number(
            invoice.balance || 0
        );


    if (totals[0]) {

        totals[0]
            .children[1]
            .textContent =
                formatMoney(
                    subtotal
                );

    }


    if (totals[1]) {

        totals[1]
            .children[1]
            .textContent =
                formatMoney(
                    commission
                );

    }


    if (totals[2]) {

        totals[2]
            .children[1]
            .textContent =
                formatMoney(
                    discount
                );

    }


    if (totals[3]) {

        totals[3]
            .children[1]
            .textContent =
                formatMoney(
                    netTotal
                );

    }


    if (totals[4]) {

        totals[4]
            .children[1]
            .textContent =
                formatMoney(
                    cash
                );

    }


    if (totals[5]) {

        totals[5]
            .children[1]
            .textContent =
                formatMoney(
                    netTotal -
                    cash
                );

    }


    if (totals[6]) {

        totals[6]
            .children[1]
            .textContent =
                formatMoney(
                    arrears
                );

    }


    if (totals[7]) {

        totals[7]
            .children[1]
            .textContent =
                formatMoney(
                    balance
                );

    }


    const commissionElement =
        document.querySelector(
            "#invoiceEditModal #editingComission"
        );


    if (commissionElement) {

        commissionElement.textContent =
            Number(
                invoice.dynamicComission || 0
            ) * 100;

    }

}


// ============================================================
// PRODUCTS TABLE
// ============================================================

function renderProducts() {

    if (!supplierProductsTableBody) {
        return;
    }


    supplierProductsTableBody.innerHTML =
        "";


    const products =
        filteredSupplierProducts;


    if (!products.length) {

        supplierProductsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No products found.
                </td>

            </tr>

        `;

        return;

    }


    products.forEach(
        product => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        String(
                            product.id || "-"
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        product.name || "-"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        product.company || "-"
                    )}

                </td>


                <td>

                    ${formatMoney(
                        product.purchasePrice
                    )}

                </td>


                <td>

                    ${formatMoney(
                        product.salePrice
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        product.category || "-"
                    )}

                </td>


                <td>

                    <button
                        class="view-product-btn"
                        data-id="${escapeAttribute(
                            String(
                                product.id || ""
                            )
                        )}"
                    >
                        View
                    </button>

                </td>

            `;


            supplierProductsTableBody.appendChild(
                row
            );

        }
    );


    document
        .querySelectorAll(
            ".view-product-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const id =
                            Number(
                                button.dataset.id
                            );


                        const product =
                            supplierProducts.find(
                                item =>
                                    Number(
                                        item.id
                                    ) ===
                                    id
                            );


                        if (product) {

                            showProductDetails(
                                product
                            );

                        }

                    }
                );

            }
        );


    if (
        products.length &&
        !document.getElementById(
            "spDetailName"
        )?.textContent
    ) {

        showProductDetails(
            products[0]
        );

    }

}


// ============================================================
// PRODUCT DETAILS
// ============================================================

function showProductDetails(
    product
) {

    const detailName =
        document.getElementById(
            "spDetailName"
        );


    const detailIdShort =
        document.getElementById(
            "spDetailIdShort"
        );


    const detailFullName =
        document.getElementById(
            "spDetailFullName"
        );


    const detailCompany =
        document.getElementById(
            "spDetailCompany"
        );


    const detailCategory =
        document.getElementById(
            "spDetailCategory"
        );


    const detailId =
        document.getElementById(
            "spDetailId"
        );


    const detailDescription =
        document.getElementById(
            "spDetailDescription"
        );


    const detailPurchasePrice =
        document.getElementById(
            "spDetailPurchasePrice"
        );


    const detailSalePrice =
        document.getElementById(
            "spDetailSalePrice"
        );


    const detailProfit =
        document.getElementById(
            "spDetailProfit"
        );


    const detailStock =
        document.getElementById(
            "spDetailStock"
        );


    if (detailName) {

        detailName.textContent =
            product.name || "-";

    }


    if (detailIdShort) {

        detailIdShort.textContent =
            `Id:${product.id || "-"}`;

    }


    if (detailFullName) {

        detailFullName.textContent =
            product.name || "-";

    }


    if (detailCompany) {

        detailCompany.textContent =
            product.company || "-";

    }


    if (detailCategory) {

        detailCategory.textContent =
            product.category || "-";

    }


    if (detailId) {

        detailId.textContent =
            product.id || "-";

    }


    if (detailDescription) {

        detailDescription.textContent =
            product.description || "-";

    }


    const purchasePrice =
        Number(
            product.purchasePrice || 0
        );


    const salePrice =
        Number(
            product.salePrice || 0
        );


    if (detailPurchasePrice) {

        detailPurchasePrice.textContent =
            `Rs.${formatMoney(
                purchasePrice
            )}`;

    }


    if (detailSalePrice) {

        detailSalePrice.textContent =
            `Rs.${formatMoney(
                salePrice
            )}`;

    }


    const profit =
        salePrice -
        purchasePrice;


    if (detailProfit) {

        detailProfit.textContent =
            `Rs.${formatMoney(
                profit
            )}`;

    }


    const stock =
        Number(
            product.stock ??
            product.qunatity ??
            product.quantity ??
            0
        );


    if (detailStock) {

        detailStock.innerHTML = `

            ${stock.toLocaleString(
                "en-PK"
            )}

            <span class="units">
                units
            </span>

        `;

    }

}


// ============================================================
// UPDATE STATISTICS
// ============================================================
function updateStats() {

    const statNumbers =
        document.querySelectorAll(
            ".stat-number"
        );


    if (!statNumbers.length) {
        return;
    }


    // ========================================================
    // OUTSTANDING BALANCE
    // NEVER affected by date filter
    // ========================================================

    const outstanding =
        Number(
            supplier?.outstandingBalance || 0
        );


    if (statNumbers[0]) {

        statNumbers[0].textContent =
            `Rs.${formatMoney(outstanding)}`;

    }


    // ========================================================
    // GET CURRENT DATE FILTER
    // ========================================================

    const dateFilter =
        document.getElementById(
            "supplierDateFilter"
        )?.value || "today";


    const dateFilteredInvoices =
        getDateFilteredSupplierInvoices();


    console.log(
        "Supplier date filter:",
        dateFilter,
        "Invoices:",
        dateFilteredInvoices
    );


    // ========================================================
    // PURCHASES FOR SELECTED DATE RANGE
    // ========================================================

    const selectedRangePurchases =
        dateFilteredInvoices.reduce(
            (
                total,
                invoice
            ) => {

                return (
                    total +
                    Number(
                        invoice.netTotal ??
                        invoice.subtotal ??
                        invoice.amount ??
                        0
                    )
                );

            },
            0
        );


    // ========================================================
    // PURCHASES CARD
    // ========================================================

    const purchasesElement =
        document.getElementById(
            "supplierPurchases"
        );


    if (purchasesElement) {

        purchasesElement.textContent =
            `Rs.${formatMoney(
                selectedRangePurchases
            )}`;

    }


    // ========================================================
    // THIS MONTH CARD
    // ========================================================

   


    // ========================================================
    // PRODUCTS
    // NEVER affected by date filter
    // ========================================================

    if (statNumbers[2]) {

        statNumbers[2].textContent =
            supplierProducts.length.toLocaleString(
                "en-PK"
            );

    }


    // ========================================================
    // LAST PAYMENT
    // NEVER affected by date filter
    // ========================================================

    if (
        statNumbers[3] &&
        supplier?.lastPayment
    ) {

        statNumbers[3].textContent =
            `Rs.${formatMoney(
                supplier.lastPayment.amount || 0
            )}`;


        const lastPaymentSub =
            statNumbers[3]
                .parentElement
                ?.querySelector(
                    ".stat-sub"
                );


        if (lastPaymentSub) {

            lastPaymentSub.textContent =
                formatDate(
                    supplier.lastPayment.date
                );

        }

    }

}
// ============================================================
// CREATE EDIT BUTTON
// ============================================================

function createEditButton() {

    const header =
        document.querySelector(
            ".info-panel h4"
        );


    if (!header) {
        return;
    }


    if (
        document.getElementById(
            "editSupplierBtn"
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "editSupplierBtn";


    button.textContent =
        "Edit Supplier";


    button.className =
        "edit-supplier-btn";


    button.addEventListener(
        "click",
        openEditSupplierModal
    );


    header.style.display =
        "flex";


    header.style.justifyContent =
        "space-between";


    header.style.alignItems =
        "center";


    header.appendChild(
        button
    );

}


// ============================================================
// EDIT SUPPLIER MODAL
// ============================================================

function openEditSupplierModal() {

    if (!supplier) {
        return;
    }


    const oldModal =
        document.getElementById(
            "editSupplierModal"
        );


    if (oldModal) {

        oldModal.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "editSupplierModal";


    modal.className =
        "supplier-modal-overlay";


    const currentStatus =
        getSupplierStatusText(
            supplier.status
        );


    modal.innerHTML = `

        <div class="supplier-modal">


            <div class="supplier-modal-header">

                <h2>
                    Edit Supplier
                </h2>


                <button
                    type="button"
                    id="closeSupplierModal"
                    class="modal-close"
                >
                    &times;
                </button>

            </div>


            <form id="editSupplierForm">


                <div class="form-grid">


                    <div class="form-group">

                        <label>
                            Company Name
                        </label>

                        <input
                            type="text"
                            name="companyName"
                            value="${escapeAttribute(
                                supplier.companyName || ""
                            )}"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Contact Person
                        </label>

                        <input
                            type="text"
                            name="contactPerson"
                            value="${escapeAttribute(
                                supplier.contactPerson || ""
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Phone
                        </label>

                        <input
                            type="text"
                            name="phone"
                            value="${escapeAttribute(
                                supplier.phone || ""
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            WhatsApp
                        </label>

                        <input
                            type="text"
                            name="whatsapp"
                            value="${escapeAttribute(
                                supplier.whatsapp || ""
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value="${escapeAttribute(
                                supplier.email || ""
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            City
                        </label>

                        <input
                            type="text"
                            name="city"
                            value="${escapeAttribute(
                                supplier.city || ""
                            )}"
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Address
                        </label>

                        <textarea
                            name="address"
                            rows="3"
                        >${escapeHTML(
                            supplier.address || ""
                        )}</textarea>

                    </div>


                    <div class="form-group">

                        <label>
                            Status
                        </label>

                        <select name="status">

                            <option
                                value="Active"
                                ${
                                    currentStatus ===
                                    "Active"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Active
                            </option>


                            <option
                                value="Inactive"
                                ${
                                    currentStatus ===
                                    "Inactive"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Inactive
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Picture / Logo URL
                        </label>

                        <input
                            type="text"
                            name="logo"
                            value="${escapeAttribute(
                                supplier.logo || ""
                            )}"
                            placeholder="https://..."
                        >

                    </div>


                </div>


                <div class="immutable-fields">

                    <strong>
                        Supplier ID:
                    </strong>

                    ${escapeHTML(
                        String(
                            supplier.id ||
                            supplierId
                        )
                    )}

                    <span>

                        ID and financial information
                        cannot be edited here.

                    </span>

                </div>


                <div class="modal-actions">


                    <button
                        type="button"
                        id="cancelSupplierEdit"
                        class="cancel-btn"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="save-btn"
                    >
                        Save Changes
                    </button>


                </div>


            </form>


        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeSupplierModal"
        )
        ?.addEventListener(
            "click",
            closeEditSupplierModal
        );


    document
        .getElementById(
            "cancelSupplierEdit"
        )
        ?.addEventListener(
            "click",
            closeEditSupplierModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeEditSupplierModal();

            }

        }
    );


    document
        .getElementById(
            "editSupplierForm"
        )
        ?.addEventListener(
            "submit",
            updateSupplier
        );

}


// ============================================================
// UPDATE SUPPLIER
// ============================================================

async function updateSupplier(
    event
) {

    event.preventDefault();


    if (!supplier) {
        return;
    }


    const form =
        event.target;


    const formData =
        new FormData(form);


    const updateData = {};


    for (
        const [
            key,
            value
        ]
        of formData.entries()
    ) {

        updateData[key] =
            String(
                value
            ).trim();

    }


    updateData.status =
        getSupplierStatusBoolean(
            updateData.status
        );


    const originalValues = {

        companyName:
            supplier.companyName || "",

        contactPerson:
            supplier.contactPerson || "",

        phone:
            supplier.phone || "",

        whatsapp:
            supplier.whatsapp || "",

        email:
            supplier.email || "",

        city:
            supplier.city || "",

        address:
            supplier.address || "",

        status:
            getSupplierStatusBoolean(
                supplier.status
            ),

        logo:
            supplier.logo || ""

    };


    const changedData = {};


    Object.keys(
        updateData
    )
        .forEach(
            field => {

                if (
                    field ===
                    "status"
                ) {

                    if (
                        updateData.status !==
                        originalValues.status
                    ) {

                        changedData.status =
                            updateData.status;

                    }

                    return;

                }


                if (
                    String(
                        updateData[field]
                    ) !==
                    String(
                        originalValues[field]
                    )
                ) {

                    changedData[field] =
                        updateData[field];

                }

            }
        );


    if (
        Object.keys(
            changedData
        ).length ===
        0
    ) {

        alert(
            "No changes were made."
        );

        closeEditSupplierModal();

        return;

    }


    const saveButton =
        form.querySelector(
            ".save-btn"
        );


    try {

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

        }


        // =====================================================
        // OFFLINE SUPPLIER EDIT
        // =====================================================

        if (
            !navigator.onLine
        ) {

            const updatedSupplier =
                {
                    ...supplier,
                    ...changedData
                };


            /*
             * Keep status as Boolean locally.
             */

            updatedSupplier.status =
                getSupplierStatusBoolean(
                    updatedSupplier.status
                );


            supplier =
                updatedSupplier;


            await saveToOfflineDB(
                "suppliers",
                supplier
            );


            await addToSyncQueue({

                endpoint:
                    `/suppliers/${supplierId}`,

                method:
                    "PATCH",

                body:
                    changedData

            });


            renderSupplierInformation();

            updateStats();

            closeEditSupplierModal();


            alert(
                "Supplier changes were saved offline and will synchronize when internet returns."
            );


            return;

        }


        // =====================================================
        // ONLINE SUPPLIER EDIT
        // =====================================================

        const response =
            await authenticatedFetch(
                `${API}/suppliers/${supplierId}`,
                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            changedData
                        )

                }
            );


        if (!response) {
            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to update supplier"
            );

        }


        supplier =
            result.data ||
            result.supplier ||
            result;


        await saveToOfflineDB(
            "suppliers",
            supplier
        );


        renderSupplierInformation();

        updateStats();


        closeEditSupplierModal();


        alert(
            "Supplier updated successfully."
        );

    }
    catch (error) {

        console.error(
            "Update supplier error:",
            error
        );


        /*
         * If the connection disappeared during the request,
         * perform the same offline fallback.
         */

        if (
            !navigator.onLine
        ) {

            try {

                const updatedSupplier =
                    {
                        ...supplier,
                        ...changedData
                    };


                updatedSupplier.status =
                    getSupplierStatusBoolean(
                        updatedSupplier.status
                    );


                supplier =
                    updatedSupplier;


                await saveToOfflineDB(
                    "suppliers",
                    supplier
                );


                await addToSyncQueue({

                    endpoint:
                        `/suppliers/${supplierId}`,

                    method:
                        "PATCH",

                    body:
                        changedData

                });


                renderSupplierInformation();

                updateStats();

                closeEditSupplierModal();


                alert(
                    "Internet connection was lost. Supplier changes were saved offline and will synchronize when internet returns."
                );

            }
            catch (offlineError) {

                console.error(
                    "Offline supplier fallback failed:",
                    offlineError
                );


                alert(
                    "Failed to save supplier changes offline."
                );

            }

        }
        else {

            alert(
                error.message ||
                "Failed to update supplier."
            );

        }

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Changes";

        }

    }

}


// ============================================================
// CLOSE EDIT SUPPLIER MODAL
// ============================================================

function closeEditSupplierModal() {

    const modal =
        document.getElementById(
            "editSupplierModal"
        );


    if (modal) {

        modal.remove();

    }

}


// ============================================================
// OPEN INVOICE EDIT POPUP
// ============================================================

function openInvoiceEditPopup(
    invoice
) {

    editingInvoice =
        structuredClone(
            invoice
        );


    const info =
        document.getElementById(
            "editInvoiceInfo"
        );


    if (info) {

        info.innerHTML = `

            <div>

                <strong>
                    Invoice:
                </strong>

                INV-${escapeHTML(
                    String(
                        invoice.id ?? ""
                    )
                )}

            </div>


            <div>

                <strong>
                    Supplier:
                </strong>

                ${escapeHTML(
                    supplier?.companyName ||
                    "Supplier"
                )}

            </div>


            <div>

                <strong>
                    Date:
                </strong>

                ${escapeHTML(
                    formatDate(
                        invoice.date
                    )
                )}

            </div>

        `;

    }


    const tbody =
        document.getElementById(
            "editInvoiceTbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    const items =
        Array.isArray(
            editingInvoice.items
        )
            ? editingInvoice.items
            : [];


    items.forEach(
        (
            item,
            index
        ) => {

            const purchaseQty =
                Number(
                    item.quantity || 0
                );


            const returnQty =
                getReturnQuantity(
                    item
                );


            const price =
                Number(
                    item.price || 0
                );


            const netQty =
                Math.max(
                    purchaseQty -
                    returnQty,
                    0
                );


            const amount =
                netQty *
                price;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        item.productName ||
                        item.name ||
                        item.product?.name ||
                        "-"
                    )}
                </td>


                <td>
                    ${purchaseQty}
                </td>


                <td>

                    <input
                        type="number"
                        class="edit-return-input"
                        data-index="${index}"
                        min="0"
                        max="${purchaseQty}"
                        value="${returnQty}"
                    >

                </td>


                <td class="edit-net">
                    ${netQty}
                </td>


                <td>
                    ${formatMoney(price)}
                </td>


                <td class="edit-amount">
                    ${formatMoney(amount)}
                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );


    const cashInput =
        document.getElementById(
            "editCash"
        );


    if (cashInput) {

        cashInput.value =
            Number(
                editingInvoice.cash || 0
            );

    }


    const commissionElement =
        document.querySelector(
            "#invoiceEditModal #editingComission"
        );


    if (commissionElement) {

        commissionElement.textContent =
            Number(
                editingInvoice.dynamicComission ||
                0
            ) * 100;

    }


    updateEditInvoiceTotals();


    const modal =
        document.getElementById(
            "invoiceEditModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


// ============================================================
// UPDATE EDIT INVOICE TOTALS
// ============================================================

function updateEditInvoiceTotals() {

    if (!editingInvoice) {
        return;
    }


    const rows =
        document.querySelectorAll(
            "#editInvoiceTbody tr"
        );


    let subtotal = 0;

    let nonCommissionableAmount = 0;


    rows.forEach(
        (
            row,
            index
        ) => {

            const item =
                editingInvoice.items[index];


            if (!item) {
                return;
            }


            const purchaseQty =
                Number(
                    item.quantity || 0
                );


            const returnInput =
                row.querySelector(
                    ".edit-return-input"
                );


            let returnQty =
                Number(
                    returnInput?.value || 0
                );


            returnQty =
                Math.max(
                    0,
                    Math.min(
                        returnQty,
                        purchaseQty
                    )
                );


            item.returnQuantity =
                returnQty;


            item.returnedQuantity =
                returnQty;


            const netQty =
                Math.max(
                    purchaseQty -
                    returnQty,
                    0
                );


            const price =
                Number(
                    item.price || 0
                );


            const amount =
                netQty *
                price;


            subtotal +=
                amount;


            if (
                item.commissionApplicable ===
                "no"
            ) {

                nonCommissionableAmount +=
                    amount;

            }


            const netCell =
                row.querySelector(
                    ".edit-net"
                );


            if (netCell) {

                netCell.textContent =
                    netQty;

            }


            const amountCell =
                row.querySelector(
                    ".edit-amount"
                );


            if (amountCell) {

                amountCell.textContent =
                    formatMoney(
                        amount
                    );

            }

        }
    );


    const commissionRate =
        Number(
            editingInvoice.dynamicComission ||
            0
        );


    const commissionableAmount =
        Math.max(
            subtotal -
            nonCommissionableAmount,
            0
        );


    const commission =
        commissionableAmount *
        commissionRate;


    const discount =
        Number(
            editingInvoice.discount ||
            0
        );


    const netTotal =
        subtotal -
        commission -
        discount;


    const cash =
        Number(
            document.getElementById(
                "editCash"
            )?.value || 0
        );


    const currentBill =
        netTotal -
        cash;


    const arrears =
        Number(
            editingInvoice.arrears || 0
        );


    const balance =
        currentBill +
        arrears;


    editingInvoice.subtotal =
        subtotal;


    editingInvoice.commission =
        commission;


    editingInvoice.netTotal =
        netTotal;


    editingInvoice.cash =
        cash;


    editingInvoice.currentBill =
        currentBill;


    editingInvoice.balance =
        balance;


    setText(
        "editSubtotal",
        formatMoney(
            subtotal
        )
    );


    setText(
        "editCommission",
        formatMoney(
            commission
        )
    );


    setText(
        "editDiscount",
        formatMoney(
            discount
        )
    );


    setText(
        "editNetTotal",
        formatMoney(
            netTotal
        )
    );


    setText(
        "editCurrentBill",
        formatMoney(
            currentBill
        )
    );


    setText(
        "editArrears",
        formatMoney(
            arrears
        )
    );


    setText(
        "editBalance",
        formatMoney(
            balance
        )
    );

}


// ============================================================
// SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// SETUP INVOICE EDITING
// ============================================================

function setupInvoiceEditing() {

    const tbody =
        document.getElementById(
            "editInvoiceTbody"
        );


    const cashInput =
        document.getElementById(
            "editCash"
        );


    const saveBtn =
        document.getElementById(
            "saveInvoiceEdit"
        );


    const cancelBtn =
        document.getElementById(
            "cancelInvoiceEdit"
        );


    const closeBtn =
        document.getElementById(
            "closeInvoiceModal"
        );


    const modal =
        document.getElementById(
            "invoiceEditModal"
        );


    tbody?.addEventListener(
        "input",
        event => {

            if (
                event.target.classList.contains(
                    "edit-return-input"
                )
            ) {

                updateEditInvoiceTotals();

            }

        }
    );


    cashInput?.addEventListener(
        "input",
        () => {

            updateEditInvoiceTotals();

        }
    );


    const closeModal =
        () => {

            modal?.classList.remove(
                "show"
            );

            editingInvoice =
                null;

        };


    cancelBtn?.addEventListener(
        "click",
        closeModal
    );


    closeBtn?.addEventListener(
        "click",
        closeModal
    );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeModal();

            }

        }
    );


    saveBtn?.addEventListener(
        "click",
        saveSupplierInvoiceEdit
    );

}


// ============================================================
// APPLY SUPPLIER RETURN LOCALLY
// ============================================================
//
// Supplier invoice stock rule:
//
// old return = 2
// new return = 5
//
// Product stock changes:
// 2 - 5 = -3
//
// old return = 5
// new return = 2
//
// Product stock changes:
// 5 - 2 = +3
//
// This matches the backend supplier invoice rule.
// ============================================================

async function applySupplierReturnLocally(
    oldInvoice,
    updatedInvoice
) {

    const localProducts =
        await getAllFromOfflineDB(
            "products"
        );


    const oldItems =
        oldInvoice.items || [];


    const newItems =
        updatedInvoice.items || [];


    const updatedProducts =
        localProducts.map(
            product => {

                const productId =
                    Number(
                        product.id
                    );


                const oldItem =
                    oldItems.find(
                        item =>
                            Number(
                                item.productId
                            ) ===
                            productId
                    );


                const newItem =
                    newItems.find(
                        item =>
                            Number(
                                item.productId
                            ) ===
                            productId
                    );


                if (
                    !oldItem &&
                    !newItem
                ) {

                    return product;

                }


                const oldReturn =
                    getReturnQuantity(
                        oldItem
                    );


                const newReturn =
                    getReturnQuantity(
                        newItem
                    );


                const stockDifference =
                    oldReturn -
                    newReturn;


                if (
                    stockDifference ===
                    0
                ) {

                    return product;

                }


                return {

                    ...product,

                    stock:
                        (
                            Number(
                                product.stock
                            ) || 0
                        ) +
                        stockDifference

                };

            }
        );


    await saveManyToOfflineDB(
        "products",
        updatedProducts
    );


    // ========================================================
    // UPDATE SUPPLIER BALANCE LOCALLY
    // ========================================================

    const localSuppliers =
        await getAllFromOfflineDB(
            "suppliers"
        );


    const updatedSuppliers =
        localSuppliers.map(
            item => {

                if (
                    Number(
                        item.id
                    ) !==
                    Number(
                        updatedInvoice.partyId
                    )
                ) {

                    return item;

                }


                return {

                    ...item,

                    outstandingBalance:
                        Number(
                            updatedInvoice.balance
                        ) || 0

                };

            }
        );


    await saveManyToOfflineDB(
        "suppliers",
        updatedSuppliers
    );


    /*
     * Also update the page's supplier object.
     */

    const updatedSupplier =
        updatedSuppliers.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    supplierId
                )
        );


    if (updatedSupplier) {

        supplier =
            updatedSupplier;

    }

}


// ============================================================
// SAVE SUPPLIER INVOICE EDIT
// ============================================================

async function saveSupplierInvoiceEdit() {

    if (!editingInvoice) {
        return;
    }


    try {

        updateEditInvoiceTotals();


        const saveBtn =
            document.getElementById(
                "saveInvoiceEdit"
            );


        if (saveBtn) {

            saveBtn.disabled =
                true;

            saveBtn.textContent =
                "Saving...";

        }


        const oldInvoice =
            structuredClone(
                editingInvoice
            );


        const updatedInvoice =
            structuredClone(
                editingInvoice
            );


        /*
         * Build the exact payload expected by:
         *
         * PUT /invoice/:id/update-last
         */

        const items =
            updatedInvoice.items.map(
                item => ({

                    productId:
                        item.productId,

                    returnQuantity:
                        getReturnQuantity(
                            item
                        )

                })
            );


        const cash =
            Number(
                updatedInvoice.cash || 0
            );


        // =====================================================
        // OFFLINE
        // =====================================================

        if (
            !navigator.onLine
        ) {

            await applySupplierReturnLocally(
                oldInvoice,
                updatedInvoice
            );


            await saveToOfflineDB(
                "invoices",
                updatedInvoice
            );


            await addToSyncQueue({

                endpoint:
                    `/invoice/${updatedInvoice.id}/update-last`,

                method:
                    "PUT",

                body: {

                    items:
                        items,

                    cash:
                        cash

                }

            });


            invoiceForPrint =
                updatedInvoice;


            editingInvoice =
                null;


            document
                .getElementById(
                    "invoiceEditModal"
                )
                ?.classList.remove(
                    "show"
                );


            await loadSupplierInvoices();


            filteredSupplierInvoices =
                [...supplierInvoices];


            renderSummary();

            updateStats();

            renderInvoice(
                updatedInvoice
            );


            alert(
                "Invoice changes were saved offline and will synchronize when internet returns."
            );


            return;

        }


        // =====================================================
        // ONLINE
        // =====================================================

        const response =
            await authenticatedFetch(
                `${API}/invoice/${updatedInvoice.id}/update-last`,
                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            items:
                                items,

                            cash:
                                cash

                        })

                }
            );


        if (!response) {
            return;
        }


        const result =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Failed to update invoice."
            );

        }


        const serverInvoice =
            result.data ||
            result.invoice ||
            result;


        /*
         * Backend is authoritative after a successful online
         * edit, so cache the server invoice rather than
         * applying the stock difference locally again.
         */

        if (
            serverInvoice &&
            serverInvoice.id !== undefined
        ) {

            await saveToOfflineDB(
                "invoices",
                serverInvoice
            );


            invoiceForPrint =
                serverInvoice;

        }


        // =====================================================
        // REFRESH SUPPLIER
        // =====================================================

        try {

            const supplierResponse =
                await authenticatedFetch(
                    `${API}/suppliers/${supplierId}`
                );


            if (
                supplierResponse &&
                supplierResponse.ok
            ) {

                const supplierResult =
                    await supplierResponse.json();


                supplier =
                    supplierResult.data ||
                    supplierResult.supplier ||
                    supplierResult;


                await saveToOfflineDB(
                    "suppliers",
                    supplier
                );

            }

        }
        catch (supplierRefreshError) {

            console.error(
                "Supplier refresh after invoice edit failed:",
                supplierRefreshError
            );

        }


        // =====================================================
        // REFRESH PRODUCTS
        // =====================================================

        try {

            const productsResponse =
                await authenticatedFetch(
                    `${API}/products`
                );


            if (
                productsResponse &&
                productsResponse.ok
            ) {

                const productsResult =
                    await productsResponse.json();


                const freshProducts =
                    productsResult.products ||
                    [];


                if (
                    Array.isArray(
                        freshProducts
                    )
                ) {

                    await clearOfflineStore(
                        "products"
                    );


                    await saveManyToOfflineDB(
                        "products",
                        freshProducts.map(
                            product => ({

                                id:
                                    Number(
                                        product.id
                                    ),

                                productName:
                                    product.name ??
                                    product.productName ??
                                    "",

                                brand:
                                    product.brand ??
                                    product.company ??
                                    "",

                                company:
                                    product.company ??
                                    "",

                                purchasePrice:
                                    Number(
                                        product.purchasePrice ??
                                        product.price ??
                                        0
                                    ),

                                salePrice:
                                    Number(
                                        product.salePrice ??
                                        0
                                    ),

                                category:
                                    product.category ??
                                    "Other",

                                description:
                                    product.description ??
                                    "",

                                stock:
                                    Number(
                                        product.qunatity ??
                                        product.stock ??
                                        product.quantity ??
                                        0
                                    ),

                                commissionApplicable:
                                    product.commissionApplicable,

                                lastPurchase:
                                    product.lastPurchase ??
                                    ""

                            })
                        )
                    );

                }

            }

        }
        catch (productRefreshError) {

            console.error(
                "Product refresh after invoice edit failed:",
                productRefreshError
            );

        }


        // =====================================================
        // CLOSE + REBUILD
        // =====================================================

        document
            .getElementById(
                "invoiceEditModal"
            )
            ?.classList.remove(
                "show"
            );


        editingInvoice =
            null;


        await loadSupplierInvoices();

        await loadSupplierProducts();


        filteredSupplierInvoices =
            [...supplierInvoices];


        filteredSupplierProducts =
            [...supplierProducts];


        renderSummary();

        renderProducts();

        updateStats();


        if (invoiceForPrint) {

            renderInvoice(
                invoiceForPrint
            );

        }


        alert(
            "Invoice updated successfully."
        );

    }
    catch (error) {

        console.error(
            "saveSupplierInvoiceEdit error:",
            error
        );


        // =====================================================
        // NETWORK LOST DURING ONLINE REQUEST
        // =====================================================

        if (
            !navigator.onLine
        ) {

            try {

                /*
                 * The request did not complete because the
                 * network disappeared. Apply the local update
                 * and queue the backend operation.
                 */

                await applySupplierReturnLocally(
                    oldInvoice,
                    updatedInvoice
                );


                await saveToOfflineDB(
                    "invoices",
                    updatedInvoice
                );


                await addToSyncQueue({

                    endpoint:
                        `/invoice/${updatedInvoice.id}/update-last`,

                    method:
                        "PUT",

                    body: {

                        items:
                            items,

                        cash:
                            cash

                    }

                });


                invoiceForPrint =
                    updatedInvoice;


                editingInvoice =
                    null;


                document
                    .getElementById(
                        "invoiceEditModal"
                    )
                    ?.classList.remove(
                        "show"
                    );


                await loadSupplierInvoices();


                filteredSupplierInvoices =
                    [...supplierInvoices];


                renderSummary();

                updateStats();

                renderInvoice(
                    updatedInvoice
                );


                alert(
                    "Internet connection was lost. Invoice changes were saved offline and will synchronize when internet returns."
                );

            }
            catch (offlineError) {

                console.error(
                    "Offline invoice fallback failed:",
                    offlineError
                );


                alert(
                    "Failed to save invoice changes offline."
                );

            }

        }
        else {

            alert(
                error.message ||
                "Unable to update invoice."
            );

        }

    }
    finally {

        const saveBtn =
            document.getElementById(
                "saveInvoiceEdit"
            );


        if (saveBtn) {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                "Save Changes";

        }

    }

}


// ============================================================
// PRINT SUPPLIER SUMMARY
// ============================================================

function printSupplierSummary() {

    if (!supplier) {

        alert(
            "Supplier information is not loaded."
        );

        return;

    }


    if (
        !supplierInvoices ||
        supplierInvoices.length ===
        0
    ) {

        alert(
            "No supplier invoice records found."
        );

        return;

    }


    const summary =
        filteredSupplierInvoices.length
            ? filteredSupplierInvoices
            : supplierInvoices;


    if (!summary.length) {

        alert(
            "No invoice records found."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=900"
        );


    if (!printWindow) {

        alert(
            "Please allow popups to print the supplier statement."
        );

        return;

    }


    const supplierName =
        supplier.companyName ||
        "-";


    const supplierIdValue =
        supplier.id ||
        supplierId ||
        "-";


    let openingBalance =
        Number(
            supplier.openingBalance ??
            0
        );


    if (
        supplier.openingBalance ===
            undefined ||
        supplier.openingBalance ===
            null
    ) {

        if (
            summary.length > 0
        ) {

            const first =
                [...summary]
                    .sort(
                        (a, b) =>
                            new Date(a.date) -
                            new Date(b.date)
                    )[0];


            openingBalance =
                Number(
                    first.balance ||
                    0
                ) -
                Number(
                    first.amount ??
                    first.netTotal ??
                    first.subtotal ??
                    0
                ) +
                Number(
                    first.commission ||
                    0
                ) +
                Number(
                    first.cash ||
                    0
                );

        }

    }


    const sortedSummary =
        [...summary]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    const rows =
        sortedSummary
            .map(
                (
                    invoice,
                    index
                ) => {

                    const date =
                        invoice.date
                            ? new Date(
                                invoice.date
                            ).toLocaleDateString(
                                "en-GB",
                                {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                }
                            )
                            : "-";


                    const amount =
                        Number(
                            invoice.amount ??
                            invoice.netTotal ??
                            invoice.subtotal ??
                            0
                        );


                    const commission =
                        Number(
                            invoice.commission ||
                            0
                        );


                    const advance =
                        Number(
                            invoice.cash ||
                            0
                        );


                    const balance =
                        Number(
                            invoice.balance ||
                            0
                        );


                    const invoiceNo =
                        invoice.invoiceNo ||
                        invoice.id ||
                        invoice.invoiceId ||
                        "-";


                    const totalQuantity =
                        invoice.totalQuantity !==
                        undefined
                            ? Number(
                                invoice.totalQuantity ||
                                0
                            )
                            : (
                                invoice.items ||
                                []
                            ).reduce(
                                (
                                    total,
                                    item
                                ) =>
                                    total +
                                    Number(
                                        item.quantity ||
                                        0
                                    ),
                                0
                            );


                    return `

                        <tr>

                            <td class="center">
                                ${index + 1}
                            </td>

                            <td class="center">
                                ${date}
                            </td>

                            <td class="center">
                                ${escapeHTML(
                                    String(
                                        invoiceNo
                                    )
                                )}
                            </td>

                            <td>
                                Purchase of Ice Cream
                            </td>

                            <td class="number">
                                ${totalQuantity.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                            <td class="number">
                                ${amount.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                            <td class="number">
                                ${commission.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                            <td class="number">
                                ${advance.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                            <td class="number balance-cell">
                                ${balance.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    const totalItems =
        sortedSummary.reduce(
            (
                sum,
                invoice
            ) => {

                if (
                    invoice.totalQuantity !==
                    undefined
                ) {

                    return (
                        sum +
                        Number(
                            invoice.totalQuantity ||
                            0
                        )
                    );

                }


                return (
                    sum +
                    (
                        invoice.items ||
                        []
                    ).reduce(
                        (
                            itemSum,
                            item
                        ) =>
                            itemSum +
                            Number(
                                item.quantity ||
                                0
                            ),
                        0
                    )
                );

            },
            0
        );


    const totalAmount =
        sortedSummary.reduce(
            (
                sum,
                invoice
            ) =>
                sum +
                Number(
                    invoice.amount ??
                    invoice.netTotal ??
                    invoice.subtotal ??
                    0
                ),
            0
        );


    const totalCommission =
        sortedSummary.reduce(
            (
                sum,
                invoice
            ) =>
                sum +
                Number(
                    invoice.commission ||
                    0
                ),
            0
        );


    const totalAdvance =
        sortedSummary.reduce(
            (
                sum,
                invoice
            ) =>
                sum +
                Number(
                    invoice.cash ||
                    0
                ),
            0
        );


    const finalBalance =
        Number(
            sortedSummary[
                sortedSummary.length -
                1
            ]?.balance ||
            0
        );


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Supplier Statement -
    ${escapeHTML(supplierName)}
</title>

<style>

@page {

    size: A4 landscape;

    margin: 12mm;

}


* {

    box-sizing: border-box;

}


body {

    margin: 0;

    padding: 0;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #000;

    background: #fff;

    font-size: 10px;

}


.statement {

    width: 100%;

}


.header {

    text-align: center;

    margin-bottom: 12px;

}


.company-name {

    font-size: 20px;

    font-weight: bold;

    margin-bottom: 4px;

}


.company-address {

    font-size: 9px;

    line-height: 1.4;

}


.statement-title {

    font-size: 16px;

    font-weight: bold;

    margin-top: 8px;

    text-decoration: underline;

}


.supplier-name {

    font-size: 14px;

    font-weight: bold;

    margin-top: 4px;

}


.info {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin: 8px 0;

}


.info-left {

    font-weight: bold;

}


.opening-balance {

    border: 1px solid #000;

    padding: 5px 12px;

    font-size: 12px;

    font-weight: bold;

}


table {

    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;

}


th,
td {

    border: 1px solid #555;

    padding: 4px 5px;

    vertical-align: middle;

}


th {

    text-align: center;

    font-weight: bold;

    background: #f2f2f2;

}


.center {

    text-align: center;

}


.number {

    text-align: right;

    white-space: nowrap;

}


.balance-cell {

    font-weight: bold;

}


.total-row td {

    font-weight: bold;

    border-top: 2px solid #000;

}


.footer {

    margin-top: 20px;

    display: flex;

    justify-content: space-between;

}


.signature {

    width: 180px;

    text-align: center;

}


.signature-line {

    border-top: 1px solid #000;

    margin-bottom: 5px;

}


.page-number {

    text-align: center;

    margin-top: 15px;

    font-size: 9px;

}


.col-no {
    width: 4%;
}

.col-date {
    width: 9%;
}

.col-invoice {
    width: 8%;
}

.col-particular {
    width: 23%;
}

.col-items {
    width: 8%;
}

.col-amount {
    width: 11%;
}

.col-commission {
    width: 12%;
}

.col-advance {
    width: 11%;
}

.col-balance {
    width: 14%;
}


@media print {

    body {

        -webkit-print-color-adjust:
            exact;

        print-color-adjust:
            exact;

    }

    thead {

        display: table-header-group;

    }

    tr {

        page-break-inside: avoid;

    }

}

</style>

</head>


<body>

<div class="statement">


    <div class="header">

        <div class="company-name">
            AJWA ICE CREAM
        </div>


        <div class="company-address">

            Head Office: New Ring Road Near Madni Colony
            Back side Zantara Town Peshawar

            <br>

            Tel # 091-2601784

            &nbsp;&nbsp;

            Mobile # 0345-9101300 /
            0317-1234570

            <br>

            Peshawar Pakistan

        </div>


        <div class="statement-title">
            SUPPLIER STATEMENT / HISTORY
        </div>


        <div class="supplier-name">
            ${escapeHTML(supplierName)}
        </div>

    </div>


    <div class="info">

        <div class="info-left">

            Supplier ID:
            ${escapeHTML(
                String(supplierIdValue)
            )}

            &nbsp;&nbsp;&nbsp;

            Total Transactions:
            ${sortedSummary.length}

        </div>


        <div class="opening-balance">

            Opening Balance:
            Rs.
            ${openingBalance.toLocaleString(
                "en-PK"
            )}

        </div>

    </div>


    <table>


        <colgroup>

            <col class="col-no">

            <col class="col-date">

            <col class="col-invoice">

            <col class="col-particular">

            <col class="col-items">

            <col class="col-amount">

            <col class="col-commission">

            <col class="col-advance">

            <col class="col-balance">

        </colgroup>


        <thead>

            <tr>

                <th>S. No</th>

                <th>Date</th>

                <th>Invoice<br>No</th>

                <th>Particulars</th>

                <th>No's of<br>Items</th>

                <th>Amount</th>

                <th>Commission/Discount</th>

                <th>Advance Payment</th>

                <th>Balance Amount</th>

            </tr>

        </thead>


        <tbody>

            <tr>

                <td class="center">
                    1
                </td>

                <td></td>

                <td></td>

                <td>
                    <strong>
                        Opening Balance
                    </strong>
                </td>

                <td></td>

                <td class="number">
                    -
                </td>

                <td class="number">
                    -
                </td>

                <td class="number">
                    -
                </td>

                <td class="number balance-cell">
                    ${openingBalance.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            ${rows}


            <tr class="total-row">

                <td
                    colspan="4"
                    class="number"
                >
                    TOTAL
                </td>

                <td class="number">
                    ${totalItems.toLocaleString(
                        "en-PK"
                    )}
                </td>

                <td class="number">
                    ${totalAmount.toLocaleString(
                        "en-PK"
                    )}
                </td>

                <td class="number">
                    ${totalCommission.toLocaleString(
                        "en-PK"
                    )}
                </td>

                <td class="number">
                    ${totalAdvance.toLocaleString(
                        "en-PK"
                    )}
                </td>

                <td class="number">
                    ${finalBalance.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>

        </tbody>

    </table>


    <div class="footer">


        <div class="signature">

            <div class="signature-line"></div>

            Prepared By

            <br>

            Accounts Clerk

        </div>


        <div class="signature">

            <div class="signature-line"></div>

            Verified By

            <br>

            Manager Accounts

        </div>


        <div class="signature">

            <div class="signature-line"></div>

            Approved By

            <br>

            MD/HoO

        </div>


    </div>


    <div class="page-number">
        Page 1 of 1
    </div>


</div>


<script>

window.onload = function() {

    window.print();

};

window.onafterprint = function() {

    window.close();

};

<\/script>


</body>

</html>

    `);


    printWindow.document.close();

}


// ============================================================
// PRINT LINK / INVOICE
// ============================================================

function setupButtons() {

    const purchaseButton =
        document.getElementById(
            "purchaseStockBtn"
        );


    if (purchaseButton) {

        purchaseButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `purchase-stocks.html?supplierId=${supplierId}`;

            }
        );

    }


    const addPurchaseButton =
        document.getElementById(
            "addPurchaseBtn"
        );


    if (addPurchaseButton) {

        addPurchaseButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `purchase-stocks.html?supplierId=${supplierId}`;

            }
        );

    }


    const addProductButton =
        document.getElementById(
            "addProductBtn"
        );


    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `Products.html?supplierId=${supplierId}`;

            }
        );

    }


    const printLink =
        document.getElementById(
            "printLink"
        );


    if (printLink) {

        printLink.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (!invoiceForPrint) {

                    alert(
                        "Please select an invoice first."
                    );

                    return;

                }


                printRealInvoice(
                    invoiceForPrint
                );

            }
        );

    }


    const fullscreenLink =
        document.getElementById(
            "fullscreenLink"
        );


    if (fullscreenLink) {

        fullscreenLink.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const invoicePanel =
                    document.querySelector(
                        ".invoice-panel"
                    );


                if (
                    invoicePanel &&
                    invoicePanel.requestFullscreen
                ) {

                    invoicePanel.requestFullscreen();

                }

            }
        );

    }


    document
        .getElementById(
            "PrintSummary"
        )
        ?.addEventListener(
            "click",
            () => {

                printSupplierSummary();

            }
        );

}


// ============================================================
// REAL INVOICE PRINT
// ============================================================

function printRealInvoice(
    invoice
) {

    if (!invoice) {

        alert(
            "Invoice information is not loaded."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=1000"
        );


    if (!printWindow) {

        alert(
            "Please allow popups to print the invoice."
        );

        return;

    }


    const invoiceDate =
        invoice.date
            ? new Date(
                invoice.date
            ).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            : "-";


    const items =
        Array.isArray(
            invoice.items
        )
            ? invoice.items
            : [];


    const itemsRows =
        items
            .map(
                (
                    item,
                    index
                ) => {

                    const quantity =
                        Number(
                            item.quantity || 0
                        );


                    const returned =
                        getReturnQuantity(
                            item
                        );


                    const net =
                        Math.max(
                            quantity -
                            returned,
                            0
                        );


                    const price =
                        Number(
                            item.price || 0
                        );


                    const amount =
                        item.amount !==
                            undefined
                            ? Number(
                                item.amount || 0
                            )
                            : net * price;


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.productName ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${price.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                            <td>
                                ${quantity}
                            </td>

                            <td>
                                ${returned}
                            </td>

                            <td>
                                ${net}
                            </td>

                            <td>
                                ${amount.toLocaleString(
                                    "en-PK"
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    const totalQuantity =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );


    const totalReturned =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                getReturnQuantity(
                    item
                ),
            0
        );


    const totalNet =
        Math.max(
            totalQuantity -
            totalReturned,
            0
        );


    const subtotal =
        Number(
            invoice.subtotal || 0
        );


    const commission =
        Number(
            invoice.commission || 0
        );


    const discount =
        Number(
            invoice.discount || 0
        );


    const netTotal =
        Number(
            invoice.netTotal || 0
        );


    const cash =
        Number(
            invoice.cash || 0
        );


    const arrears =
        Number(
            invoice.arrears || 0
        );


    const balance =
        Number(
            invoice.balance || 0
        );


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Invoice ${escapeHTML(
        String(
            invoice.id || ""
        )
    )}
</title>

<style>

@page {

    size: A4;

    margin: 15mm;

}


* {
    box-sizing: border-box;
}


body {

    margin: 0;

    padding: 0;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #000;

    background: white;

    font-size: 12px;

}


.invoice {

    width: 100%;

    max-width: 780px;

    margin: auto;

}


.header {

    text-align: center;

    margin-bottom: 10px;

}


.company-name {

    font-size: 25px;

    font-weight: bold;

    margin-bottom: 5px;

}


.company-address {

    font-size: 11px;

    line-height: 1.5;

}


.invoice-title {

    font-size: 18px;

    font-weight: bold;

    text-decoration: underline;

    margin-top: 10px;

}


.info-table {

    width: 100%;

    border-collapse: collapse;

    margin-top: 8px;

    margin-bottom: 8px;

}


.info-table td {

    border: 1px solid #999;

    padding: 6px;

}


.info-label {

    font-weight: bold;

    width: 18%;

}


.info-value {

    width: 32%;

}


.items-table {

    width: 100%;

    border-collapse: collapse;

    margin-top: 5px;

}


.items-table th,
.items-table td {

    border: 1px solid #999;

    padding: 5px 4px;

    text-align: center;

}


.items-table th {

    font-weight: bold;

    background: #f5f5f5;

}


.items-table td:nth-child(2) {

    text-align: left;

}


.subtotal-row td {

    font-weight: bold;

}


.totals-container {

    display: flex;

    justify-content: flex-end;

    margin-top: 10px;

}


.totals-table {

    width: 50%;

    border-collapse: collapse;

}


.totals-table td {

    padding: 5px 8px;

    border-bottom: 1px solid #aaa;

}


.totals-table td:first-child {

    text-align: left;

    font-weight: bold;

}


.totals-table td:last-child {

    text-align: right;

    min-width: 120px;

}


.balance-row td {

    font-size: 14px;

    font-weight: bold;

    border-top: 2px solid #000;

}


.signatures {

    display: flex;

    justify-content: space-between;

    margin-top: 110px;

    text-align: center;

}


.signature {

    width: 30%;

}


.signature-line {

    border-top: 1px solid #000;

    margin-bottom: 6px;

}


.signature-title {

    font-weight: bold;

}


.page-number {

    text-align: center;

    margin-top: 25px;

    font-size: 10px;

}


@media print {

    body {

        background: white;

        -webkit-print-color-adjust:
            exact;

        print-color-adjust:
            exact;

    }

}

</style>

</head>


<body>

<div class="invoice">


    <div class="header">

        <div class="company-name">
            AJWA ICE CREAM
        </div>


        <div class="company-address">

            Head Office: New Ring Road Near Madni Colony
            Back side Zantara Town Peshawar

            <br>

            Tel # 091-2601784
            &nbsp;&nbsp;

            Mobile # 0345-9101300 /
            0317-1234570

            <br>

            Peshawar Pakistan

        </div>


        <div class="invoice-title">
            PURCHASE INVOICE
        </div>

    </div>


    <table class="info-table">

        <tr>

            <td class="info-label">
                Supplier
            </td>

            <td class="info-value">
                ${escapeHTML(
                    supplier?.companyName ||
                    "-"
                )}
            </td>

            <td class="info-label">
                Inv No.
            </td>

            <td class="info-value">
                ${escapeHTML(
                    String(
                        invoice.id ||
                        "-"
                    )
                )}
            </td>

        </tr>


        <tr>

            <td class="info-label">
                Date
            </td>

            <td class="info-value">
                ${invoiceDate}
            </td>

            <td class="info-label">
                Supplier ID
            </td>

            <td class="info-value">
                ${escapeHTML(
                    String(
                        supplier?.id ||
                        supplierId ||
                        "-"
                    )
                )}
            </td>

        </tr>

    </table>


    <table class="items-table">

        <thead>

            <tr>

                <th>No.</th>

                <th>Type of Goods</th>

                <th>Price</th>

                <th>Purchase</th>

                <th>Return</th>

                <th>Net P</th>

                <th>Amount</th>

            </tr>

        </thead>


        <tbody>

            ${itemsRows}


            <tr class="subtotal-row">

                <td colspan="3">
                    SUBTOTAL:
                </td>

                <td>
                    ${totalQuantity}
                </td>

                <td>
                    ${totalReturned}
                </td>

                <td>
                    ${totalNet}
                </td>

                <td>
                    ${subtotal.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>

        </tbody>

    </table>


    <div class="totals-container">

        <table class="totals-table">

            <tr>

                <td>
                    Sub Total
                </td>

                <td>
                    ${subtotal.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Commission ${
                        Number(
                            invoice.dynamicComission ||
                            0
                        ) * 100
                    }%
                </td>

                <td>
                    ${commission.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Discount
                </td>

                <td>
                    ${discount.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Net Total
                </td>

                <td>
                    ${netTotal.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Cash
                </td>

                <td>
                    ${cash.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Current Bill
                </td>

                <td>
                    ${(
                        netTotal -
                        cash
                    ).toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Arrears
                </td>

                <td>
                    ${arrears.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>


            <tr class="balance-row">

                <td>
                    Balance
                </td>

                <td>
                    ${balance.toLocaleString(
                        "en-PK"
                    )}
                </td>

            </tr>

        </table>

    </div>


    <div class="signatures">


        <div class="signature">

            <div class="signature-line"></div>

            <div class="signature-title">
                Prepared By
            </div>

            <div>
                Accounts Clerk
            </div>

        </div>


        <div class="signature">

            <div class="signature-line"></div>

            <div class="signature-title">
                Verified By
            </div>

            <div>
                Manager Accounts
            </div>

        </div>


        <div class="signature">

            <div class="signature-line"></div>

            <div class="signature-title">
                Approved By
            </div>

            <div>
                MD/HoO
            </div>

        </div>

    </div>


    <div class="page-number">
        Page 1 of 1
    </div>

</div>


<script>

window.onload = function() {

    window.print();

};

window.onafterprint = function() {

    window.close();

};

<\/script>


</body>

</html>

    `);


    printWindow.document.close();

}


// ============================================================
// TABS
// ============================================================

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".tab"
        );


    const summaryPanels =
        document.getElementById(
            "summaryPanels"
        );


    const productsPanels =
        document.getElementById(
            "productsPanels"
        );


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    tabs.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    tab.classList.add(
                        "active"
                    );


                    const selected =
                        tab.dataset.tab;


                    if (
                        selected ===
                        "summary"
                    ) {

                        if (
                            summaryPanels
                        ) {

                            summaryPanels.style.display =
                                "";

                        }


                        if (
                            productsPanels
                        ) {

                            productsPanels.style.display =
                                "none";

                        }

                    }


                    if (
                        selected ===
                        "products"
                    ) {

                        if (
                            summaryPanels
                        ) {

                            summaryPanels.style.display =
                                "none";

                        }


                        if (
                            productsPanels
                        ) {

                            productsPanels.style.display =
                                "";

                        }

                    }

                }
            );

        }
    );

}


// ============================================================
// SIDEBAR
// ============================================================

function setupSidebar() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        !menuToggle ||
        !sidebar ||
        !overlay
    ) {

        return;

    }


    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );


            overlay.classList.toggle(
                "show"
            );

        }
    );


    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "open"
            );


            overlay.classList.remove(
                "show"
            );

        }
    );

}


// ============================================================
// DATE
// ============================================================

function setupDate() {

    const datePill =
        document.getElementById(
            "datePill"
        );


    if (!datePill) {
        return;
    }


    datePill.textContent =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    if (infoCompanyName) {

        infoCompanyName.textContent =
            "Loading...";

    }

}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-PK"
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }


    const d =
        new Date(
            date
        );


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

        return "-";

    }


    return d.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// GET RETURN QUANTITY
// ============================================================

function getReturnQuantity(
    item
) {

    return Number(
        item?.returnQuantity ??
        item?.returnedQuantity ??
        0
    ) || 0;

}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /[&<>"']/g,
            character =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                })[
                    character
                ]
        );

}


// ============================================================
// ATTRIBUTE SECURITY
// ============================================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}