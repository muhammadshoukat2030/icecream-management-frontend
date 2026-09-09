// ===========================================================
//  Issue Stocks Admin Page - Script
// ===========================================================
const API= "https://ice-cream-management.vercel.app";
// ---- Data ----
let salesmen = [];
let currentSalesmanId = null;
let arrears;
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
const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

console.log(today);
document.getElementById('datePill').textContent=today
async function fetchSalesmen() {

    try {

        const res = await fetch(
            `${API}/Allsalesmen`,
            {
        credentials: 'include'
    }
        );
         if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        const data = await res.json();

        console.log("Updated salesmen:", data);

        const list =
            Array.isArray(data)
                ? data
                : data.data || data.salesmen || [];


        salesmen = list.map((s, index) => ({

            id: s.id ?? s.salesman_id ?? index + 1,

            name: s.name ?? s.salesman_name ?? "Unknown",

            status: s.status ?? "Active",

            phone: s.phone ?? "",

            route: s.route ?? "",

            outstandingBalance:
                Number(s.outstandingBalance) || 0

        }));


        renderSalesmanDropdown();


        // Keep currently selected salesman
        if (currentSalesmanId !== null) {

            const currentSalesman =
                salesmen.find(
                    s => s.id === currentSalesmanId
                );

            if (currentSalesman) {

                setSalesman(currentSalesmanId);

            }
            else if (salesmen.length > 0) {

                setSalesman(salesmen[0].id);

            }

        }
        else if (salesmen.length > 0) {

            setSalesman(salesmen[0].id);

        }

    }
    catch (err) {

        console.error(
            "Failed to refresh salesmen:",
            err
        );

    }

}

fetchSalesmen();



let products = [];

async function fetchProducts() {

    try {

        const res = await fetch(`${API}/products`,
            {
        credentials: 'include'
    }
                );
         if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        const data = await res.json();
        console.log(data)
        products = data.products.map((p, index) => ({

            id: p.id ?? p.product_id ?? index + 1,

            name: p.name,

            size: p.size,

            category: p.category,

            price: Number(p.salePrice),

            stock: Number(p.qunatity),
            commissionApplicable:p.commissionApplicable

        }));

        renderProductGrid();
console.log(products)
    }
    catch (err) {

        console.error(err);

    }

}

fetchProducts();

// row.qty = Sales(Quantity), row.ret = Return (fixed per row here)
let issuedItems = [];

// ---- Salesman selector ----
function renderSalesmanDropdown() {
  const dd = document.getElementById("salesmanDropdown");
  dd.innerHTML = "";
  salesmen.forEach((s) => {
    const opt = document.createElement("div");
    opt.className = "salesman-option";
    opt.dataset.id = s.id;
    opt.innerHTML = `
      <div class="salesman-avatar">${s.name.charAt(0)}</div>
      <div class="salesman-info">
        <p class="salesman-name-row"><span>${s.name}</span><span class="active-pill">${s.status}</span></p>
        <p class="salesman-sub">${s.phone} . ${s.route}</p>
      </div>
    `;
    dd.appendChild(opt);
  });
}

function setSalesman(id) {
  const s = salesmen.find((x) => x.id === id);
  if (!s) return;
  currentSalesmanId = id;
  document.getElementById("salesmanAvatar").textContent = s.name.charAt(0);
  document.getElementById("salesmanName").textContent = s.name;
  document.getElementById("salesmanSub").textContent = `${s.phone} . ${s.route}`;
arrears = Number(s.outstandingBalance) || 0;
 updateSubtotal();
}

const salesmanSelect = document.getElementById("salesmanSelect");
const salesmanDropdown = document.getElementById("salesmanDropdown");

salesmanSelect.addEventListener("click", (e) => {
  salesmanDropdown.classList.toggle("show");
});

salesmanDropdown.addEventListener("click", (e) => {
  const opt = e.target.closest(".salesman-option");
  if (!opt) return;
  setSalesman(Number(opt.dataset.id));
  salesmanDropdown.classList.remove("show");
});

document.addEventListener("click", (e) => {
  if (!salesmanSelect.contains(e.target)) {
    salesmanDropdown.classList.remove("show");
  }
});

renderSalesmanDropdown();
setSalesman(currentSalesmanId);

// ---- Product cards ----
function iceCreamThumbSvg() {
  return `<svg viewBox="0 0 64 64"><g fill="none" stroke="#7a5230" stroke-width="2" stroke-linejoin="round">
    <path d="M22 26h20l-8 30a2 2 0 0 1-4 0l-8-30z" fill="#f4dcb8"/>
    <path d="M20 26a12 8 0 0 1 24 0" fill="#7a4a2b" stroke="#5c3820"/>
    <circle cx="26" cy="17" r="4" fill="#e9c9a3" stroke="#5c3820"/>
    <circle cx="32" cy="13" r="4.5" fill="#e9c9a3" stroke="#5c3820"/>
    <circle cx="38" cy="17" r="4" fill="#e9c9a3" stroke="#5c3820"/>
  </g></svg>`;
}

function renderProductGrid() {
  const grid = document.getElementById("productGrid");
  const query = (document.getElementById("productSearch").value || "").trim().toLowerCase();
  const cat = document.getElementById("categoryFilter").value;
  grid.innerHTML = "";

  products.forEach((p) => {
    if (query && !p.name.toLowerCase().includes(query) && !String(p.id).includes(query)) return;
    if (cat !== "All Categories" && p.category !== cat) return;

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-thumb-wrap">
        <div class="product-thumb">${iceCreamThumbSvg()}<span class="live-dot"></span></div>
        <div class="product-title">
          <p>${p.name}</p>
        </div>
      </div>
      <div class="product-meta"><span>Price</span><span>Rs. ${p.price}</span></div>
      <div class="product-meta"><span>Stock(Quantity)</span><span>${p.stock}</span></div>
      <button 
    class="product-add-btn"
    data-id="${p.id}"
    ${p.stock <= 0 ? "disabled" : ""}
>
    ${p.stock <= 0 ? "Out of Stock" : "+ Add"}
</button>
    `;
    grid.appendChild(card);
  });
}

document.getElementById("productGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".product-add-btn");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  addProductToIssueList(id);
});

document.getElementById("productSearch").addEventListener("input", renderProductGrid);
document.getElementById("categoryFilter").addEventListener("change", renderProductGrid);

renderProductGrid();

// ---- Issue table ----
function addProductToIssueList(productId) {

    const product = products.find(
        p => p.id === productId
    );

    if (!product) return;


    // =========================================
    // PREVENT DUPLICATE PRODUCT ROW
    // =========================================

    const alreadyAdded = issuedItems.some(
        item => item.productId === productId
    );


    if (alreadyAdded) {

        alert(
            `${product.name} is already added to the invoice.`
        );

        return;
    }


    // =========================================
    // ADD PRODUCT
    // =========================================

    issuedItems.push({

        productId: product.id,

        price: product.price,

        qty: "",

        ret: "",

        commissionApplicable:product.commissionApplicable

    });


    renderIssueTable();

}

function renderIssueTable(){

const tbody =
document.getElementById("issueTableBody");


tbody.innerHTML="";


issuedItems.forEach((item,index)=>{


const product =
products.find(
p=>p.id===item.productId
);


const qty = Number(item.qty) || 0;
const ret = Number(item.ret) || 0;

const net = Math.max(qty - ret, 0);

const amount =
net * item.price;



const row =
document.createElement("tr");


row.innerHTML = `

<td>${index + 1}</td>

<td>
    ${product.name}
</td>

<td>
    ${item.price}
</td>
<td
    class="available-stock ${getStockClass(product.stock - qty)}"
    id="available-stock-${index}"
>
    ${Math.max(product.stock - qty, 0)}
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
        min="0">

</td>

<td id="net-${index}">
    ${net}
</td>

<td id="amount-${index}">
    ${amount.toLocaleString()}
</td>

<td>

    <button
        type="button"
        class="delete-issue-row-btn"
        data-index="${index}"
        title="Remove product">

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <polyline points="3 6 5 6 21 6"></polyline>

            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>

            <line x1="10" y1="11" x2="10" y2="17"></line>

            <line x1="14" y1="11" x2="14" y2="17"></line>

        </svg>

    </button>

</td>

`;


tbody.appendChild(row);


});


updateSubtotal();

}

function getStockClass(stock) {

    if (stock <= 10) {
        return "stock-critical";
    }

    if (stock <= 30) {
        return "stock-low";
    }

    return "stock-good";
}

document
.getElementById("issueTableBody")
.addEventListener(
"input",
(e)=>{


const index =
Number(e.target.dataset.index);


if(isNaN(index))
return;


const item =
issuedItems[index];



if (e.target.classList.contains("qty-input")) {

    const product = products.find(
        p => p.id === item.productId
    );

    if (!product) return;

    const value = e.target.value;

    // Allow the user to completely clear the input
    if (value === "") {
        item.qty = "";
        updateIssueRow(index);
        return;
    }

    let qty = Number(value);

    // Invalid number
    if (isNaN(qty)) {
        item.qty = "";
        updateIssueRow(index);
        return;
    }

    // Quantity cannot exceed available stock
    if (qty > product.stock) {

        alert(
            `Only ${product.stock} units are available for ${product.name}.`
        );

        qty = product.stock;
        e.target.value = qty;
    }

    // Quantity must be at least 1 when entered
    if (qty < 1) {
        qty = 1;
        e.target.value = qty;
    }

    item.qty = qty;

    updateIssueRow(index);
     getStockClass(value)
     
}

// =========================
// RETURN QUANTITY
// =========================

if (e.target.classList.contains("return-input")) {

    let ret = Number(e.target.value) || 0;

    // Return cannot be negative
    if (ret < 0) {
        ret = 0;
    }

    // Return cannot be greater than issued quantity
    if (ret > item.qty) {

        alert(
            "Return quantity cannot be greater than issued quantity."
        );

        ret = item.qty;
    }

    item.ret = ret;

    e.target.value = ret;
}



updateIssueRow(index);


});

document.getElementById("issueTableBody").addEventListener("click", (e) => {
  const stepPart = e.target.closest("[data-dir]");
  if (!stepPart) return;
  const stepper = stepPart.closest(".qty-stepper");
  const idx = Number(stepper.dataset.idx);
  const item = issuedItems[idx];
  if (!item) return;

  if (stepPart.dataset.dir === "up") {
    item.qty += 1;
  } else {
    item.qty = Math.max(item.qty - 1, 0);
  }
  renderIssueTable();
});

function updateSubtotal() {

    let qty = 0;
    let returns = 0;
    let net = 0;
    let amount = 0;

    let nonCommissionableAmount = 0;

    issuedItems.forEach(item => {

        const sales = Math.max(
            Number(item.qty || 0) - Number(item.ret || 0),
            0
        );

        qty += Number(item.qty || 0);
        returns += Number(item.ret || 0);
        net += sales;

        const itemAmount = sales * Number(item.price || 0);

        amount += itemAmount;

        // Products with commissionApplicable = "no"
        if (item.commissionApplicable === "no") {
            nonCommissionableAmount += itemAmount;
        }

    });

    document.getElementById("subtotalQty").textContent = qty;
    document.getElementById("subtotalReturn").textContent = returns;
    document.getElementById("subtotalNet").textContent = net;
    document.getElementById("subtotalAmount").textContent =
        amount.toLocaleString();

    console.log("Subtotal:", amount);
    console.log("Non commissionable:", nonCommissionableAmount);

    // 20% commission only on commissionable products
    const commissionableAmount =
        Math.max(amount - nonCommissionableAmount, 0);

    const commission =
        commissionableAmount * 0.20;

    console.log("Commission:", commission);

    updateTotals(amount, commission);
}
function updateTotals(subTotal, commission) {

    const discount =
        Number(document.getElementById("Discount").value) || 0;

    const cash =
        Number(document.getElementById("Cash").value) || 0;

    const netTotal =
        subTotal - commission - discount;

    const currentBill =
        netTotal - cash;

    const arrearsValue =
        Number(arrears) || 0;

    const balance =
        currentBill + arrearsValue;

    document.getElementById("subTotal").textContent =
        subTotal.toLocaleString();

    document.getElementById("commision").textContent =
        commission.toLocaleString();

    document.getElementById("NetTotal").textContent =
        netTotal.toLocaleString();

    document.getElementById("currentBill").textContent =
        currentBill.toLocaleString();

    document.getElementById("Arrears").textContent =
        arrearsValue.toLocaleString();

    document.getElementById("balance").textContent =
        balance.toLocaleString();
}
function printRealInvoice(invoice) {

    const printWindow = window.open("", "_blank", "width=900,height=1000");

    if (!printWindow) {
        alert("Please allow popups to print the invoice.");
        return;
    }

    const invoiceDate = new Date(invoice.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const itemsRows = invoice.items.map((item, index) => {

        const net = item.quantity - (item.returnedQuantity || 0);

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td>${Number(item.price).toLocaleString()}</td>
                <td>${item.quantity}</td>
                <td>${item.returnedQuantity || 0}</td>
                <td>${net}</td>
                <td>${Number(item.amount).toLocaleString()}</td>
            </tr>
        `;

    }).join("");


    printWindow.document.write(`

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<title>Invoice ${invoice.id}</title>

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

/* ================= CUSTOMER INFO ================= */

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

    <!-- ================= HEADER ================= -->

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


    <!-- ================= SALESMAN INFO ================= -->

    <table class="info-table">

        <tr>

            <td class="info-label">
                Salesman
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
                Salesman ID
            </td>

            <td class="info-value">
                ${invoice.partyId}
            </td>

        </tr>

    </table>


    <!-- ================= ITEMS ================= -->

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
                    ${invoice.items.reduce(
                        (total, item) => total + Number(item.quantity || 0),
                        0
                    )}
                </td>

                <td>
                    ${invoice.items.reduce(
                        (total, item) => total + Number(item.returnedQuantity || 0),
                        0
                    )}
                </td>

                <td>
                    ${invoice.items.reduce(
                        (total, item) =>
                            total +
                            Number(item.quantity || 0) -
                            Number(item.returnedQuantity || 0),
                        0
                    )}
                </td>

                <td>
                    ${Number(invoice.subtotal).toLocaleString()}
                </td>

            </tr>

        </tbody>

    </table>


    <!-- ================= TOTALS ================= -->

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


    <!-- ================= SIGNATURES ================= -->

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

function printThermalInvoice(invoice) {

    const printWindow = window.open(
        "",
        "_blank",
        "width=400,height=800"
    );

    if (!printWindow) {
        alert("Please allow popups to print the invoice.");
        return;
    }

    const invoiceDate = new Date(invoice.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const totalQty = invoice.items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const totalReturn = invoice.items.reduce(
        (total, item) => total + Number(item.returnedQuantity || 0),
        0
    );

    const totalNet = invoice.items.reduce(
        (total, item) =>
            total +
            Number(item.quantity || 0) -
            Number(item.returnedQuantity || 0),
        0
    );

    const itemsRows = invoice.items.map((item, index) => {

        const quantity =
            Number(item.quantity || 0);

        const returned =
            Number(item.returnedQuantity || 0);

        const net =
            Math.max(quantity - returned, 0);

        return `
            <tr>
                <td class="no">${index + 1}</td>

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

    }).join("");


    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Thermal Invoice ${invoice.id}</title>

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


/* ================= HEADER ================= */

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


/* ================= INFO ================= */

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


/* ================= ITEMS ================= */

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


/* ================= SUBTOTAL ================= */

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


/* ================= TOTALS ================= */

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


/* ================= FOOTER ================= */

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


/* ================= PRINT ================= */

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

            <br>

            Mobile # 0345-9101300 / 0317-1234570

        </div>

        <div class="invoice-title">
            SALES INVOICE
        </div>

    </div>


    <!-- SALESMAN INFO -->

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
                ${invoice.partyName}
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


    <!-- ITEMS -->

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


    <!-- SUBTOTAL -->

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


    <!-- TOTALS -->

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


    <!-- FOOTER -->

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

// =========================================
// PRINT INVOICE MODAL
// =========================================

let invoiceWaitingForPrint = null;


function openPrintInvoiceModal(invoice) {

    invoiceWaitingForPrint = invoice;

    const modal =
        document.getElementById("printInvoiceModal");

    modal.classList.add("show");

}


function closePrintInvoiceModal() {

    const modal =
        document.getElementById("printInvoiceModal");

    modal.classList.remove("show");

    invoiceWaitingForPrint = null;

}


// Thermal button
document
    .getElementById("printThermalBtn")
    .addEventListener("click", () => {

        if (!invoiceWaitingForPrint) return;

        const invoice =
            invoiceWaitingForPrint;

        closePrintInvoiceModal();

        printThermalInvoice(invoice);

    });


// Real/A4 button
document
    .getElementById("printRealBtn")
    .addEventListener("click", () => {

        if (!invoiceWaitingForPrint) return;

        const invoice =
            invoiceWaitingForPrint;

        closePrintInvoiceModal();

        printRealInvoice(invoice);

    });


// Close button
document
    .getElementById("closePrintModal")
    .addEventListener("click", () => {

        closePrintInvoiceModal();

    });


// Cancel button
document
    .getElementById("cancelPrintBtn")
    .addEventListener("click", () => {

        closePrintInvoiceModal();

    });


// Click outside modal
document
    .getElementById("printInvoiceModal")
    .addEventListener("click", (e) => {

        if (
            e.target.id ===
            "printInvoiceModal"
        ) {

            closePrintInvoiceModal();

        }

    });

document.getElementById("createInvoiceBtn").addEventListener("click", async () => {

    if (issuedItems.length === 0) {
        alert("Please add products first.");
        return;
    }

const invoice = {

    id: Date.now(),

    type: "salesman",

    partyId: currentSalesmanId,

    partyName: document.getElementById("salesmanName").textContent,

    date: new Date(),

    items: issuedItems.map(item => {

        const product = products.find(
            p => p.id === item.productId
        );

        return {

            productId: item.productId,

            productName: product.name,

            quantity: item.qty,

            returnQuantity: item.ret,

            price: item.price,

            commissionApplicable:item.commissionApplicable,

            amount: (item.qty - item.ret) * item.price

        };

    }),

    subtotal: Number(
        document.getElementById("subTotal").textContent.replace(/,/g, "")
    ),

    commission: Number(
        document.getElementById("commision").textContent.replace(/,/g, "")
    ),

    discount: Number(
        document.getElementById("Discount").value
    ),

    netTotal: Number(
        document.getElementById("NetTotal").textContent.replace(/,/g, "")
    ),

    cash: Number(
        document.getElementById("Cash").value
    ),

    currentBill: Number(
        document.getElementById("currentBill").textContent.replace(/,/g, "")
    ),

    arrears: Number(
        document.getElementById("Arrears").textContent.replace(/,/g, "")
    ),

    balance: Number(
        document.getElementById("balance").textContent.replace(/,/g, "")
    )
    
};
console.log("invoice",invoice)
    try {

        const response = await fetch(
            `${API}/invoices`,
            {
                method: "POST",
                
        credentials: 'include',
    
                headers: {
                    "Content-Type": "application/json"
                },
               body: JSON.stringify(invoice)
            },
            
        );
         if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        const result = await response.json();

        if (response.ok) {

    alert(result.message);

    console.log(result);

   // Ask which bill the user wants to print
// Show print selection popup
openPrintInvoiceModal(invoice);

// Refresh latest data from backend
await fetchProducts();
await fetchSalesmen();

}
else {

    alert(
        result.message ||
        "Failed to create invoice."
    );

}

    }
    catch (err) {

        console.error(err);

        alert("Failed to save invoice");

    }

});
renderIssueTable();

// ---- Mobile sidebar toggle ----
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
menuToggle.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
});
overlay.addEventListener("click", closeSidebar);

// ---- Sidebar nav ----
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    closeSidebar();
  });
});

function updateIssueRow(index) {

    const item = issuedItems[index];

    if (!item) return;

    const product = products.find(
        p => p.id === item.productId
    );

    if (!product) return;

    const qty = Number(item.qty) || 0;
    const ret = Number(item.ret) || 0;

    // Stock remaining after issuing this quantity
    const availableStock = Math.max(
        product.stock - qty,
        0
    );

    // Net sales
    const net = Math.max(
        qty - ret,
        0
    );

    // Amount
    const amount =
        net * item.price;


    // =========================
    // UPDATE AVAILABLE STOCK
    // =========================

    const stockElement =
        document.getElementById(
            "available-stock-" + index
        );

if (stockElement) {

    stockElement.textContent = availableStock;

    // Remove old stock color
    stockElement.classList.remove(
        "stock-good",
        "stock-low",
        "stock-critical"
    );

    // Apply new color
    stockElement.classList.add(
        getStockClass(availableStock)
    );
}

    // =========================
    // UPDATE NET
    // =========================

    const netElement =
        document.getElementById(
            "net-" + index
        );

    if (netElement) {

        netElement.textContent =
            net;

    }


    // =========================
    // UPDATE AMOUNT
    // =========================

    const amountElement =
        document.getElementById(
            "amount-" + index
        );

    if (amountElement) {

        amountElement.textContent =
            amount.toLocaleString();

    }


    // =========================
    // UPDATE TOTALS
    // =========================

    updateSubtotal();

}
document
.getElementById("Discount")
.addEventListener("input",()=>{

    updateSubtotal();

});
document
.getElementById("Cash")
.addEventListener("input",()=>{

    updateSubtotal();

});


document
    .getElementById("issueTableBody")
    .addEventListener("click", (e) => {

        const deleteBtn =
            e.target.closest(".delete-issue-row-btn");

        if (!deleteBtn) return;


        const index =
            Number(deleteBtn.dataset.index);


        if (
            isNaN(index) ||
            !issuedItems[index]
        ) {
            return;
        }


        // Remove the product from the issue list
        issuedItems.splice(index, 1);


        // Re-render table
        renderIssueTable();

    });