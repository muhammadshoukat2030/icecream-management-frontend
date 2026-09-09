// javascript
// ===========================================================
// Purchase Stocks Admin Page - Script
// Purchase stock is ADDED to inventory when invoice is created
// ===========================================================
const API= "https://icecream-management-backend.vercel.app";
// ================= DATA =================

let suppliers = [];
let currentSupplierId = null;
let products = [];
let purchasedItems = [];
let arrears;
let entercomission=0.2;
let adminUser;
getLocalStorageUser=()=>{
if (!localStorage.getItem('user')){
      window.location.href = 'login.html';
        return;

}

 adminUser=JSON.parse(localStorage.getItem('user'));
console.log(adminUser.email)

}

getLocalStorageUser();
document.getElementById('admin').textContent=adminUser.email;
// ===========================================================
// SUPPLIERS
// ===========================================================

async function fetchSuppliers() {

    try {

        const res = await fetch(
            `${API}/suppliers`,
            {
        credentials: 'include'
    }
        );
         if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        if (!res.ok) {
            throw new Error("Failed to load suppliers");
        }

        const data = await res.json();

        suppliers = (Array.isArray(data) ? data : []).map((s, index) => ({

            id: Number(s.id ?? s.supplier_id ?? index + 1),

            name:
                s.companyName ??
                s.supplier_name ??
                s.name ??
                "Unknown",

            status:
                s.status ??
                "Active",

            phone:
                s.phone ??
                s.contact ??
                "",

            address:
                s.address ??
                "",
            outstandingBalance:Number(s.outstandingBalance??0)

        }));


        renderSupplierDropdown();


        if (suppliers.length > 0) {

            setSupplier(suppliers[0].id);

        }

    }
    catch (error) {

        console.error(
            "Failed to load suppliers:",
            error
        );

    }

}


// ===========================================================
// PRODUCTS
// ===========================================================

async function fetchProducts() {

    try {

        const res = await fetch(
            `${API}/products`,
            {
        credentials: 'include'
    }
        );
             if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        if (!res.ok) {
            throw new Error("Failed to load products");
        }

        const data = await res.json();

        console.log("Products API:", data);


        products = (data.products || []).map((p, index) => ({

            id:
                Number(
                    p.id ??
                    p.product_id ??
                    index + 1
                ),

            name:
                p.name ??
                p.product_name ??
                "Unknown",

            size:
                p.size ??
                "",

            category:
                p.category ??
                "Other",

            price:
                Number(
                    p.purchasePrice ??
                    p.price ??
                    0
                ),

            // IMPORTANT:
            // Your backend uses "quantity"
            stock:
                Number(
                    p.qunatity ??
                    p.stock ??
                    0
                )

        }));


        renderProductGrid();

    }
    catch (error) {

        console.error(
            "Product loading failed:",
            error
        );

    }

}


fetchSuppliers();
fetchProducts();


// ===========================================================
// DATE
// ===========================================================

function updateDate() {

    const date = new Date();

    const datePill =
        document.getElementById("datePill");

    if (!datePill) return;

    datePill.textContent =
        date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}

updateDate();


// ===========================================================
// SUPPLIER DROPDOWN
// ===========================================================

function renderSupplierDropdown() {

    const dropdown =
        document.getElementById(
            "supplierDropdown"
        );

    if (!dropdown) return;

    dropdown.innerHTML = "";


    suppliers.forEach(supplier => {

        const option =
            document.createElement("div");

        option.className =
            "salesman-option";

        option.dataset.id =
            supplier.id;


        option.innerHTML = `

            <div class="supplier-logo">
                ${supplier.name.charAt(0)}
            </div>

            <div class="salesman-info">

                <p class="salesman-name-row">

                    <span>
                        ${supplier.name}
                    </span>

                    <span class="active-pill">
                        ${supplier.status}
                    </span>

                </p>

                <p class="salesman-sub">
                    ${supplier.phone} . ${supplier.address}
                </p>

            </div>

        `;


        dropdown.appendChild(option);

    });

}


function setSupplier(id) {

    const supplier =
        suppliers.find(
            s => Number(s.id) === Number(id)
        );
arrears = Number(supplier.outstandingBalance) || 0;
console.log(supplier.outstandingBalance)
    if (!supplier) return;


    currentSupplierId =
        Number(supplier.id);


    const logo =
        document.getElementById(
            "supplierLogo"
        );

    const name =
        document.getElementById(
            "supplierName"
        );

    const sub =
        document.getElementById(
            "supplierSub"
        );


    if (logo) {

        logo.textContent =
            supplier.name.charAt(0);

    }


    if (name) {

        name.textContent =
            supplier.name;

    }


    if (sub) {

        sub.textContent =
            `${supplier.phone} . ${supplier.address}`;

    }
updateSubtotal()
}


const supplierSelect =
    document.getElementById(
        "supplierSelect"
    );

const supplierDropdown =
    document.getElementById(
        "supplierDropdown"
    );


if (supplierSelect && supplierDropdown) {

    supplierSelect.addEventListener(
        "click",
        () => {

            supplierDropdown.classList.toggle(
                "show"
            );

        }
    );


    supplierDropdown.addEventListener(
        "click",
        event => {

            const option =
                event.target.closest(
                    ".salesman-option"
                );

            if (!option) return;


            setSupplier(
                Number(option.dataset.id)
            );


            supplierDropdown.classList.remove(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !supplierSelect.contains(
                    event.target
                )
            ) {

                supplierDropdown.classList.remove(
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
                stroke-linejoin="round"
            >

                <path
                    d="M22 26h20l-8 30a2 2 0 0 1-4 0l-8-30z"
                    fill="#f4dcb8"
                />

                <path
                    d="M20 26a12 8 0 0 1 24 0"
                    fill="#7a4a2b"
                />

                <circle
                    cx="26"
                    cy="17"
                    r="4"
                    fill="#e9c9a3"
                />

                <circle
                    cx="32"
                    cy="13"
                    r="4.5"
                    fill="#e9c9a3"
                />

                <circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="#e9c9a3"
                />

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

    if (!grid) return;


    const searchInput =
        document.getElementById(
            "productSearch"
        );

    const categoryInput =
        document.getElementById(
            "categoryFilter"
        );


    const search =
        (
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const category =
        categoryInput?.value ||
        "All Categories";


    grid.innerHTML = "";


    products.forEach(product => {

        if (
            search &&
            !product.name
                .toLowerCase()
                .includes(search) &&
            !String(product.id)
                .includes(search)
        ) {

            return;

        }


        if (
            category !== "All Categories" &&
            product.category !== category
        ) {

            return;

        }


        const card =
            document.createElement("div");

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
                        ${product.name}
                    </p>

                    <p>
                        ${product.size}
                    </p>

                </div>

            </div>


            <div class="product-meta">

                <span>
                    Price
                </span>

                <span>
                    Rs. ${product.price.toLocaleString()}
                </span>

            </div>


            <div class="product-meta">

                <span>
                    Stock
                </span>

                <span>
                    ${product.stock}
                </span>

            </div>


            <button
                class="product-add-btn"
                data-id="${product.id}"
            >
                + Add
            </button>

        `;


        grid.appendChild(card);

    });

}


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

            if (!button) return;


            addProductToPurchaseList(
                Number(button.dataset.id)
            );

        }
    );

}


document
    .getElementById("productSearch")
    ?.addEventListener(
        "input",
        renderProductGrid
    );


document
    .getElementById("categoryFilter")
    ?.addEventListener(
        "change",
        renderProductGrid
    );


// ===========================================================
// ADD PRODUCT
// ===========================================================

function addProductToPurchaseList(productId) {

    const product =
        products.find(
            p => p.id === productId
        );

    if (!product) return;


    // If product already exists,
    // increase its purchase quantity.
    const existing =
        purchasedItems.find(
            item =>
                item.productId === productId
        );


    if (existing) {

        existing.qty += 1;

    }
    else {

        purchasedItems.push({

            productId:
                product.id,

            price:
                product.price,

            qty:
                null,

            ret:
                0

        });

    }


    renderPurchaseTable();

}


// ===========================================================
// PURCHASE TABLE
// ===========================================================

function renderPurchaseTable() {

    const tbody =
        document.getElementById(
            "purchaseTableBody"
        );

    if (!tbody) return;


    tbody.innerHTML = "";


    purchasedItems.forEach(
        (item, index) => {

            const product =
                products.find(
                    p =>
                        p.id ===
                        item.productId
                );


            if (!product) return;


            const quantity =
                Number(item.qty) || 0;


            const returned =
                Number(item.ret) || 0;


            const net =
                Math.max(
                    quantity - returned,
                    0
                );


            const amount =
                net * item.price;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>
                    ${product.name}
                </td>


                <td>
                    ${item.price.toLocaleString()}
                </td>


                <td>

                    <input
                        type="number"
                        class="qty-input"
                        data-index="${index}"
                        value="${item.qty}"
                        >

                </td>


                <td>

                    <input
                        type="number"
                        class="return-input"
                        data-index="${index}"
                        value="${item.ret}"
                        min="0"
                    >

                </td>


                <td id="netSale-${index}">
                    ${net}
                </td>


                <td id="amount-${index}">
                    ${amount.toLocaleString()}
                </td>


                <td>

                    <button
                        class="delete-row-btn"
                        data-index="${index}"
                        title="Delete"
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
                                points="3 6 5 6 21 6"
                            ></polyline>

                            <path
                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                            ></path>

                            <line
                                x1="10"
                                y1="11"
                                x2="10"
                                y2="17"
                            ></line>

                            <line
                                x1="14"
                                y1="11"
                                x2="14"
                                y2="17"
                            ></line>

                        </svg>

                    </button>

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    updateSubtotal();

}


// ===========================================================
// TABLE INPUT
// ===========================================================

const purchaseTableBody =
    document.getElementById(
        "purchaseTableBody"
    );


if (purchaseTableBody) {

    purchaseTableBody.addEventListener(
        "input",
        event => {

            const index =
                Number(
                    event.target.dataset.index
                );


            if (isNaN(index)) return;


            const item =
                purchasedItems[index];


            if (!item) return;


            // =========================
            // PURCHASE QUANTITY
            // =========================

            if (
                event.target.classList.contains(
                    "qty-input"
                )
            ) {

                let quantity =
                    Number(
                        event.target.value
                    );


                if (
                    !Number.isFinite(quantity) ||
                    quantity < 1
                ) {

                    quantity = 1;

                }


                item.qty =
                    quantity;


                event.target.value =
                    quantity;

            }


            // =========================
            // RETURN QUANTITY
            // =========================

            if (
                event.target.classList.contains(
                    "return-input"
                )
            ) {

                let returned =
                    Number(
                        event.target.value
                    ) || 0;


                if (returned < 0) {

                    returned = 0;

                }


                if (
                    returned > item.qty
                ) {

                    alert(
                        "Return quantity cannot be greater than purchased quantity."
                    );


                    returned =
                        item.qty;

                }


                item.ret =
                    returned;


                event.target.value =
                    returned;

            }


            updateIssueRow(index);

        }
    );


    // =======================================================
    // DELETE ROW
    // =======================================================

    purchaseTableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".delete-row-btn"
                );


            if (!button) return;


            const index =
                Number(
                    button.dataset.index
                );


            if (isNaN(index)) return;


            purchasedItems.splice(
                index,
                1
            );


            renderPurchaseTable();

        }
    );

}


// ===========================================================
// UPDATE ROW
// ===========================================================

function updateIssueRow(index) {

    const item =
        purchasedItems[index];

    if (!item) return;


    const net =
        Math.max(
            Number(item.qty || 0) -
            Number(item.ret || 0),
            0
        );


    const amount =
        net * Number(item.price || 0);


    const netElement =
        document.getElementById(
            `netSale-${index}`
        );


    const amountElement =
        document.getElementById(
            `amount-${index}`
        );


    if (netElement) {

        netElement.textContent =
            net;

    }


    if (amountElement) {

        amountElement.textContent =
            amount.toLocaleString();

    }


    updateSubtotal();

}


// ===========================================================
// TOTALS
// ===========================================================

function updateSubtotal() {

    let quantity = 0;
    let returns = 0;
    let net = 0;
    let amount = 0;


    purchasedItems.forEach(item => {

        const qty =
            Number(item.qty) || 0;

        const ret =
            Number(item.ret) || 0;

        const itemNet =
            Math.max(
                qty - ret,
                0
            );


        quantity += qty;

        returns += ret;

        net += itemNet;

        amount +=
            itemNet *
            Number(item.price || 0);

    });


    const subtotalQty =
        document.getElementById(
            "subtotalQty"
        );

    const subtotalReturn =
        document.getElementById(
            "subtotalReturn"
        );

    const subtotalNet =
        document.getElementById(
            "subtotalNet"
        );

    const subtotalAmount =
        document.getElementById(
            "subtotalAmount"
        );


    if (subtotalQty)
        subtotalQty.textContent =
            quantity;


    if (subtotalReturn)
        subtotalReturn.textContent =
            returns;


    if (subtotalNet)
        subtotalNet.textContent =
            net;


    if (subtotalAmount)
        subtotalAmount.textContent =
            amount.toLocaleString();


    updateTotals(amount);

}


// ===========================================================
// TOTAL CALCULATION
// ===========================================================

function updateTotals(subTotal) {

    const commission = subTotal*entercomission;


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


   

 const arrearsValue = Number(arrears) || 0;

const balance = currentBill + arrearsValue;

    const elements = {

        subTotal:
            subTotal,

        commision:
            commission,

        NetTotal:
            netTotal,

        currentBill:
            currentBill,

        Arrears:
            arrearsValue,

        balance:
            balance

    };


    Object.entries(elements)
        .forEach(
            ([id, value]) => {

                const element =
                    document.getElementById(
                        id
                    );

                if (!element) return;


                element.textContent =
                    Number(value)
                        .toLocaleString();

            }
        );

}

// javascript
// ===========================================================
// PURCHASE INVOICE PRINTING
// ===========================================================

let invoiceWaitingForPrint = null;


// ===========================================================
// PRINT PURCHASE A4 INVOICE
// ===========================================================

function printPurchaseRealInvoice(invoice) {

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
        new Date(invoice.date).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const itemsRows =
        invoice.items.map(
            (item, index) => {

                const quantity =
                    Number(item.quantity) || 0;

                const returned =
                    Number(item.returnedQuantity) || 0;

                const net =
                    Math.max(
                        quantity - returned,
                        0
                    );


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${item.productName}
                        </td>

                        <td>
                            ${Number(item.price).toLocaleString()}
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
                            ${Number(item.amount).toLocaleString()}
                        </td>

                    </tr>
                `;

            }
        ).join("");


    const totalQuantity =
        invoice.items.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    const totalReturn =
        invoice.items.reduce(
            (total, item) =>
                total +
                Number(item.returnedQuantity || 0),
            0
        );


    const totalNet =
        invoice.items.reduce(
            (total, item) =>
                total +
                Math.max(
                    Number(item.quantity || 0) -
                    Number(item.returnedQuantity || 0),
                    0
                ),
            0
        );


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Purchase Invoice ${invoice.id}</title>

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


/* ================= HEADER ================= */

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


/* ================= SUPPLIER INFO ================= */

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


/* ================= ITEMS ================= */

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


/* ================= SUBTOTAL ================= */

.subtotal-row td {

    font-weight: bold;

}


/* ================= TOTALS ================= */

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


/* ================= SIGNATURES ================= */

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


/* ================= PRINT ================= */

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


    <!-- HEADER -->

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

            Mobile # 0345-9101300 / 0317-1234570

            <br>

            Peshawar Pakistan

        </div>

        <div class="invoice-title">
            PURCHASE INVOICE
        </div>

    </div>


    <!-- SUPPLIER INFORMATION -->

    <table class="info-table">

        <tr>

            <td class="info-label">
                Supplier
            </td>

            <td class="info-value">
                ${invoice.partyName}
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
                Supplier ID
            </td>

            <td class="info-value">
                ${invoice.partyId}
            </td>

        </tr>

    </table>


    <!-- ITEMS -->

    <table class="items-table">

        <thead>

            <tr>

                <th>
                    No.
                </th>

                <th>
                    Type of Goods
                </th>

                <th>
                    Price
                </th>

                <th>
                    Purchase
                </th>

                <th>
                    Return
                </th>

                <th>
                    Net
                </th>

                <th>
                    Amount
                </th>

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
                    ${totalReturn}
                </td>

                <td>
                    ${totalNet}
                </td>

                <td>
                    ${Number(invoice.subtotal).toLocaleString()}
                </td>

            </tr>

        </tbody>

    </table>


    <!-- TOTALS -->

    <div class="totals-container">

        <table class="totals-table">


            <tr>

                <td>
                    Sub Total
                </td>

                <td>
                    ${Number(invoice.subtotal).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Commission 20%
                </td>

                <td>
                    ${Number(invoice.commission).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Discount
                </td>

                <td>
                    ${Number(invoice.discount).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Net Total
                </td>

                <td>
                    ${Number(invoice.netTotal).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Cash
                </td>

                <td>
                    ${Number(invoice.cash).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Current Bill
                </td>

                <td>
                    ${Number(invoice.currentBill).toLocaleString()}
                </td>

            </tr>


            <tr>

                <td>
                    Arrears
                </td>

                <td>
                    ${Number(invoice.arrears).toLocaleString()}
                </td>

            </tr>


            <tr class="balance-row">

                <td>
                    Balance
                </td>

                <td>
                    ${Number(invoice.balance).toLocaleString()}
                </td>

            </tr>


        </table>

    </div>


    <!-- SIGNATURES -->

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
// PRINT PURCHASE THERMAL INVOICE
// ===========================================================

function printPurchaseThermalInvoice(invoice) {

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
        new Date(invoice.date).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const totalQty =
        invoice.items.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    const totalReturn =
        invoice.items.reduce(
            (total, item) =>
                total +
                Number(item.returnedQuantity || 0),
            0
        );


    const totalNet =
        invoice.items.reduce(
            (total, item) =>
                total +
                Math.max(
                    Number(item.quantity || 0) -
                    Number(item.returnedQuantity || 0),
                    0
                ),
            0
        );


    const itemsRows =
        invoice.items.map(
            (item, index) => {

                const quantity =
                    Number(item.quantity || 0);

                const returned =
                    Number(item.returnedQuantity || 0);

                const net =
                    Math.max(
                        quantity - returned,
                        0
                    );


                return `

                    <tr>

                        <td class="no">
                            ${index + 1}
                        </td>

                        <td class="product">
                            ${item.productName}
                        </td>

                        <td class="qty">
                            ${quantity}
                        </td>

                        <td class="price">
                            ${Number(item.price).toLocaleString()}
                        </td>

                        <td class="amount">
                            ${Number(item.amount).toLocaleString()}
                        </td>

                    </tr>

                `;

            }
        ).join("");


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Purchase Invoice ${invoice.id}
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

    color: #000;

    background: #fff;

    font-size: 11px;

    line-height: 1.3;

}

.receipt {

    width: 72mm;

    margin: 0 auto;

    padding: 4mm 0;

}


/* HEADER */

.header {

    text-align: center;

    margin-bottom: 8px;

}

.company-name {

    font-size: 18px;

    font-weight: bold;

    margin-bottom: 3px;

}

.company-address {

    font-size: 9px;

    line-height: 1.3;

}

.invoice-title {

    font-size: 14px;

    font-weight: bold;

    margin-top: 7px;

    border-top: 1px dashed #000;

    border-bottom: 1px dashed #000;

    padding: 4px 0;

}


/* INFO */

.info {

    margin-top: 7px;

    margin-bottom: 7px;

    font-size: 10px;

}

.info-row {

    display: flex;

    justify-content: space-between;

    margin-bottom: 2px;

}

.info-label {

    font-weight: bold;

}


/* ITEMS */

.items-table {

    width: 100%;

    border-collapse: collapse;

    margin-top: 5px;

}

.items-table th {

    border-top: 1px dashed #000;

    border-bottom: 1px dashed #000;

    padding: 4px 1px;

    font-size: 9px;

}

.items-table td {

    padding: 4px 1px;

    vertical-align: top;

    font-size: 9px;

}

.no {

    width: 8%;

    text-align: left;

}

.product {

    width: 36%;

    text-align: left;

    word-break: break-word;

}

.qty {

    width: 12%;

    text-align: center;

}

.price {

    width: 20%;

    text-align: right;

}

.amount {

    width: 24%;

    text-align: right;

}


/* SUBTOTAL */

.subtotal {

    border-top: 1px dashed #000;

    border-bottom: 1px dashed #000;

    padding: 5px 0;

    margin-top: 3px;

}

.subtotal-row {

    display: flex;

    justify-content: space-between;

    margin-bottom: 2px;

}


/* TOTALS */

.totals {

    margin-top: 7px;

}

.total-row {

    display: flex;

    justify-content: space-between;

    padding: 2px 0;

}

.total-label {

    text-align: left;

}

.total-value {

    text-align: right;

}

.balance {

    border-top: 1px solid #000;

    border-bottom: 1px solid #000;

    font-size: 13px;

    font-weight: bold;

    padding: 5px 0;

    margin-top: 3px;

}


/* FOOTER */

.footer {

    text-align: center;

    margin-top: 12px;

    border-top: 1px dashed #000;

    padding-top: 7px;

    font-size: 9px;

}

.thank-you {

    font-weight: bold;

    font-size: 11px;

    margin-bottom: 3px;

}


@media print {

    body {

        width: 80mm;

    }

    .receipt {

        width: 72mm;

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
            PURCHASE INVOICE
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
                Supplier:
            </span>

            <span>
                ${invoice.partyName}
            </span>

        </div>


        <div class="info-row">

            <span class="info-label">
                Supplier ID:
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
                Purchase Qty
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
                Net Purchase
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
                Rs. ${Number(invoice.subtotal).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Commission 20%
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.commission).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Discount
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.discount).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Net Total
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.netTotal).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Cash
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.cash).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Current Bill
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.currentBill).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Arrears
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.arrears).toLocaleString()}
            </span>

        </div>


        <div class="total-row balance">

            <span class="total-label">
                BALANCE
            </span>

            <span class="total-value">
                Rs. ${Number(invoice.balance).toLocaleString()}
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
// PRINT SELECTION MODAL
// ===========================================================

function openPurchasePrintInvoiceModal(invoice) {

    invoiceWaitingForPrint = invoice;

    const modal =
        document.getElementById(
            "printInvoiceModal"
        );

    if (modal) {

        modal.classList.add("show");

    }

}


function closePurchasePrintInvoiceModal() {

    const modal =
        document.getElementById(
            "printInvoiceModal"
        );

    if (modal) {

        modal.classList.remove("show");

    }

    invoiceWaitingForPrint = null;

}


// ===========================================================
// THERMAL PRINT BUTTON
// ===========================================================

document
    .getElementById("printThermalBtn")
    ?.addEventListener(
        "click",
        () => {

            if (!invoiceWaitingForPrint)
                return;


            const invoice =
                invoiceWaitingForPrint;


            closePurchasePrintInvoiceModal();


            printPurchaseThermalInvoice(
                invoice
            );

        }
    );


// ===========================================================
// A4 / REAL PRINT BUTTON
// ===========================================================

document
    .getElementById("printRealBtn")
    ?.addEventListener(
        "click",
        () => {

            if (!invoiceWaitingForPrint)
                return;


            const invoice =
                invoiceWaitingForPrint;


            closePurchasePrintInvoiceModal();


            printPurchaseRealInvoice(
                invoice
            );

        }
    );


// ===========================================================
// CLOSE PRINT MODAL
// ===========================================================

document
    .getElementById("closePrintModal")
    ?.addEventListener(
        "click",
        closePurchasePrintInvoiceModal
    );


document
    .getElementById("cancelPrintBtn")
    ?.addEventListener(
        "click",
        closePurchasePrintInvoiceModal
    );


// ===========================================================
// CLICK OUTSIDE MODAL
// ===========================================================

document
    .getElementById("printInvoiceModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "printInvoiceModal"
            ) {

                closePurchasePrintInvoiceModal();

            }

        }
    );


// ===========================================================
// CREATE PURCHASE INVOICE
// ===========================================================

const createInvoiceBtn =
    document.getElementById(
        "createInvoiceBtn"
    );


if (createInvoiceBtn) {

    createInvoiceBtn.addEventListener(
        "click",
        async () => {

            if (
                purchasedItems.length === 0
            ) {

                alert(
                    "Please add products first."
                );

                return;

            }


            if (!currentSupplierId) {

                alert(
                    "Please select a supplier."
                );

                return;

            }


            // Validate quantities
            for (
                const item
                of purchasedItems
            ) {

                const qty =
                    Number(item.qty) || 0;

                const ret =
                    Number(item.ret) || 0;


                if (qty < 1) {

                    alert(
                        "Purchase quantity must be at least 1."
                    );

                    return;

                }


                if (ret < 0) {

                    alert(
                        "Return quantity cannot be negative."
                    );

                    return;

                }


                if (ret > qty) {

                    alert(
                        "Return quantity cannot be greater than purchased quantity."
                    );

                    return;

                }

            }


            const invoice = {

                id:
                    Date.now(),

                type:
                    "supplier",

                partyId:
                    currentSupplierId,

                partyName:
                    document.getElementById(
                        "supplierName"
                    )?.textContent || "",

                date:
                    new Date(),

                items:
                    purchasedItems.map(
                        item => {

                            const product =
                                products.find(
                                    p =>
                                        p.id ===
                                        item.productId
                                );


                            return {

                                productId:
                                    item.productId,

                                productName:
                                    product?.name || "",

                                quantity:
                                    Number(
                                        item.qty
                                    ),

                                returnedQuantity:
                                    Number(
                                        item.ret
                                    ) || 0,

                                price:
                                    Number(
                                        item.price
                                    ),

                                amount:
                                    (
                                        Number(item.qty) -
                                        Number(item.ret || 0)
                                    ) *
                                    Number(item.price)

                            };

                        }
                    ),


                subtotal:
                    Number(
                        document.getElementById(
                            "subTotal"
                        )?.textContent
                            .replace(/,/g, "")
                    ) || 0,


                commission:
                    Number(
                        document.getElementById(
                            "commision"
                        )?.textContent
                            .replace(/,/g, "")
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
                            .replace(/,/g, "")
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
                            .replace(/,/g, "")
                    ) || 0,


                arrears:
                    Number(
                        document.getElementById(
                            "Arrears"
                        )?.textContent
                            .replace(/,/g, "")
                    ) || 0,


                balance:
                    Number(
                        document.getElementById(
                            "balance"
                        )?.textContent
                            .replace(/,/g, "")
                    ) || 0,
                    dynamicComission:entercomission

            };


            console.log(
                "Purchase Invoice:",
                invoice
            );


            try {

                createInvoiceBtn.disabled =
                    true;


                const res =
                    await fetch(
                        `${API}/invoices`,
                   
                        {

                            method:
                                "POST",
                            credentials: "include",
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

                     if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
                const result =
                    await res.json();


                if (!res.ok) {

                    throw new Error(
                        result.message ||
                        "Invoice creation failed"
                    );

                }


           
alert(
    "Purchase invoice created successfully. Stock has been increased."
);

console.log(
    "Server response:",
    result
);


// =========================================
// SHOW PRINT OPTIONS
// =========================================

openPurchasePrintInvoiceModal(invoice);


// =========================================
// DO NOT RELOAD HERE
// =========================================
//
// The invoice has already been saved
// and stock has already been updated
// by the backend.
//
// The user can now choose:
// Thermal Bill OR A4 Invoice.
//
// =========================================



            }
            catch (error) {

                console.error(
                    "Invoice Error:",
                    error
                );


                alert(
                    error.message ||
                    "Failed to create purchase invoice."
                );

            }
            finally {

                createInvoiceBtn.disabled =
                    false;

            }

        }
    );

}


// ===========================================================
// DISCOUNT / CASH
// ===========================================================

document
    .getElementById("Discount")
    ?.addEventListener(
        "input",
        updateSubtotal
    );


document
    .getElementById("Cash")
    ?.addEventListener(
        "input",
        updateSubtotal
    );


// ===========================================================
// INITIAL RENDER
// ===========================================================

renderPurchaseTable();


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

    if (sidebar)
        sidebar.classList.add(
            "open"
        );

    if (overlay)
        overlay.classList.add(
            "show"
        );

}


function closeSidebar() {

    if (sidebar)
        sidebar.classList.remove(
            "open"
        );

    if (overlay)
        overlay.classList.remove(
            "show"
        );

}


if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
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

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


// ===========================================================
// SIDEBAR LINKS
// ===========================================================

document
    .querySelectorAll(
        ".navlink"
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".navlink"
                        )
                        .forEach(
                            l =>
                                l.classList.remove(
                                    "active"
                                )
                        );


                    link.classList.add(
                        "active"
                    );


                    closeSidebar();

                }
            );

        }
    );

    document.getElementById('dynamicCommission').addEventListener('input',(e)=>{
        entercomission= Number(document.getElementById("dynamicCommission").value/100)
    console.log('dynamicCommision:',entercomission)
    updateSubtotal();

    })