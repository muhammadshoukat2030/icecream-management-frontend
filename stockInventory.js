// ===========================================================
// Stock Inventory Admin Page - Offline First
// ===========================================================

const API =
    window.APP_CONFIG?.API ||
    "https://ice-cream-management.vercel.app";

let inventory = [];


// ===========================================================
// ADMIN DISPLAY
// ===========================================================

function setupAdminDisplay() {

    const adminElement =
        document.getElementById("admin");

    if (!adminElement) return;

    /*
     * Authentication is handled by the HTTP-only JWT cookie.
     * We do not read the JWT from localStorage.
     *
     * If your shared layout already provides the logged-in
     * user's information, use it here.
     */
    if (window.currentUser?.email) {

        adminElement.textContent =
            window.currentUser.email;

    } else if (window.adminUser?.email) {

        adminElement.textContent =
            window.adminUser.email;

    } else {

        adminElement.textContent =
            "Admin";

    }

}

setupAdminDisplay();


// ===========================================================
// DATE
// ===========================================================

const datePill =
    document.getElementById("datePill");

if (datePill) {

    const today =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    datePill.textContent =
        today;
}


// ===========================================================
// STOCK THRESHOLD
// ===========================================================

const LOW_STOCK_THRESHOLD = 20;


function computeStatus(stock) {

    if (stock <= 0) {
        return "Out of Stock";
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
        return "Low Stock";
    }

    return "In Stock";
}


function statusClass(status) {

    if (status === "Out of Stock") {
        return "out";
    }

    if (status === "Low Stock") {
        return "low";
    }

    return "active";
}


function formatMoney(n) {

    n = Number(n || 0);

    if (n >= 1000000) {

        return (
            (n / 1000000)
                .toFixed(2)
                .replace(/\.00$/, "") +
            "M"
        );

    }

    return n.toLocaleString();
}


// ===========================================================
// NORMALIZE BACKEND PRODUCT FOR INVENTORY UI
// ===========================================================

function normalizeProduct(product) {

    return {

        id:
            product.id,

        product:
            product.name ??
            product.productName ??
            "",

        company:
            product.company ??
            "",

        category:
            product.category ??
            "",

        /*
         * IMPORTANT:
         * Backend currently uses "qunatity".
         */
        availableStock:
            Number(
                product.qunatity ??
                product.quantity ??
                product.stock ??
                0
            ),

        lastPurchase:
            product.lastPurchase
                ? String(
                    product.lastPurchase
                ).substring(0, 10)
                : "",

        unitPrice:
            Number(
                product.purchasePrice ??
                0
            )

    };

}


// ===========================================================
// NORMALIZE BACKEND PRODUCT FOR PRODUCTS INDEXEDDB STORE
// ===========================================================

function normalizeProductForDB(product) {

    return {

        id:
            product.id,

        productName:
            product.productName ??
            product.name ??
            "",

        brand:
            product.brand ??
            "",

        company:
            product.company ??
            "",

        purchasePrice:
            Number(
                product.purchasePrice ??
                0
            ),

        salePrice:
            Number(
                product.salePrice ??
                0
            ),

        category:
            product.category ??
            "",

        description:
            product.description ??
            "",

        /*
         * The local products store uses "stock".
         *
         * We preserve the backend "qunatity" concept
         * by converting it to the existing local shape.
         */
        stock:
            Number(
                product.stock ??
                product.qunatity ??
                product.quantity ??
                0
            ),

        commissionApplicable:
            product.commissionApplicable ??
            "",

        lastPurchase:
            product.lastPurchase ??
            ""

    };

}


// ===========================================================
// BUILD BACKEND PRODUCT UPDATE PAYLOAD
// ===========================================================

function buildProductUpdatePayload(
    product,
    newStock
) {

    return {

        id:
            product.id,

        name:
            product.name ??
            product.productName ??
            "",

        brand:
            product.brand ??
            "",

        company:
            product.company ??
            "",

        purchasePrice:
            Number(
                product.purchasePrice ??
                0
            ),

        salePrice:
            Number(
                product.salePrice ??
                0
            ),

        category:
            product.category ??
            "",

        description:
            product.description ??
            "",

        /*
         * IMPORTANT:
         * Keep backend spelling.
         */
        qunatity:
            Number(newStock),

        commissionApplicable:
            product.commissionApplicable ??
            ""

    };

}


// ===========================================================
// RECALCULATE LOCAL CATEGORY/SUPPLIER COUNTS
//
// These are only local IndexedDB projections.
// We DO NOT add category/supplier operations
// to syncQueue.
// ===========================================================

async function recalculateRelationshipCounts() {

    try {

        const products =
            await getAllFromOfflineDB(
                "products"
            );

        const categories =
            await getAllFromOfflineDB(
                "categories"
            );

        const suppliers =
            await getAllFromOfflineDB(
                "suppliers"
            );


        // ===================================================
        // CATEGORY COUNTS
        // ===================================================

        const categoryCounts = {};


        products.forEach(product => {

            const category =
                product.category ??
                "";

            if (!category) {
                return;
            }

            categoryCounts[category] =
                (
                    categoryCounts[category] ||
                    0
                ) + 1;

        });


        for (
            const category
            of categories
        ) {

            const categoryName =
                category.category ??
                category.name ??
                "";

            const count =
                categoryCounts[categoryName] ??
                0;

            await saveToOfflineDB(
                "categories",
                {
                    ...category,

                    products:
                        count,

                    totalProducts:
                        count
                }
            );

        }


        // ===================================================
        // SUPPLIER COUNTS
        // ===================================================

        const supplierCounts = {};


        products.forEach(product => {

            const company =
                product.company ??
                "";

            if (!company) {
                return;
            }

            supplierCounts[company] =
                (
                    supplierCounts[company] ||
                    0
                ) + 1;

        });


        for (
            const supplier
            of suppliers
        ) {

            const companyName =
                supplier.companyName ??
                "";

            const count =
                supplierCounts[companyName] ??
                0;

            await saveToOfflineDB(
                "suppliers",
                {
                    ...supplier,

                    totalProducts:
                        count
                }
            );

        }


    } catch (error) {

        console.error(
            "Failed to recalculate local relationship counts:",
            error
        );

    }

}


// ===========================================================
// LOAD INVENTORY FROM INDEXEDDB
// ===========================================================

async function loadInventoryFromIndexedDB() {

    try {

        const products =
            await getAllFromOfflineDB(
                "products"
            );


        inventory =
            products.map(
                normalizeProduct
            );


        const categories = [
            ...new Set(
                inventory
                    .map(
                        product =>
                            product.category
                    )
                    .filter(Boolean)
            )
        ];


        populateCategoryDropdown(
            categories
        );


        renderInventoryTable();


        console.log(
            "Inventory loaded from IndexedDB:",
            inventory
        );


    } catch (error) {

        console.error(
            "Failed to load inventory from IndexedDB:",
            error
        );

    }

}


// ===========================================================
// REFRESH INVENTORY FROM BACKEND
// ===========================================================

async function refreshInventoryFromServer() {

    try {

        const res =
            await fetch(
                `${API}/products`,
                {
                    credentials:
                        "include"
                }
            );


        // ===================================================
        // AUTHENTICATION
        // ===================================================

        if (res.status === 401) {

            window.location.href =
                "login.html";

            return false;

        }


        if (!res.ok) {

            throw new Error(
                `Products request failed: ${res.status}`
            );

        }


        const data =
            await res.json();


        if (
            !Array.isArray(
                data.products
            )
        ) {

            throw new Error(
                "Invalid products response."
            );

        }


        // ===================================================
        // SAVE FRESH PRODUCTS INTO INDEXEDDB
        // ===================================================

        for (
            const product
            of data.products
        ) {

            await saveToOfflineDB(
                "products",
                normalizeProductForDB(
                    product
                )
            );

        }


        // ===================================================
        // REMOVE PRODUCTS NO LONGER ON SERVER
        // ===================================================

        const serverIds =
            new Set(
                data.products.map(
                    product =>
                        Number(product.id)
                )
            );


        const localProducts =
            await getAllFromOfflineDB(
                "products"
            );


        for (
            const localProduct
            of localProducts
        ) {

            if (
                !serverIds.has(
                    Number(
                        localProduct.id
                    )
                )
            ) {

                await deleteFromOfflineDB(
                    "products",
                    localProduct.id
                );

            }

        }


        // ===================================================
        // UPDATE INVENTORY UI
        // ===================================================

        inventory =
            data.products.map(
                normalizeProduct
            );


        const categories = [
            ...new Set(
                inventory
                    .map(
                        product =>
                            product.category
                    )
                    .filter(Boolean)
            )
        ];


        populateCategoryDropdown(
            categories
        );


        renderInventoryTable();


        console.log(
            "Inventory refreshed from backend:",
            inventory
        );


        return true;


    } catch (error) {

        console.error(
            "Failed to refresh inventory from server:",
            error
        );

        return false;

    }

}


// ===========================================================
// CHECK PENDING PRODUCT OPERATIONS
//
// IMPORTANT:
// Sync queue uses "endpoint", not "url".
// ===========================================================

async function hasPendingProductOperations() {

    try {

        const pending =
            await getPendingSyncQueue();


        return pending.some(
            operation =>
                String(
                    operation.endpoint || ""
                ).startsWith(
                    "/products"
                )
        );


    } catch (error) {

        console.error(
            "Failed to inspect sync queue:",
            error
        );

        return false;

    }

}


// ===========================================================
// UPDATE STOCK LOCALLY
// ===========================================================

async function updateStockLocally(
    id,
    newStock
) {

    const products =
        await getAllFromOfflineDB(
            "products"
        );


    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!product) {

        throw new Error(
            `Product ${id} not found in IndexedDB.`
        );

    }


    const updatedProduct = {

        ...product,

        stock:
            Number(newStock)

    };


    await saveToOfflineDB(
        "products",
        updatedProduct
    );


    await recalculateRelationshipCounts();


    await loadInventoryFromIndexedDB();

}


// ===========================================================
// QUEUE PRODUCT STOCK UPDATE
// ===========================================================

async function queueStockUpdate(
    product,
    newStock
) {

    const payload =
        buildProductUpdatePayload(
            product,
            newStock
        );


    await addToSyncQueue({

        method:
            "PUT",

        /*
         * IMPORTANT:
         * offline-db.js expects endpoint.
         */
        endpoint:
            `/products/${product.id}`,

        body:
            payload

    });

}


// ===========================================================
// EDIT INVENTORY STOCK
// ===========================================================

async function editInventoryStock(
    row
) {

    const input =
        prompt(
            `Update available stock for "${row.product}":`,
            row.availableStock
        );


    if (input === null) {
        return;
    }


    const parsed =
        Number.parseInt(
            input,
            10
        );


    if (
        Number.isNaN(parsed) ||
        parsed < 0
    ) {

        alert(
            "Please enter a valid stock number."
        );

        return;

    }


    const newStock =
        parsed;


    // ===================================================
    // GET COMPLETE PRODUCT
    // ===================================================

    const products =
        await getAllFromOfflineDB(
            "products"
        );


    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(row.id)
        );


    if (!product) {

        alert(
            "This product is not available in the local product database."
        );

        return;

    }


    // ===================================================
    // UPDATE LOCAL PRODUCT IMMEDIATELY
    // ===================================================

    await updateStockLocally(
        product.id,
        newStock
    );


    // ===================================================
    // QUEUE ONLY ORIGINAL PRODUCT PUT
    // ===================================================

    await queueStockUpdate(
        product,
        newStock
    );


    // ===================================================
    // TRY IMMEDIATE SYNC WHEN ONLINE
    // ===================================================

    if (navigator.onLine) {

        try {

            await processSyncQueue();


            const stillPending =
                await hasPendingProductOperations();


            if (!stillPending) {

                await refreshInventoryFromServer();

            }


        } catch (error) {

            console.error(
                "Immediate stock sync failed:",
                error
            );

        }

    }


    console.log(
        `Product ${product.id} stock changed to ${newStock}.`
    );

}


// ===========================================================
// DELETE PRODUCT LOCALLY + QUEUE DELETE
// ===========================================================

async function deleteInventoryProduct(
    row
) {

    const confirmed =
        confirm(
            `Delete "${row.product}" from inventory?`
        );


    if (!confirmed) {
        return;
    }


    // ===================================================
    // DELETE LOCALLY
    // ===================================================

    await deleteFromOfflineDB(
        "products",
        row.id
    );


    // ===================================================
    // RECALCULATE LOCAL DEPENDENCIES
    // ===================================================

    await recalculateRelationshipCounts();


    await loadInventoryFromIndexedDB();


    // ===================================================
    // QUEUE ONLY ORIGINAL PRODUCT DELETE
    // ===================================================

    await addToSyncQueue({

        method:
            "DELETE",

        /*
         * IMPORTANT:
         * offline-db.js expects endpoint.
         */
        endpoint:
            `/products/${row.id}`,

        /*
         * IMPORTANT:
         * DELETE must not send a JSON body.
         *
         * Your processSyncQueue() correctly omits
         * body and Content-Type when body is null.
         */
        body:
            null

    });


    // ===================================================
    // TRY IMMEDIATE SYNC WHEN ONLINE
    // ===================================================

    if (navigator.onLine) {

        try {

            await processSyncQueue();


            const stillPending =
                await hasPendingProductOperations();


            if (!stillPending) {

                await refreshInventoryFromServer();

            }


        } catch (error) {

            console.error(
                "Immediate delete sync failed:",
                error
            );

        }

    }


    console.log(
        `Product ${row.id} delete operation queued.`
    );

}


// ===========================================================
// TABLE RENDERING
// ===========================================================

function renderInventoryTable() {

    const tbody =
        document.getElementById(
            "inventoryTableBody"
        );


    if (!tbody) {
        return;
    }


    const searchElement =
        document.getElementById(
            "searchInput"
        );

    const categoryElement =
        document.getElementById(
            "categoryFilter"
        );

    const stockElement =
        document.getElementById(
            "stockFilter"
        );


    const query =
        (
            searchElement?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedCategory =
        categoryElement?.value ||
        "";


    const selectedStock =
        stockElement?.value ||
        "";


    tbody.innerHTML =
        "";


    inventory.forEach(row => {

        // =================================================
        // SEARCH
        // =================================================

        if (query) {

            const productName =
                String(
                    row.product
                ).toLowerCase();


            const productId =
                String(
                    row.id
                );


            const matchesSearch =
                productName.includes(
                    query
                ) ||
                productId.includes(
                    query
                );


            if (!matchesSearch) {
                return;
            }

        }


        // =================================================
        // CATEGORY FILTER
        // =================================================

        if (
            selectedCategory &&
            row.category !==
                selectedCategory
        ) {

            return;

        }


        // =================================================
        // STOCK FILTER
        // =================================================

        if (selectedStock) {

            const stock =
                Number(
                    row.availableStock
                );


            // ---------------------------------------------
            // IN STOCK
            // ---------------------------------------------

            if (
                selectedStock ===
                    "in-stock" &&
                stock <=
                    LOW_STOCK_THRESHOLD
            ) {

                return;

            }


            // ---------------------------------------------
            // LOW STOCK
            // ---------------------------------------------

            if (
                selectedStock ===
                    "low-stock" &&
                (
                    stock <= 0 ||
                    stock >
                        LOW_STOCK_THRESHOLD
                )
            ) {

                return;

            }


            // ---------------------------------------------
            // OUT OF STOCK
            // ---------------------------------------------

            if (
                selectedStock ===
                    "out-of-stock" &&
                stock > 0
            ) {

                return;

            }

        }


        // =================================================
        // STATUS
        // =================================================

        const status =
            computeStatus(
                row.availableStock
            );


        // =================================================
        // STOCK VALUE
        // =================================================

        const stockValue =
            Number(
                row.unitPrice || 0
            ) *
            Number(
                row.availableStock || 0
            );


        // =================================================
        // TABLE ROW
        // =================================================

        const tr =
            document.createElement(
                "tr"
            );


        tr.dataset.id =
            row.id;


        tr.innerHTML = `

            <td>
                ${row.id}
            </td>

            <td>
                ${row.product}
            </td>

            <td>
                ${row.company}
            </td>

            <td>
                ${row.category}
            </td>

            <td>
                ${row.availableStock}
            </td>

            <td>
                ${row.lastPurchase}
            </td>

            <td>
                ${stockValue.toLocaleString()}
            </td>

            <td>

                <span
                    class="status-badge-pill ${statusClass(status)}"
                >

                    <span class="dot"></span>

                    ${status}

                </span>

            </td>

           
        `;


        tbody.appendChild(
            tr
        );

    });


    updateStatCards();

}


// ===========================================================
// TABLE ACTIONS
// ===========================================================

const inventoryTableBody =
    document.getElementById(
        "inventoryTableBody"
    );


if (inventoryTableBody) {

    inventoryTableBody.addEventListener(
        "click",
        async event => {

            const btn =
                event.target.closest(
                    "button"
                );


            if (!btn) {
                return;
            }


            const id =
                Number(
                    btn.dataset.id
                );


            const row =
                inventory.find(
                    item =>
                        Number(item.id) ===
                        id
                );


            if (!row) {
                return;
            }


            try {

                // =========================================
                // EDIT
                // =========================================

                if (
                    btn.dataset.action ===
                    "edit"
                ) {

                    await editInventoryStock(
                        row
                    );

                    return;

                }


                // =========================================
                // DELETE
                // =========================================

                if (
                    btn.dataset.action ===
                    "delete"
                ) {

                    await deleteInventoryProduct(
                        row
                    );

                    return;

                }


            } catch (error) {

                console.error(
                    "Inventory action failed:",
                    error
                );


                alert(
                    "The operation could not be completed. Check the console for details."
                );

            }

        }
    );

}


// ===========================================================
// SEARCH FILTER
// ===========================================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderInventoryTable
    );

}


// ===========================================================
// CATEGORY FILTER
// ===========================================================

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderInventoryTable
    );

}


// ===========================================================
// STOCK FILTER
// ===========================================================

const stockFilter =
    document.getElementById(
        "stockFilter"
    );


if (stockFilter) {

    stockFilter.addEventListener(
        "change",
        renderInventoryTable
    );

}


// ===========================================================
// STAT CARDS
// ===========================================================

function updateStatCards() {

    const totalProducts =
        inventory.length;


    const totalStock =
        inventory.reduce(
            (
                sum,
                row
            ) =>
                sum +
                Number(
                    row.availableStock ||
                    0
                ),
            0
        );


    const totalValue =
        inventory.reduce(
            (
                sum,
                row
            ) =>
                sum +
                (
                    Number(
                        row.unitPrice ||
                        0
                    ) *
                    Number(
                        row.availableStock ||
                        0
                    )
                ),
            0
        );


    const lowStockCount =
        inventory.filter(
            row =>
                computeStatus(
                    row.availableStock
                ) ===
                "Low Stock"
        ).length;


    const outOfStockCount =
        inventory.filter(
            row =>
                computeStatus(
                    row.availableStock
                ) ===
                "Out of Stock"
        ).length;


    const statTotalProducts =
        document.getElementById(
            "statTotalProducts"
        );


    const statTotalStock =
        document.getElementById(
            "statTotalStock"
        );


    const statStockValue =
        document.getElementById(
            "statStockValue"
        );


    const statLowStock =
        document.getElementById(
            "statLowStock"
        );


    const statOutOfStock =
        document.getElementById(
            "statOutOfStock"
        );


    if (statTotalProducts) {

        statTotalProducts.textContent =
            totalProducts;

    }


    if (statTotalStock) {

        statTotalStock.textContent =
            totalStock.toLocaleString();

    }


    if (statStockValue) {

        statStockValue.textContent =
            formatMoney(
                totalValue
            );

    }


    if (statLowStock) {

        statLowStock.textContent =
            lowStockCount +
            (
                lowStockCount === 1
                    ? " Product"
                    : " Products"
            );

    }


    if (statOutOfStock) {

        statOutOfStock.textContent =
            outOfStockCount +
            (
                outOfStockCount === 1
                    ? " Product"
                    : " Products"
            );

    }

}


// ===========================================================
// CATEGORY DROPDOWN
// ===========================================================

function populateCategoryDropdown(
    categories
) {

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (!categoryFilter) {
        return;
    }


    categoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            categoryFilter.appendChild(
                option
            );

        }
    );

}


// ===========================================================
// MOBILE SIDEBAR
// ===========================================================

const sidebar =
    document.getElementById(
        "sidebar"
    );


const overlay =
    document.getElementById(
        "sidebarOverlay"
    );


const menuToggle =
    document.getElementById(
        "menuToggle"
    );


function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "show"
        );

    }

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            if (
                sidebar?.classList.contains(
                    "open"
                )
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


// ===========================================================
// SIDEBAR NAVIGATION
// ===========================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            i =>
                                i.classList.remove(
                                    "active"
                                )
                        );


                    item.classList.add(
                        "active"
                    );


                    closeSidebar();

                }
            );

        }
    );


// ===========================================================
// INTERNET RESTORED
//
// offline-db.js already processes the global queue.
// This additionally refreshes the inventory page after
// synchronization is complete.
// ===========================================================

window.addEventListener(
    "online",
    async () => {

        console.log(
            "Internet connection restored."
        );


        try {

            await processSyncQueue();


            const pending =
                await hasPendingProductOperations();


            if (!pending) {

                await refreshInventoryFromServer();

            } else {

                /*
                 * Keep local data visible while a failed
                 * product operation remains pending.
                 */
                await loadInventoryFromIndexedDB();

            }


        } catch (error) {

            console.error(
                "Inventory online refresh failed:",
                error
            );

        }

    }
);


// ===========================================================
// INITIALIZE
//
// IndexedDB first.
// Backend second when possible.
// ===========================================================

async function initializeInventory() {

    // =======================================================
    // SHOW LOCAL DATA FIRST
    // =======================================================

    await loadInventoryFromIndexedDB();


    // =======================================================
    // OFFLINE
    // =======================================================

    if (!navigator.onLine) {

        console.log(
            "Offline mode: using IndexedDB inventory."
        );

        return;

    }


    // =======================================================
    // PROCESS GLOBAL QUEUE
    // =======================================================

    try {

        await processSyncQueue();

    } catch (error) {

        console.error(
            "Initial sync queue processing failed:",
            error
        );

    }


    // =======================================================
    // DON'T OVERWRITE LOCAL PENDING CHANGES
    // =======================================================

    const pending =
        await hasPendingProductOperations();


    if (pending) {

        console.log(
            "Product operations are still pending. Keeping IndexedDB inventory."
        );

        return;

    }


    // =======================================================
    // FETCH FRESH BACKEND DATA
    // =======================================================

    await refreshInventoryFromServer();

}


// ===========================================================
// START PAGE
// ===========================================================

initializeInventory();