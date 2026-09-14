// ===========================================================
// FrostyOps - Issue Stocks Admin Page
// Offline-first invoice creation
// ===========================================================


// ===========================================================
// GLOBAL API
// ===========================================================

const API =
    window.APP_CONFIG?.API ||
    "https://ice-cream-management.vercel.app";


// ===========================================================
// DATA
// ===========================================================

let salesmen = [];

let currentSalesmanId = null;

let arrears = 0;

let adminUser = null;

let entercomission = 0.2;

let products = [];

let issuedItems = [];


// ===========================================================
// INITIAL COMMISSION
// ===========================================================

const dynamicCommissionInput =
    document.getElementById(
        "dynamicCommission"
    );

if (dynamicCommissionInput) {

    dynamicCommissionInput.value =
        entercomission * 100;

}


// ===========================================================
// AUTH / ADMIN DISPLAY
// ===========================================================

function setupAdmin() {

    /*
     * JWT is stored in the HTTP-only cookie.
     * We do not read the JWT from localStorage.
     *
     * shared-layout.js may expose currentUser/adminUser.
     */

    if (
        window.currentUser?.email
    ) {

        adminUser =
            window.currentUser;

    } else if (
        window.adminUser?.email
    ) {

        adminUser =
            window.adminUser;

    }


    const adminElement =
        document.getElementById(
            "admin"
        );


    if (adminElement) {

        adminElement.textContent =
            adminUser?.email ||
            "Admin";

    }

}

setupAdmin();


// ===========================================================
// DATE
// ===========================================================

const datePill =
    document.getElementById(
        "datePill"
    );

if (datePill) {

    datePill.textContent =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );

}


// ===========================================================
// SALESMEN
// ===========================================================

async function fetchSalesmen() {

    // =======================================================
    // LOAD INDEXEDDB CACHE FIRST
    // =======================================================

    try {

        const cachedSalesmen =
            await getAllFromOfflineDB(
                "salesmen"
            );


        salesmen =
            cachedSalesmen.map(
                (s, index) => ({

                    id:
                        Number(
                            s.id ??
                            s.salesman_id ??
                            index + 1
                        ),

                    name:
                        s.name ??
                        s.salesman_name ??
                        "Unknown",

                    status:
                        s.status ??
                        "Active",

                    phone:
                        s.phone ??
                        "",

                    route:
                        s.route ??
                        "",

                    address:
                        s.address ??
                        s.Adress ??
                        "",

                    outstandingBalance:
                        Number(
                            s.outstandingBalance ??
                            s.outStandingBalance ??
                            0
                        )

                })
            );


        console.log(
            "Salesmen from IndexedDB:",
            salesmen
        );


        renderSalesmanDropdown();


        // ===================================================
        // CHECK SALESMAN FROM URL
        // ===================================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const urlSalesman =
            Number(
                urlParams.get(
                    "salesman"
                )
            );


        if (
            urlSalesman &&
            salesmen.some(
                s =>
                    Number(s.id) ===
                    urlSalesman
            )
        ) {

            setSalesman(
                urlSalesman
            );

        } else if (
            currentSalesmanId !== null
        ) {

            const currentSalesman =
                salesmen.find(
                    s =>
                        Number(s.id) ===
                        Number(
                            currentSalesmanId
                        )
                );


            if (
                currentSalesman
            ) {

                setSalesman(
                    currentSalesman.id
                );

            } else if (
                salesmen.length > 0
            ) {

                setSalesman(
                    salesmen[0].id
                );

            }

        } else if (
            salesmen.length > 0
        ) {

            setSalesman(
                salesmen[0].id
            );

        }


    } catch (error) {

        console.error(
            "Salesmen cache load error:",
            error
        );

    }


    // =======================================================
    // OFFLINE
    // =======================================================

    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Using cached salesmen."
        );

        return;

    }


    // =======================================================
    // FETCH FRESH SALESMEN
    // =======================================================

    try {

        const res =
            await fetch(
                `${API}/Allsalesmen`,
                {
                    credentials:
                        "include"
                }
            );


        if (
            res.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (
            !res.ok
        ) {

            throw new Error(
                "Failed to load salesmen"
            );

        }


        const data =
            await res.json();


        const list =
            Array.isArray(data)
                ? data
                : data.data ||
                  data.salesmen ||
                  [];


        console.log(
            "Updated salesmen:",
            list
        );


        // ===================================================
        // SAVE FRESH SALESMEN TO INDEXEDDB
        // ===================================================

        await clearOfflineStore(
            "salesmen"
        );


        await saveManyToOfflineDB(
            "salesmen",
            list
        );


        // ===================================================
        // NORMALIZE FOR PAGE
        // ===================================================

        salesmen =
            list.map(
                (s, index) => ({

                    id:
                        Number(
                            s.id ??
                            s.salesman_id ??
                            index + 1
                        ),

                    name:
                        s.name ??
                        s.salesman_name ??
                        "Unknown",

                    status:
                        s.status ??
                        "Active",

                    phone:
                        s.phone ??
                        "",

                    route:
                        s.route ??
                        "",

                    address:
                        s.address ??
                        s.Adress ??
                        "",

                    outstandingBalance:
                        Number(
                            s.outstandingBalance ??
                            s.outStandingBalance ??
                            0
                        )

                })
            );


        renderSalesmanDropdown();


        // ===================================================
        // RESTORE URL SALESMAN
        // ===================================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const urlSalesman =
            Number(
                urlParams.get(
                    "salesman"
                )
            );


        if (
            urlSalesman &&
            salesmen.some(
                s =>
                    Number(s.id) ===
                    urlSalesman
            )
        ) {

            setSalesman(
                urlSalesman
            );

        } else if (
            currentSalesmanId !== null
        ) {

            const currentSalesman =
                salesmen.find(
                    s =>
                        Number(s.id) ===
                        Number(
                            currentSalesmanId
                        )
                );


            if (
                currentSalesman
            ) {

                setSalesman(
                    currentSalesman.id
                );

            } else if (
                salesmen.length > 0
            ) {

                setSalesman(
                    salesmen[0].id
                );

            }

        } else if (
            salesmen.length > 0
        ) {

            setSalesman(
                salesmen[0].id
            );

        }


    } catch (error) {

        console.error(
            "Failed to refresh salesmen:",
            error
        );

    }

}


// ===========================================================
// PRODUCTS
// ===========================================================

async function fetchProducts() {

    // =======================================================
    // LOAD INDEXEDDB CACHE FIRST
    // =======================================================

    try {

        const cachedProducts =
            await getAllFromOfflineDB(
                "products"
            );


        products =
            cachedProducts.map(
                (p, index) => ({

                    id:
                        Number(
                            p.id ??
                            p.product_id ??
                            index + 1
                        ),

                    name:
                        p.productName ??
                        p.name ??
                        "Unknown",

                    size:
                        p.size ??
                        "",

                    category:
                        p.category ??
                        "Other",

                    price:
                        Number(
                            p.salePrice ??
                            p.price ??
                            0
                        ),

                    stock:
                        Number(
                            p.stock ??
                            p.qunatity ??
                            p.quantity ??
                            0
                        ),

                    commissionApplicable:
                        p.commissionApplicable

                })
            );


        console.log(
            "Products from IndexedDB:",
            products
        );


        renderProductGrid();


    } catch (error) {

        console.error(
            "Product cache load error:",
            error
        );

    }


    // =======================================================
    // OFFLINE
    // =======================================================

    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Using cached products."
        );

        return;

    }


    // =======================================================
    // FETCH FRESH PRODUCTS
    // =======================================================

    try {

        const res =
            await fetch(
                `${API}/products`,
                {
                    credentials:
                        "include"
                }
            );


        if (
            res.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (
            !res.ok
        ) {

            throw new Error(
                "Failed to load products"
            );

        }


        const data =
            await res.json();


        const freshProducts =
            data.products ||
            [];


        products =
            freshProducts.map(
                p => ({

                    id:
                        Number(
                            p.id
                        ),

                    name:
                        p.name ??
                        "Unknown",

                    size:
                        p.size ??
                        "",

                    category:
                        p.category ??
                        "Other",

                    price:
                        Number(
                            p.salePrice ??
                            p.price ??
                            0
                        ),

                    stock:
                        Number(
                            p.qunatity ??
                            p.stock ??
                            p.quantity ??
                            0
                        ),

                    commissionApplicable:
                        p.commissionApplicable

                })
            );


        // ===================================================
        // CACHE PRODUCT SHAPE
        // ===================================================

        const productsForCache =
            freshProducts.map(
                p => ({

                    id:
                        Number(
                            p.id
                        ),

                    productName:
                        p.name,

                    brand:
                        p.company,

                    company:
                        p.company,

                    purchasePrice:
                        p.purchasePrice,

                    salePrice:
                        p.salePrice,

                    category:
                        p.category,

                    description:
                        p.description ||
                        "",

                    stock:
                        Number(
                            p.qunatity ??
                            p.stock ??
                            p.quantity ??
                            0
                        ),

                    commissionApplicable:
                        p.commissionApplicable,

                    lastPurchase:
                        p.lastPurchase ||
                        ""

                })
            );


        await clearOfflineStore(
            "products"
        );


        await saveManyToOfflineDB(
            "products",
            productsForCache
        );


        renderProductGrid();


        console.log(
            "Products refreshed from backend:",
            products
        );


    } catch (error) {

        console.error(
            "Product loading failed:",
            error
        );

    }

}


// ===========================================================
// SYNC EXISTING INVOICES
//
// Uses the centralized function from offline-db.js.
//
// First time:
//     GET /invoices
//
// Later:
//     GET /invoices?limit=10
//
// Older invoices remain in IndexedDB.
// ===========================================================

async function syncInitialInvoices() {

    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Invoice cache sync skipped."
        );

        return;

    }


    try {

        if (
            typeof syncInvoicesToOfflineDB !==
            "function"
        ) {

            console.error(
                "syncInvoicesToOfflineDB() is not available. Make sure offline-db.js loads before issue-stock.js."
            );

            return;

        }


        const syncedInvoices =
            await syncInvoicesToOfflineDB();


        console.log(
            "Invoice cache synchronized:",
            syncedInvoices
        );


    } catch (error) {

        console.error(
            "Initial invoice sync failed:",
            error
        );

    }

}


// ===========================================================
// INITIAL DATA LOAD
// ===========================================================

async function initializeIssueStockPage() {

    /*
     * Load entity caches first.
     */

    await fetchSalesmen();

    await fetchProducts();


    /*
     * Then synchronize invoices.
     */

    await syncInitialInvoices();

}


initializeIssueStockPage();


// ===========================================================
// SALESMAN SELECTOR
// ===========================================================

function renderSalesmanDropdown() {

    const dd =
        document.getElementById(
            "salesmanDropdown"
        );


    if (!dd) {
        return;
    }


    dd.innerHTML =
        "";


    salesmen.forEach(
        salesman => {

            const opt =
                document.createElement(
                    "div"
                );


            opt.className =
                "salesman-option";


            opt.dataset.id =
                salesman.id;


            opt.innerHTML = `

                <div class="salesman-avatar">
                    ${escapeHTML(
                        salesman.name?.charAt(0) ||
                        "?"
                    )}
                </div>

                <div class="salesman-info">

                    <p class="salesman-name-row">

                        <span>
                            ${escapeHTML(
                                salesman.name ||
                                "Unknown"
                            )}
                        </span>

                        <span class="active-pill">
                            ${escapeHTML(
                                String(
                                    salesman.status ??
                                    "Active"
                                )
                            )}
                        </span>

                    </p>

                    <p class="salesman-sub">
                        ${escapeHTML(
                            salesman.phone ||
                            ""
                        )}
                        .
                        ${escapeHTML(
                            salesman.route ||
                            ""
                        )}
                    </p>

                </div>

            `;


            dd.appendChild(
                opt
            );

        }
    );

}


// ===========================================================
// SET SALESMAN
// ===========================================================

function setSalesman(id) {

    const salesman =
        salesmen.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!salesman) {
        return;
    }


    currentSalesmanId =
        Number(
            salesman.id
        );


    const avatar =
        document.getElementById(
            "salesmanAvatar"
        );


    const name =
        document.getElementById(
            "salesmanName"
        );


    const sub =
        document.getElementById(
            "salesmanSub"
        );


    if (avatar) {

        avatar.textContent =
            salesman.name?.charAt(0) ||
            "?";

    }


    if (name) {

        name.textContent =
            salesman.name ||
            "Unknown";

    }


    if (sub) {

        sub.textContent =
            `${salesman.phone || ""} . ${
                salesman.route || ""
            }`;

    }


    arrears =
        Number(
            salesman.outstandingBalance ??
            salesman.outStandingBalance ??
            0
        ) || 0;


    updateSubtotal();

}


// ===========================================================
// SALESMAN DROPDOWN EVENTS
// ===========================================================

const salesmanSelect =
    document.getElementById(
        "salesmanSelect"
    );


const salesmanDropdown =
    document.getElementById(
        "salesmanDropdown"
    );


if (
    salesmanSelect &&
    salesmanDropdown
) {

    salesmanSelect.addEventListener(
        "click",
        () => {

            salesmanDropdown.classList.toggle(
                "show"
            );

        }
    );


    salesmanDropdown.addEventListener(
        "click",
        event => {

            const option =
                event.target.closest(
                    ".salesman-option"
                );


            if (!option) {
                return;
            }


            setSalesman(
                Number(
                    option.dataset.id
                )
            );


            salesmanDropdown.classList.remove(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !salesmanSelect.contains(
                    event.target
                )
            ) {

                salesmanDropdown.classList.remove(
                    "show"
                );

            }

        }
    );

}


// ===========================================================
// PRODUCT SVG
// ===========================================================

function iceCreamThumbSvg() {

    return `

        <svg viewBox="0 0 64 64">

            <g
                fill="none"
                stroke="#7a5230"
                stroke-width="2"
                stroke-linejoin="round">

                <path
                    d="M22 26h20l-8 30a2 2 0 0 1-4 0l-8-30z"
                    fill="#f4dcb8"/>

                <path
                    d="M20 26a12 8 0 0 1 24 0"
                    fill="#7a4a2b"
                    stroke="#5c3820"/>

                <circle
                    cx="26"
                    cy="17"
                    r="4"
                    fill="#e9c9a3"
                    stroke="#5c3820"/>

                <circle
                    cx="32"
                    cy="13"
                    r="4.5"
                    fill="#e9c9a3"
                    stroke="#5c3820"/>

                <circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="#e9c9a3"
                    stroke="#5c3820"/>

            </g>

        </svg>

    `;

}


// ===========================================================
// PRODUCT GRID
// ===========================================================

function renderProductGrid() {

    const grid =
        document.getElementById(
            "productGrid"
        );


    if (!grid) {
        return;
    }


    const searchInput =
        document.getElementById(
            "productSearch"
        );


    const categoryInput =
        document.getElementById(
            "categoryFilter"
        );


    const query =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const category =
        categoryInput?.value ||
        "All Categories";


    grid.innerHTML =
        "";


    products.forEach(
        product => {

            if (
                query &&
                !String(
                    product.name ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        query
                    ) &&
                !String(
                    product.id
                )
                    .includes(
                        query
                    )
            ) {

                return;

            }


            if (
                category !==
                    "All Categories" &&
                product.category !==
                    category
            ) {

                return;

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-thumb-wrap">

                    <div class="product-thumb">

                        ${iceCreamThumbSvg()}

                        <span class="live-dot"></span>

                    </div>


                    <div class="product-title">

                        <p>
                            ${escapeHTML(
                                product.name ||
                                "Unknown"
                            )}
                        </p>

                    </div>

                </div>


                <div class="product-meta">

                    <span>
                        Price
                    </span>

                    <span>
                        Rs.
                        ${Number(
                            product.price ||
                            0
                        ).toLocaleString(
                            "en-PK"
                        )}
                    </span>

                </div>


                <div class="product-meta">

                    <span>
                        Stock(Quantity)
                    </span>

                    <span>
                        ${Number(
                            product.stock ||
                            0
                        )}
                    </span>

                </div>


                <button
                    class="product-add-btn"
                    data-id="${product.id}"
                    ${
                        Number(
                            product.stock
                        ) <= 0
                            ? "disabled"
                            : ""
                    }
                >

                    ${
                        Number(
                            product.stock
                        ) <= 0
                            ? "Out of Stock"
                            : "+ Add"
                    }

                </button>

            `;


            grid.appendChild(
                card
            );

        }
    );

}


// ===========================================================
// PRODUCT GRID EVENTS
// ===========================================================

const productGrid =
    document.getElementById(
        "productGrid"
    );


if (productGrid) {

    productGrid.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".product-add-btn"
                );


            if (!button) {
                return;
            }


            addProductToIssueList(
                Number(
                    button.dataset.id
                )
            );

        }
    );

}


document
    .getElementById(
        "productSearch"
    )
    ?.addEventListener(
        "input",
        renderProductGrid
    );


document
    .getElementById(
        "categoryFilter"
    )
    ?.addEventListener(
        "change",
        renderProductGrid
    );


// ===========================================================
// ADD PRODUCT TO ISSUE LIST
// ===========================================================

function addProductToIssueList(
    productId
) {

    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (!product) {
        return;
    }


    const alreadyAdded =
        issuedItems.some(
            item =>
                Number(
                    item.productId
                ) ===
                Number(
                    productId
                )
        );


    if (alreadyAdded) {

        alert(
            `${product.name} is already added to the invoice.`
        );

        return;

    }


    issuedItems.push({

        productId:
            Number(
                product.id
            ),

        price:
            Number(
                product.price
            ),

        qty:
            "",

        ret:
            "",

        commissionApplicable:
            product.commissionApplicable

    });


    renderIssueTable();

}


// ===========================================================
// ISSUE TABLE
// ===========================================================

function renderIssueTable() {

    const tbody =
        document.getElementById(
            "issueTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    issuedItems.forEach(
        (
            item,
            index
        ) => {

            const product =
                products.find(
                    p =>
                        Number(p.id) ===
                        Number(
                            item.productId
                        )
                );


            if (!product) {
                return;
            }


            const qty =
                Number(
                    item.qty
                ) || 0;


            const ret =
                Number(
                    item.ret
                ) || 0;


            const net =
                Math.max(
                    qty -
                    ret,
                    0
                );


            const amount =
                net *
                Number(
                    item.price ||
                    0
                );


            const availableStock =
                Math.max(
                    Number(
                        product.stock ||
                        0
                    ) -
                    qty,
                    0
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>
                    ${escapeHTML(
                        product.name ||
                        "Unknown"
                    )}
                </td>


                <td>
                    ${Number(
                        item.price ||
                        0
                    ).toLocaleString(
                        "en-PK"
                    )}
                </td>


                <td
                    class="available-stock ${getStockClass(
                        availableStock
                    )}"
                    id="available-stock-${index}"
                >

                    ${availableStock}

                </td>


                <td>

                    <input
                        type="number"
                        class="qty-input"
                        data-index="${index}"
                        value="${item.qty}"
                        min="1"
                        max="${product.stock}"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                    >

                </td>


                <td>

                    <input
                        type="number"
                        class="return-input"
                        data-index="${index}"
                        value="${item.ret}"
                        min="0"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                    >

                </td>


                <td id="net-${index}">
                    ${net}
                </td>


                <td id="amount-${index}">
                    ${amount.toLocaleString(
                        "en-PK"
                    )}
                </td>


                <td>

                    <button
                        type="button"
                        class="delete-issue-row-btn"
                        data-index="${index}"
                        title="Remove product"
                    >

                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >

                            <polyline
                                points="3 6 5 6 21 6">
                            </polyline>


                            <path
                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6">
                            </path>


                            <line
                                x1="10"
                                y1="11"
                                x2="10"
                                y2="17">
                            </line>


                            <line
                                x1="14"
                                y1="11"
                                x2="14"
                                y2="17">
                            </line>

                        </svg>

                    </button>

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );


    updateSubtotal();

}


// ===========================================================
// STOCK CLASS
// ===========================================================

function getStockClass(
    stock
) {

    if (
        stock <= 10
    ) {

        return "stock-critical";

    }


    if (
        stock <= 30
    ) {

        return "stock-low";

    }


    return "stock-good";

}


// ===========================================================
// ISSUE TABLE INPUT EVENTS
// ===========================================================

document
    .getElementById(
        "issueTableBody"
    )
    ?.addEventListener(
        "input",
        event => {

            const index =
                Number(
                    event.target.dataset.index
                );


            if (
                Number.isNaN(index)
            ) {

                return;

            }


            const item =
                issuedItems[
                    index
                ];


            if (!item) {
                return;
            }


            // =================================================
            // QUANTITY
            // =================================================

            if (
                event.target.classList.contains(
                    "qty-input"
                )
            ) {

                const product =
                    products.find(
                        p =>
                            Number(p.id) ===
                            Number(
                                item.productId
                            )
                    );


                if (!product) {
                    return;
                }


                const value =
                    event.target.value;


                if (
                    value === ""
                ) {

                    item.qty =
                        "";

                    updateIssueRow(
                        index
                    );

                    return;

                }


                let qty =
                    Number(
                        value
                    );


                if (
                    Number.isNaN(
                        qty
                    )
                ) {

                    item.qty =
                        "";

                    updateIssueRow(
                        index
                    );

                    return;

                }


                if (
                    qty >
                    Number(
                        product.stock
                    )
                ) {

                    alert(
                        `Only ${product.stock} units are available for ${product.name}.`
                    );


                    qty =
                        Number(
                            product.stock
                        );


                    event.target.value =
                        qty;

                }


                if (
                    qty < 1
                ) {

                    qty =
                        1;


                    event.target.value =
                        qty;

                }


                item.qty =
                    qty;


                if (
                    Number(
                        item.ret
                    ) >
                    qty
                ) {

                    item.ret =
                        qty;

                }


                updateIssueRow(
                    index
                );

            }


            // =================================================
            // RETURN
            // =================================================

            if (
                event.target.classList.contains(
                    "return-input"
                )
            ) {

                const qty =
                    Number(
                        item.qty
                    ) || 0;


                let ret =
                    Number(
                        event.target.value
                    ) || 0;


                if (
                    ret < 0
                ) {

                    ret =
                        0;

                }


                if (
                    ret >
                    qty
                ) {

                    alert(
                        "Return quantity cannot be greater than issued quantity."
                    );


                    ret =
                        qty;

                }


                item.ret =
                    ret;


                event.target.value =
                    ret;


                updateIssueRow(
                    index
                );

            }

        }
    );


// ===========================================================
// ISSUE ROW DELETE
// ===========================================================

document
    .getElementById(
        "issueTableBody"
    )
    ?.addEventListener(
        "click",
        event => {

            const deleteButton =
                event.target.closest(
                    ".delete-issue-row-btn"
                );


            if (!deleteButton) {
                return;
            }


            const index =
                Number(
                    deleteButton.dataset.index
                );


            if (
                Number.isNaN(index)
            ) {

                return;

            }


            issuedItems.splice(
                index,
                1
            );


            renderIssueTable();

        }
    );


// ===========================================================
// STEPPER
// ===========================================================

document
    .getElementById(
        "issueTableBody"
    )
    ?.addEventListener(
        "click",
        event => {

            const stepPart =
                event.target.closest(
                    "[data-dir]"
                );


            if (!stepPart) {
                return;
            }


            const stepper =
                stepPart.closest(
                    ".qty-stepper"
                );


            if (!stepper) {
                return;
            }


            const index =
                Number(
                    stepper.dataset.idx
                );


            const item =
                issuedItems[
                    index
                ];


            if (!item) {
                return;
            }


            const product =
                products.find(
                    p =>
                        Number(p.id) ===
                        Number(
                            item.productId
                        )
                );


            if (!product) {
                return;
            }


            const currentQty =
                Number(
                    item.qty
                ) || 0;


            if (
                stepPart.dataset.dir ===
                "up"
            ) {

                item.qty =
                    Math.min(
                        currentQty + 1,
                        Number(
                            product.stock
                        )
                    );

            } else {

                item.qty =
                    Math.max(
                        currentQty - 1,
                        0
                    );

            }


            if (
                Number(
                    item.ret
                ) >
                Number(
                    item.qty
                )
            ) {

                item.ret =
                    Number(
                        item.qty
                    );

            }


            renderIssueTable();

        }
    );


// ===========================================================
// UPDATE ISSUE ROW
// ===========================================================

function updateIssueRow(
    index
) {

    const item =
        issuedItems[
            index
        ];


    if (!item) {
        return;
    }


    const product =
        products.find(
            p =>
                Number(p.id) ===
                Number(
                    item.productId
                )
        );


    if (!product) {
        return;
    }


    const qty =
        Number(
            item.qty
        ) || 0;


    const ret =
        Number(
            item.ret
        ) || 0;


    const availableStock =
        Math.max(
            Number(
                product.stock ||
                0
            ) -
            qty,
            0
        );


    const net =
        Math.max(
            qty -
            ret,
            0
        );


    const amount =
        net *
        Number(
            item.price ||
            0
        );


    const stockElement =
        document.getElementById(
            `available-stock-${index}`
        );


    if (stockElement) {

        stockElement.textContent =
            availableStock;


        stockElement.classList.remove(
            "stock-good",
            "stock-low",
            "stock-critical"
        );


        stockElement.classList.add(
            getStockClass(
                availableStock
            )
        );

    }


    const netElement =
        document.getElementById(
            `net-${index}`
        );


    if (netElement) {

        netElement.textContent =
            net;

    }


    const amountElement =
        document.getElementById(
            `amount-${index}`
        );


    if (amountElement) {

        amountElement.textContent =
            amount.toLocaleString(
                "en-PK"
            );

    }


    updateSubtotal();

}


// ===========================================================
// TOTALS
// ===========================================================

function updateSubtotal() {

    let qty =
        0;

    let returns =
        0;

    let net =
        0;

    let amount =
        0;

    let nonCommissionableAmount =
        0;


    issuedItems.forEach(
        item => {

            const quantity =
                Number(
                    item.qty
                ) || 0;


            const returned =
                Number(
                    item.ret
                ) || 0;


            /*
             * Correct calculation:
             * quantity - return
             */
            const sales =
                Math.max(
                    quantity -
                    returned,
                    0
                );


            qty +=
                quantity;


            returns +=
                returned;


            net +=
                sales;


            const itemAmount =
                sales *
                Number(
                    item.price ||
                    0
                );


            amount +=
                itemAmount;


            if (
                item.commissionApplicable ===
                "no"
            ) {

                nonCommissionableAmount +=
                    itemAmount;

            }

        }
    );


    setText(
        "subtotalQty",
        qty
    );


    setText(
        "subtotalReturn",
        returns
    );


    setText(
        "subtotalNet",
        net
    );


    setText(
        "subtotalAmount",
        amount.toLocaleString(
            "en-PK"
        )
    );


    const commissionableAmount =
        Math.max(
            amount -
            nonCommissionableAmount,
            0
        );


    const commission =
        commissionableAmount *
        entercomission;


    updateTotals(
        amount,
        commission
    );

}


// ===========================================================
// UPDATE TOTALS
// ===========================================================

function updateTotals(
    subTotal,
    commission
) {

    const discount =
        Number(
            document.getElementById(
                "Discount"
            )?.value
        ) || 0;


    const cash =
        Number(
            document.getElementById(
                "Cash"
            )?.value
        ) || 0;


    const netTotal =
        subTotal -
        commission -
        discount;


    const currentBill =
        netTotal -
        cash;


    const arrearsValue =
        Number(
            arrears
        ) || 0;


    const balance =
        currentBill +
        arrearsValue;


    setText(
        "subTotal",
        subTotal.toLocaleString(
            "en-PK"
        )
    );


    setText(
        "commision",
        commission.toLocaleString(
            "en-PK"
        )
    );


    setText(
        "NetTotal",
        netTotal.toLocaleString(
            "en-PK"
        )
    );


    setText(
        "currentBill",
        currentBill.toLocaleString(
            "en-PK"
        )
    );


    setText(
        "Arrears",
        arrearsValue.toLocaleString(
            "en-PK"
        )
    );


    setText(
        "balance",
        balance.toLocaleString(
            "en-PK"
        )
    );

}


// ===========================================================
// APPLY SALESMAN ISSUE LOCALLY
//
// Local effects:
// 1. Product stock decreases.
// 2. Salesman balance updates.
// 3. Invoice is saved into invoices store.
//
// Only POST /invoices goes into syncQueue.
// ===========================================================

async function applyIssueLocally(
    invoice
) {

    // =======================================================
    // UPDATE PRODUCTS
    // =======================================================

    const localProducts =
        await getAllFromOfflineDB(
            "products"
        );


    const updatedProducts =
        localProducts.map(
            product => {

                const invoiceItem =
                    invoice.items.find(
                        item =>
                            Number(
                                item.productId
                            ) ===
                            Number(
                                product.id
                            )
                    );


                if (!invoiceItem) {

                    return product;

                }


                const quantity =
                    Number(
                        invoiceItem.quantity
                    ) || 0;


                const returnedQuantity =
                    Number(
                        invoiceItem.returnedQuantity ??
                        invoiceItem.returnQuantity ??
                        0
                    ) || 0;


                const netQuantity =
                    Math.max(
                        quantity -
                        returnedQuantity,
                        0
                    );


                const currentStock =
                    Number(
                        product.stock ??
                        product.qunatity ??
                        product.quantity ??
                        0
                    );


                return {

                    ...product,

                    stock:
                        Math.max(
                            currentStock -
                            netQuantity,
                            0
                        )

                };

            }
        );


    await saveManyToOfflineDB(
        "products",
        updatedProducts
    );


    // =======================================================
    // UPDATE SALESMAN BALANCE
    // =======================================================

    const localSalesmen =
        await getAllFromOfflineDB(
            "salesmen"
        );


    const salesmanId =
        Number(
            invoice.partyId
        );


    const updatedSalesmen =
        localSalesmen.map(
            salesman => {

                if (
                    Number(
                        salesman.id
                    ) !==
                    salesmanId
                ) {

                    return salesman;

                }


                return {

                    ...salesman,

                    outstandingBalance:
                        Number(
                            invoice.balance
                        ) || 0

                };

            }
        );


    await saveManyToOfflineDB(
        "salesmen",
        updatedSalesmen
    );


    // =======================================================
    // SAVE INVOICE IN INDEXEDDB
    // =======================================================

    await saveToOfflineDB(
        "invoices",
        invoice
    );


    // =======================================================
    // UPDATE PAGE STATE
    // =======================================================

    products =
        updatedProducts.map(
            product => ({

                id:
                    Number(
                        product.id
                    ),

                name:
                    product.productName ??
                    product.name ??
                    "Unknown",

                size:
                    product.size ??
                    "",

                category:
                    product.category ??
                    "Other",

                price:
                    Number(
                        product.salePrice ??
                        product.price ??
                        0
                    ),

                stock:
                    Number(
                        product.stock ??
                        product.qunatity ??
                        product.quantity ??
                        0
                    ),

                commissionApplicable:
                    product.commissionApplicable

            })
        );


    salesmen =
        updatedSalesmen.map(
            salesman => ({

                id:
                    Number(
                        salesman.id
                    ),

                name:
                    salesman.name ??
                    salesman.salesman_name ??
                    "Unknown",

                status:
                    salesman.status ??
                    "Active",

                phone:
                    salesman.phone ??
                    "",

                route:
                    salesman.route ??
                    "",

                address:
                    salesman.address ??
                    salesman.Adress ??
                    "",

                outstandingBalance:
                    Number(
                        salesman.outstandingBalance ??
                        salesman.outStandingBalance ??
                        0
                    )

            })
        );


    const selectedSalesman =
        salesmen.find(
            salesman =>
                Number(
                    salesman.id
                ) ===
                salesmanId
        );


    if (
        selectedSalesman
    ) {

        arrears =
            Number(
                selectedSalesman.outstandingBalance
            ) || 0;

    }


    renderProductGrid();

    renderIssueTable();

}


// ===========================================================
// CREATE INVOICE
// ===========================================================

document
    .getElementById(
        "createInvoiceBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            if (
                issuedItems.length ===
                0
            ) {

                alert(
                    "Please add products first."
                );

                return;

            }


            if (
                !currentSalesmanId
            ) {

                alert(
                    "Please select a salesman."
                );

                return;

            }


            // =================================================
            // VALIDATE ITEMS
            // =================================================

            for (
                const item
                of issuedItems
            ) {

                const product =
                    products.find(
                        p =>
                            Number(p.id) ===
                            Number(
                                item.productId
                            )
                    );


                if (!product) {

                    alert(
                        "Product not found."
                    );

                    return;

                }


                const qty =
                    Number(
                        item.qty
                    ) || 0;


                const ret =
                    Number(
                        item.ret
                    ) || 0;


                if (
                    qty < 1
                ) {

                    alert(
                        `${product.name}: quantity must be at least 1.`
                    );

                    return;

                }


                if (
                    ret < 0
                ) {

                    alert(
                        `${product.name}: return quantity cannot be negative.`
                    );

                    return;

                }


                if (
                    ret > qty
                ) {

                    alert(
                        `${product.name}: return quantity cannot be greater than quantity.`
                    );

                    return;

                }


                const netQuantity =
                    qty -
                    ret;


                if (
                    Number(
                        product.stock
                    ) <
                    netQuantity
                ) {

                    alert(
                        `${product.name}: only ${product.stock} units available.`
                    );

                    return;

                }

            }


            // =================================================
            // CREATE INVOICE OBJECT
            // =================================================

            const invoice = {

                id:
                    Date.now(),

                type:
                    "salesman",

                partyId:
                    Number(
                        currentSalesmanId
                    ),

                partyName:
                    document.getElementById(
                        "salesmanName"
                    )?.textContent ||
                    "",

                date:
                    new Date().toISOString(),

                items:
                    issuedItems.map(
                        item => {

                            const product =
                                products.find(
                                    p =>
                                        Number(
                                            p.id
                                        ) ===
                                        Number(
                                            item.productId
                                        )
                                );


                            const quantity =
                                Number(
                                    item.qty
                                );


                            const returnedQuantity =
                                Number(
                                    item.ret
                                ) || 0;


                            const netQuantity =
                                Math.max(
                                    quantity -
                                    returnedQuantity,
                                    0
                                );


                            const price =
                                Number(
                                    item.price
                                );


                            return {

                                productId:
                                    Number(
                                        item.productId
                                    ),

                                productName:
                                    product?.name ||
                                    "",

                                quantity:
                                    quantity,

                                returnedQuantity:
                                    returnedQuantity,

                                returnQuantity:
                                    returnedQuantity,

                                price:
                                    price,

                                commissionApplicable:
                                    item.commissionApplicable,

                                amount:
                                    netQuantity *
                                    price

                            };

                        }
                    ),


                subtotal:
                    Number(
                        document.getElementById(
                            "subTotal"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                commission:
                    Number(
                        document.getElementById(
                            "commision"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                discount:
                    Number(
                        document.getElementById(
                            "Discount"
                        )?.value
                    ) || 0,


                netTotal:
                    Number(
                        document.getElementById(
                            "NetTotal"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                cash:
                    Number(
                        document.getElementById(
                            "Cash"
                        )?.value
                    ) || 0,


                currentBill:
                    Number(
                        document.getElementById(
                            "currentBill"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                arrears:
                    Number(
                        document.getElementById(
                            "Arrears"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                balance:
                    Number(
                        document.getElementById(
                            "balance"
                        )?.textContent
                            ?.replace(
                                /,/g,
                                ""
                            )
                    ) || 0,


                dynamicComission:
                    Number(
                        entercomission
                    )

            };


            console.log(
                "Invoice:",
                invoice
            );


            const createInvoiceButton =
                document.getElementById(
                    "createInvoiceBtn"
                );


            try {

                if (
                    createInvoiceButton
                ) {

                    createInvoiceButton.disabled =
                        true;

                }


                // =================================================
                // OFFLINE
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    await applyIssueLocally(
                        invoice
                    );


                    await addToSyncQueue({

                        endpoint:
                            "/invoices",

                        method:
                            "POST",

                        body:
                            invoice

                    });


                    alert(
                        "Sales invoice saved offline. Product stock, salesman balance, and invoice data were saved locally. It will synchronize when internet returns."
                    );


                    openPrintInvoiceModal(
                        invoice
                    );


                    issuedItems =
                        [];


                    renderIssueTable();


                    return;

                }


                // =================================================
                // ONLINE
                // =================================================

                const response =
                    await fetch(
                        `${API}/invoices`,
                        {

                            method:
                                "POST",

                            credentials:
                                "include",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    invoice
                                )

                        }
                    );


                // =================================================
                // SESSION EXPIRED
                // =================================================

                if (
                    response.status ===
                    401
                ) {

                    window.location.href =
                        "login.html";

                    return;

                }


                const result =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.message ||
                        "Failed to create invoice."
                    );

                }


                console.log(
                    "Invoice created:",
                    result
                );


                // =================================================
                // SAVE ONLINE-CREATED INVOICE TO INDEXEDDB
                // =================================================

                await saveToOfflineDB(
                    "invoices",
                    invoice
                );


                // =================================================
                // REFRESH PRODUCTS
                // =================================================

                await fetchProducts();


                // =================================================
                // REFRESH SALESMEN
                // =================================================

                await fetchSalesmen();


                alert(
                    result.message ||
                    "Invoice created successfully."
                );


                // =================================================
                // PRINT
                // =================================================

                openPrintInvoiceModal(
                    invoice
                );


                issuedItems =
                    [];


                renderIssueTable();


            } catch (error) {

                console.error(
                    "Invoice error:",
                    error
                );


                // =================================================
                // NETWORK FAILURE
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    try {

                        await applyIssueLocally(
                            invoice
                        );


                        await addToSyncQueue({

                            endpoint:
                                "/invoices",

                            method:
                                "POST",

                            body:
                                invoice

                        });


                        alert(
                            "Internet connection was lost. Sales invoice was saved offline and will synchronize when internet returns."
                        );


                        openPrintInvoiceModal(
                            invoice
                        );


                        issuedItems =
                            [];


                        renderIssueTable();


                    } catch (
                        offlineError
                    ) {

                        console.error(
                            "Offline invoice error:",
                            offlineError
                        );


                        alert(
                            "Failed to save invoice offline."
                        );

                    }

                } else {

                    alert(
                        error.message ||
                        "Failed to save invoice."
                    );

                }

            } finally {

                if (
                    createInvoiceButton
                ) {

                    createInvoiceButton.disabled =
                        false;

                }

            }

        }
    );


// ===========================================================
// PRINT A4 INVOICE
// ===========================================================

function printRealInvoice(
    invoice
) {

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
        new Date(
            invoice.date
        ).toLocaleDateString(
            "en-GB",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );


    const itemsRows =
        invoice.items
            .map(
                (
                    item,
                    index
                ) => {

                    const returned =
                        Number(
                            item.returnedQuantity ??
                            item.returnQuantity ??
                            0
                        );


                    const quantity =
                        Number(
                            item.quantity ||
                            0
                        );


                    const net =
                        quantity -
                        returned;


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
                                ${Number(
                                    item.price ||
                                    0
                                ).toLocaleString()}
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
                                ${Number(
                                    item.amount ||
                                    0
                                ).toLocaleString()}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    const totalQty =
        invoice.items.reduce(
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


    const totalReturn =
        invoice.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.returnedQuantity ??
                    item.returnQuantity ??
                    0
                ),
            0
        );


    const totalNet =
        totalQty -
        totalReturn;


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Invoice ${invoice.id}
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
    font-family: Arial, Helvetica, sans-serif;
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
    }

    .invoice {
        width: 100%;
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

            Head Office: New Ring Road Near Madni Colony Back side Zantara Town Peshawar

            <br>

            Tel # 091-2601784 &nbsp;&nbsp;
            Mobile # 0345-9101300 / 0317-1234570

            <br>

            Peshawar Pakistan

        </div>

        <div class="invoice-title">
            INVOICE
        </div>

    </div>


    <table class="info-table">

        <tr>

            <td class="info-label">
                Salesman
            </td>

            <td class="info-value">
                ${escapeHTML(
                    invoice.partyName ||
                    "-"
                )}
            </td>

            <td class="info-label">
                Inv No.
            </td>

            <td class="info-value">
                ${invoice.id}
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
                Salesman ID
            </td>

            <td class="info-value">
                ${invoice.partyId}
            </td>

        </tr>

    </table>


    <table class="items-table">

        <thead>

            <tr>

                <th>No.</th>
                <th>Type of Goods</th>
                <th>Price</th>
                <th>Sales</th>
                <th>Return</th>
                <th>Net S</th>
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
                    ${totalQty}
                </td>

                <td>
                    ${totalReturn}
                </td>

                <td>
                    ${totalNet}
                </td>

                <td>
                    ${Number(
                        invoice.subtotal ||
                        0
                    ).toLocaleString()}
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
                    ${Number(
                        invoice.subtotal ||
                        0
                    ).toLocaleString()}
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
                    ${Number(
                        invoice.commission ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Discount
                </td>

                <td>
                    ${Number(
                        invoice.discount ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Net Total
                </td>

                <td>
                    ${Number(
                        invoice.netTotal ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Cash
                </td>

                <td>
                    ${Number(
                        invoice.cash ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Current Bill
                </td>

                <td>
                    ${Number(
                        invoice.currentBill ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Arrears
                </td>

                <td>
                    ${Number(
                        invoice.arrears ||
                        0
                    ).toLocaleString()}
                </td>

            </tr>


            <tr class="balance-row">

                <td>
                    Balance
                </td>

                <td>
                    ${Number(
                        invoice.balance ||
                        0
                    ).toLocaleString()}
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


// ===========================================================
// THERMAL PRINT
// ===========================================================

function printThermalInvoice(
    invoice
) {

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=400,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow popups to print the invoice."
        );

        return;

    }


    const invoiceDate =
        new Date(
            invoice.date
        ).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const totalQty =
        invoice.items.reduce(
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


    const totalReturn =
        invoice.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.returnedQuantity ??
                    item.returnQuantity ??
                    0
                ),
            0
        );


    const totalNet =
        totalQty -
        totalReturn;


    const itemsRows =
        invoice.items
            .map(
                (
                    item,
                    index
                ) => {

                    const quantity =
                        Number(
                            item.quantity ||
                            0
                        );


                    const returned =
                        Number(
                            item.returnedQuantity ??
                            item.returnQuantity ??
                            0
                        );


                    return `

                        <tr>

                            <td class="no">
                                ${index + 1}
                            </td>

                            <td class="product">
                                ${escapeHTML(
                                    item.productName ||
                                    "-"
                                )}
                            </td>

                            <td class="qty">
                                ${quantity}
                            </td>

                            <td class="price">
                                ${Number(
                                    item.price ||
                                    0
                                ).toLocaleString()}
                            </td>

                            <td class="amount">
                                ${Number(
                                    item.amount ||
                                    0
                                ).toLocaleString()}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Thermal Invoice ${invoice.id}
</title>

<style>

@page {
    size: 80mm auto;
    margin: 0;
}

* {
    box-sizing: border-box;
}

html,
body {
    width: 80mm;
    margin: 0;
    padding: 0;
}

body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color:
        #000;

    background:
        #fff;

    font-size:
        11px;

    line-height:
        1.3;

}

.receipt {

    width:
        72mm;

    margin:
        0 auto;

    padding:
        4mm 0;

}

.header {

    text-align:
        center;

    margin-bottom:
        8px;

}

.company-name {

    font-size:
        18px;

    font-weight:
        bold;

    margin-bottom:
        3px;

}

.company-address {

    font-size:
        9px;

    line-height:
        1.3;

}

.invoice-title {

    font-size:
        14px;

    font-weight:
        bold;

    margin-top:
        7px;

    border-top:
        1px dashed #000;

    border-bottom:
        1px dashed #000;

    padding:
        4px 0;

}

.info {

    margin-top:
        7px;

    margin-bottom:
        7px;

    font-size:
        10px;

}

.info-row {

    display:
        flex;

    justify-content:
        space-between;

    margin-bottom:
        2px;

}

.info-label {

    font-weight:
        bold;

}

.items-table {

    width:
        100%;

    border-collapse:
        collapse;

    margin-top:
        5px;

}

.items-table th {

    border-top:
        1px dashed #000;

    border-bottom:
        1px dashed #000;

    padding:
        4px 1px;

    font-size:
        9px;

}

.items-table td {

    padding:
        4px 1px;

    vertical-align:
        top;

    font-size:
        9px;

}

.no {

    width:
        8%;

    text-align:
        left;

}

.product {

    width:
        36%;

    text-align:
        left;

    word-break:
        break-word;

}

.qty {

    width:
        12%;

    text-align:
        center;

}

.price {

    width:
        20%;

    text-align:
        right;

}

.amount {

    width:
        24%;

    text-align:
        right;

}

.subtotal {

    border-top:
        1px dashed #000;

    border-bottom:
        1px dashed #000;

    padding:
        5px 0;

    margin-top:
        3px;

}

.subtotal-row {

    display:
        flex;

    justify-content:
        space-between;

    margin-bottom:
        2px;

}

.totals {

    margin-top:
        7px;

}

.total-row {

    display:
        flex;

    justify-content:
        space-between;

    padding:
        2px 0;

}

.total-label {

    text-align:
        left;

}

.total-value {

    text-align:
        right;

}

.balance {

    border-top:
        1px solid #000;

    border-bottom:
        1px solid #000;

    font-size:
        13px;

    font-weight:
        bold;

    padding:
        5px 0;

    margin-top:
        3px;

}

.footer {

    text-align:
        center;

    margin-top:
        12px;

    border-top:
        1px dashed #000;

    padding-top:
        7px;

    font-size:
        9px;

}

.thank-you {

    font-weight:
        bold;

    font-size:
        11px;

    margin-bottom:
        3px;

}

@media print {

    body {

        width:
            80mm;

    }

    .receipt {

        width:
            72mm;

    }

}

</style>

</head>

<body>

<div class="receipt">

    <div class="header">

        <div class="company-name">
            AJWA ICE CREAM
        </div>

        <div class="company-address">

            Head Office: New Ring Road Near Madni Colony
            Back side Zantara Town Peshawar

            <br>

            Tel # 091-2601784

            <br>

            Mobile # 0345-9101300 / 0317-1234570

        </div>

        <div class="invoice-title">
            SALES INVOICE
        </div>

    </div>


    <div class="info">

        <div class="info-row">

            <span class="info-label">
                Invoice:
            </span>

            <span>
                ${invoice.id}
            </span>

        </div>


        <div class="info-row">

            <span class="info-label">
                Date:
            </span>

            <span>
                ${invoiceDate}
            </span>

        </div>


        <div class="info-row">

            <span class="info-label">
                Salesman:
            </span>

            <span>
                ${escapeHTML(
                    invoice.partyName ||
                    "-"
                )}
            </span>

        </div>


        <div class="info-row">

            <span class="info-label">
                Salesman ID:
            </span>

            <span>
                ${invoice.partyId}
            </span>

        </div>

    </div>


    <table class="items-table">

        <thead>

            <tr>

                <th class="no">
                    #
                </th>

                <th class="product">
                    Product
                </th>

                <th class="qty">
                    Qty
                </th>

                <th class="price">
                    Price
                </th>

                <th class="amount">
                    Amount
                </th>

            </tr>

        </thead>


        <tbody>

            ${itemsRows}

        </tbody>

    </table>


    <div class="subtotal">

        <div class="subtotal-row">

            <span>
                Sales Qty
            </span>

            <strong>
                ${totalQty}
            </strong>

        </div>


        <div class="subtotal-row">

            <span>
                Return
            </span>

            <strong>
                ${totalReturn}
            </strong>

        </div>


        <div class="subtotal-row">

            <span>
                Net Sales
            </span>

            <strong>
                ${totalNet}
            </strong>

        </div>

    </div>


    <div class="totals">

        <div class="total-row">

            <span class="total-label">
                Sub Total
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.subtotal ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Commission ${
                    Number(
                        invoice.dynamicComission ||
                        0
                    ) * 100
                }%
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.commission ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Discount
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.discount ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Net Total
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.netTotal ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Cash
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.cash ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Current Bill
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.currentBill ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Arrears
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.arrears ||
                    0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row balance">

            <span class="total-label">
                BALANCE
            </span>

            <span class="total-value">
                Rs.
                ${Number(
                    invoice.balance ||
                    0
                ).toLocaleString()}
            </span>

        </div>

    </div>


    <div class="footer">

        <div class="thank-you">
            Thank You
        </div>

        AJWA ICE CREAM

        <br>

        Please keep this bill for your record.

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


// ===========================================================
// PRINT MODAL
// ===========================================================

let invoiceWaitingForPrint =
    null;


function openPrintInvoiceModal(
    invoice
) {

    invoiceWaitingForPrint =
        invoice;


    const modal =
        document.getElementById(
            "printInvoiceModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closePrintInvoiceModal() {

    const modal =
        document.getElementById(
            "printInvoiceModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    invoiceWaitingForPrint =
        null;

}


// ===========================================================
// THERMAL PRINT BUTTON
// ===========================================================

document
    .getElementById(
        "printThermalBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                !invoiceWaitingForPrint
            ) {

                return;

            }


            const invoice =
                invoiceWaitingForPrint;


            closePrintInvoiceModal();


            printThermalInvoice(
                invoice
            );

        }
    );


// ===========================================================
// A4 PRINT BUTTON
// ===========================================================

document
    .getElementById(
        "printRealBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                !invoiceWaitingForPrint
            ) {

                return;

            }


            const invoice =
                invoiceWaitingForPrint;


            closePrintInvoiceModal();


            printRealInvoice(
                invoice
            );

        }
    );


// ===========================================================
// CLOSE PRINT MODAL
// ===========================================================

document
    .getElementById(
        "closePrintModal"
    )
    ?.addEventListener(
        "click",
        closePrintInvoiceModal
    );


document
    .getElementById(
        "cancelPrintBtn"
    )
    ?.addEventListener(
        "click",
        closePrintInvoiceModal
    );


// ===========================================================
// OUTSIDE PRINT MODAL
// ===========================================================

document
    .getElementById(
        "printInvoiceModal"
    )
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "printInvoiceModal"
            ) {

                closePrintInvoiceModal();

            }

        }
    );


// ===========================================================
// DISCOUNT / CASH
// ===========================================================

document
    .getElementById(
        "Discount"
    )
    ?.addEventListener(
        "input",
        updateSubtotal
    );


document
    .getElementById(
        "Cash"
    )
    ?.addEventListener(
        "input",
        updateSubtotal
    );


// ===========================================================
// DYNAMIC COMMISSION
// ===========================================================

document
    .getElementById(
        "dynamicCommission"
    )
    ?.addEventListener(
        "input",
        event => {

            entercomission =
                Number(
                    event.target.value
                ) / 100;


            updateSubtotal();

        }
    );


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
// SIDEBAR NAV
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
                            navItem =>
                                navItem.classList.remove(
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
// HELPER: SET TEXT
// ===========================================================

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


// ===========================================================
// HELPER: ESCAPE HTML
// ===========================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ??
        "";


    return div.innerHTML;

}


// ===========================================================
// ONLINE EVENT
//
// offline-db.js also has a global online listener.
// This page listener refreshes its own data after sync.
// ===========================================================

window.addEventListener(
    "online",
    async () => {

        console.log(
            "Internet restored on Issue Stock page."
        );


        try {

            await processSyncQueue();


            await fetchSalesmen();

            await fetchProducts();

            await syncInitialInvoices();


        } catch (error) {

            console.error(
                "Issue Stock online refresh failed:",
                error
            );

        }

    }
);


// ===========================================================
// INITIAL TABLE RENDER
// ===========================================================

renderIssueTable();