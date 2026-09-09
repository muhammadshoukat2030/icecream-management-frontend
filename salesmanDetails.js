// =========================================================
// FrostyOps - Salesman Details
// Load one salesman from backend
// =========================================================


// -------------------- Get ID from URL --------------------
const API="https://icecream-management-backend.vercel.app";
const adminUser=JSON.parse(localStorage.getItem('user'));
console.log(adminUser.email)
document.getElementById('admin').textContent=adminUser.email;
const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

console.log(today);
document.getElementById('datePill').textContent=today
const params = new URLSearchParams(window.location.search);

const salesmanId = params.get("id");
let selectedInvoice = null;
let currentSalesman = null;
let editingInvoice = null;
let finalInvoice;
console.log(5-(5));

if(!salesmanId){

    alert("Salesman ID not found");

    window.location.href = "salesmen.html";

}


// -------------------- API --------------------

const API2 =
`${API}/oneSalesman?id=${salesmanId}`;



// -------------------- Load Page --------------------

document.addEventListener("DOMContentLoaded",()=>{

    loadSalesman();

});




// =========================================================
// Load Single Salesman
// =========================================================

async function loadSalesman(){

    try{

        const response = await fetch(API2,
            {
                credentials:'include'
            }
        );

        if(!response.ok){
            throw new Error("Salesman not found");
        }


        const data = await response.json();

        console.log(data);


        // salesman personal data
      renderSalesman(data.salesman);

renderCards(data.stats, data.salesman);

renderSummary(data.summary);


    }
    catch(error){

        console.log(error);

        alert("Unable to load salesman");

    }

}
let data;
getSummary=async()=>{
 const res= await fetch(`${API}/summary?id=${salesmanId}`,
    {
        credentials:'include'
    }
 );
data=await res.json();
console.log(data);
}
getSummary();


// =========================================================
// Render Data
// =========================================================

function renderSalesman(s){
     currentSalesman = s;
console.log(s.outstandingBalance)

document.getElementById("detName").innerHTML = `
${s.name}

<span class="status-badge ${s.status ? "active":"inactive"}">

<span class="dot"></span>

${s.status ? "Active":"Inactive"}

</span>
`;



document.getElementById("detSub").innerHTML =
`
Salesman ID: ${s.id}
&nbsp;·&nbsp;
Joined -
`;



document.getElementById("detPhone").textContent =
s.phone || "-";



document.getElementById("detAddress").textContent =
s.address || "-";



document.getElementById("detCnic").textContent =
s.cnic || "-";


document.getElementById("detEmail").textContent =
s.email || "-";


document.getElementById("detWhatsapp").textContent =
s.phone || "-";





document.getElementById("detOutstanding").textContent =
Number(
    s.outstandingBalance
 ?? s.outstandingBalance ?? 0
)
.toLocaleString("en-PK");


document.getElementById("detPhoto").src =
s.photo || "images/default-user.png";


}



// =========================================================
// Buttons
// =========================================================


document.querySelector(".btn-issue")
?.addEventListener("click",()=>{


    window.location.href =
    `issueStocks.html?salesman=${salesmanId}`;


});



document.getElementById("fullscreenLink")
?.addEventListener("click",(e)=>{


    e.preventDefault();


    window.location.href =
    `invoice.html?salesman=${salesmanId}`;


});





// =========================================================
// Helper
// =========================================================


function formatNumber(value){

    return Number(value || 0)
    .toLocaleString("en-PK");

}

function renderCards(stats, salesman){

    // Outstanding Balance
    document.getElementById("detOutstanding")
    .textContent =
    Number(
        salesman.outstandingBalance ?? 
        stats.outstandingBalance ?? 
        0
    )
    .toLocaleString("en-PK");


    // Today Issued
    document.getElementById("detTodayIssued")
    .textContent =
    Number(data.todayInvoiceLength
 || 0)
    .toLocaleString("en-PK");


    // Total invoices
    document.querySelectorAll(".stat-num")[2]
    .textContent =
    stats.totalInvoices || 0;


    // Total payments
    document.querySelectorAll(".stat-num")[3]
    .textContent =
    Number(stats.totalPayments || 0)
    .toLocaleString("en-PK");

}
let currentSummary = [];

function renderSummary(summary) {

    currentSummary = summary;

    renderFilteredSummary(summary);
}

function renderFilteredSummary(summary) {

    const tbody = document.getElementById("summaryTbody");

    tbody.innerHTML = "";

    if (!summary || summary.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    No invoices found
                </td>
            </tr>
        `;

        return;
    }

    summary.forEach((invoice, index) => {

        tbody.innerHTML += `

        <tr class="invoice-row"
            data-id="${invoice.invoiceId}">

            <td>${index + 1}</td>

            <td>
                ${new Date(invoice.date).toLocaleDateString()}
            </td>

            <td>
                ${invoice.invoiceNo}
            </td>

            <td>
                Stock Issue
            </td>

            <td>
                ${invoice.totalQuantity}
            </td>

            <td>
                ${Number(invoice.amount || 0).toLocaleString()}
            </td>

            <td>
                ${Number(invoice.commission || 0).toLocaleString()}
            </td>

            <td>
                ${Number(invoice.cash || 0).toLocaleString()}
            </td>

            <td>
                ${Number(invoice.balance || 0).toLocaleString()}
            </td>

        </tr>

        `;
    });
}

function renderInvoice(invoice){
    selectedInvoice = invoice;
    document.getElementById("invNo").textContent =
        "Invoice No: " + invoice.id;

    const tbody=document.getElementById("invoiceTbody");

    tbody.innerHTML="";

    invoice.items.forEach(item=>{

        const net=item.quantity-item.returnQuantity;

        tbody.innerHTML+=`

        <tr>

            <td>${item.productName}</td>

            <td>Issue</td>

            <td>${item.price}</td>

            <td>${item.quantity}</td>

            <td>${item.returnQuantity}</td>

            <td>${net}</td>

            <td>${(net*item.price).toLocaleString()}</td>

        </tr>

        `;

    });

    document.getElementById("subTotal").textContent =
        invoice.subtotal.toLocaleString();

    document.getElementById("commision").textContent =
        invoice.commission.toLocaleString();
    document.getElementById("Discount").textContent =
        invoice.discount.toLocaleString();

    document.getElementById("NetTotal").textContent =
        invoice.netTotal.toLocaleString();
    document.getElementById("Cash").textContent =
        invoice.cash.toLocaleString();

    document.getElementById("currentBill").textContent =
        (invoice.netTotal-invoice.cash).toLocaleString();

    document.getElementById("Arrears").textContent =
        invoice.arrears.toLocaleString();

    document.getElementById("balance").textContent =
        invoice.balance.toLocaleString();
        
        
        document.getElementById('comissionPercentage').textContent=invoice.dynamicComission*100
}

function openInvoiceEditPopup(invoice) {

    editingInvoice =
        structuredClone(invoice);


    // =====================================
    // Invoice information
    // =====================================

    document.getElementById(
        "editInvoiceInfo"
    ).innerHTML = `

        <div>
            <strong>Invoice:</strong>
            ${invoice.id}
        </div>

        <div>
            <strong>Salesman:</strong>
            ${invoice.partyName}
        </div>

        <div>
            <strong>Date:</strong>
            ${new Date(
                invoice.date
            ).toLocaleDateString()}
        </div>

    `;


    // =====================================
    // Product rows
    // =====================================

    const tbody =
        document.getElementById(
            "editInvoiceTbody"
        );


    tbody.innerHTML = "";


    invoice.items.forEach(
        (item, index) => {

            const quantity =
                Number(
                    item.quantity || 0
                );


            const returnQuantity =
                Number(
                    item.returnQuantity || 0
                );


            const net =
                quantity -
                returnQuantity;


            const amount =
                net *
                Number(
                    item.price || 0
                );


            tbody.innerHTML += `

                <tr
                    data-index="${index}">

                    <td>
                        ${item.productName}
                    </td>

                    <td>
                        ${quantity}
                    </td>

                    <td>

                        <input
                            type="number"
                            class="return-input"
                            min="0"
                            max="${quantity}"
                            value="${returnQuantity}"
                        >

                    </td>

                    <td class="edit-net">
                        ${net}
                    </td>

                    <td>
                        ${Number(
                            item.price || 0
                        ).toLocaleString()}
                    </td>

                    <td class="edit-amount">
                        ${amount.toLocaleString()}
                    </td>

                </tr>

            `;

        }
    );


    // =====================================
    // Cash
    // =====================================

    document.getElementById(
        "editCash"
    ).value =
        Number(
            invoice.cash || 0
        );
        document.getElementById('editingComission').textContent=invoice.dynamicComission*100;

    // =====================================
    // Calculate
    // =====================================

    updateEditInvoiceTotals(invoice);


    // =====================================
    // Show popup
    // =====================================

    document.getElementById(
        "invoiceEditModal"
    ).classList.add("show");

}

function updateEditInvoiceTotals(invoice) {

    if (!editingInvoice) return;


    let subtotal = 0;
    let nonCommissionableAmount = 0; // NEW


    const rows =
        document.querySelectorAll(
            "#editInvoiceTbody tr"
        );


    rows.forEach(
        (row, index) => {

            const item =
                editingInvoice.items[index];


            const quantity =
                Number(
                    item.quantity || 0
                );


            let returnQuantity =
                Number(
                    row.querySelector(
                        ".return-input"
                    ).value || 0
                );


            // Cannot be negative
            if (returnQuantity < 0) {

                returnQuantity = 0;

            }


            // Cannot return more than sold
            if (
                returnQuantity >
                quantity
            ) {

                returnQuantity =
                    quantity;

            }


            const net =
                quantity -
                returnQuantity;


            const amount =
                net *
                Number(
                    item.price || 0
                );


            row.querySelector(
                ".return-input"
            ).value =
                returnQuantity;


            row.querySelector(
                ".edit-net"
            ).textContent =
                net;


            row.querySelector(
                ".edit-amount"
            ).textContent =
                amount.toLocaleString();


            subtotal += amount;

            // NEW: exclude products with commissionApplicable === "no"
            if (item.commissionApplicable === "no") {
                nonCommissionableAmount += amount;
            }

        }
    );


    /*
     * Use your existing invoice
     * commission formula here.
     *
     * Your current invoice uses 20%.
     */

    // CHANGED: only apply 20% to commissionable amount
    const commissionableAmount =
        Math.max(subtotal - nonCommissionableAmount, 0);
console.log('cinvoie:', invoice);
    const commission =
        commissionableAmount * invoice.dynamicComission;


    const discount =
        Number(
            editingInvoice.discount || 0
        );


    const netTotal =
        subtotal -
        commission -
        discount;


    const cash =
        Number(
            document.getElementById(
                "editCash"
            ).value || 0
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


    // =====================================
    // Display
    // =====================================

    document.getElementById(
        "editSubtotal"
    ).textContent =
        subtotal.toLocaleString();


    document.getElementById(
        "editCommission"
    ).textContent =
        commission.toLocaleString();


    document.getElementById(
        "editDiscount"
    ).textContent =
        discount.toLocaleString();


    document.getElementById(
        "editNetTotal"
    ).textContent =
        netTotal.toLocaleString();


    document.getElementById(
        "editCurrentBill"
    ).textContent =
        currentBill.toLocaleString();


    document.getElementById(
        "editArrears"
    ).textContent =
        arrears.toLocaleString();


    document.getElementById(
        "editBalance"
    ).textContent =
        balance.toLocaleString();

}

document
.getElementById("editInvoiceTbody")
.addEventListener(
    "input",
    (e) => {

        if (
            e.target.classList.contains(
                "return-input"
            )
        ) {

            updateEditInvoiceTotals(finalInvoice);

        }

    }
);

document
.getElementById("editCash")
.addEventListener(
    "input",
    () => {

        updateEditInvoiceTotals();

    }
);

document
.getElementById("summaryTbody")
.addEventListener("click", async (e) => {

    const row =
        e.target.closest(".invoice-row");

    if (!row) return;


    const invoiceId =
        Number(row.dataset.id);


    try {

        // =====================================
        // 1. Fetch clicked invoice
        // =====================================

        const response =
            await fetch(
                `${API}/invoice/${invoiceId}`,
                {
                    credentials:'include'
                }
            );


        if (!response.ok) {

            throw new Error(
                "Invoice not found"
            );

        }


        const invoice =
            await response.json();


        console.log(
            "Selected invoice:",
            invoice
        );


        // =====================================
        // 2. Display invoice normally
        // =====================================

        renderInvoice(invoice);


        // =====================================
        // 3. Check latest invoice
        // =====================================

        const latestResponse =
            await fetch(
                `${API}/salesman/${salesmanId}/latest-invoice`,
                {
                    credentials:'include'
                }
            );


        if (!latestResponse.ok) {

            throw new Error(
                "Could not determine latest invoice"
            );

        }


        const latestInvoice =
            await latestResponse.json();

        finalInvoice=latestInvoice;
        console.log(
            "Latest invoice:",
            latestInvoice
        );


        // =====================================
        // 4. Only latest invoice is editable
        // =====================================

        if (
            Number(invoice.id) ===
            Number(latestInvoice.id)
        ) {

            openInvoiceEditPopup(invoice);

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load invoice."
        );

    }

});
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
                    Commission ${invoice.dynamicComission*100}%
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
                    ${Number(invoice.netTotal-invoice.cash).toLocaleString()}
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
    }
    
    document
    .getElementById("printInvoiceBtn")
    .addEventListener("click", () => {

        if (!selectedInvoice) {
            alert("Please select an invoice first.");
            return;
        }

        printRealInvoice(selectedInvoice);

    });
    document
    .getElementById("summaryDateSearch")
    .addEventListener("change", filterSummary);

    document
    .getElementById("summaryInvoiceSearch")
    .addEventListener("input", filterSummary);
    function filterSummary() {

    const dateValue =
        document.getElementById("summaryDateSearch").value;

    const invoiceValue =
        document
            .getElementById("summaryInvoiceSearch")
            .value
            .trim()
            .toLowerCase();


    const filtered = currentSummary.filter(invoice => {

        // =========================
        // DATE FILTER
        // =========================

        let dateMatch = true;

        if (dateValue) {

            const invoiceDate =
                new Date(invoice.date);

            const year =
                invoiceDate.getFullYear();

            const month =
                String(invoiceDate.getMonth() + 1)
                    .padStart(2, "0");

            const day =
                String(invoiceDate.getDate())
                    .padStart(2, "0");

            const formattedDate =
                `${year}-${month}-${day}`;

            dateMatch =
                formattedDate === dateValue;
        }


        // =========================
        // INVOICE NUMBER FILTER
        // =========================

        let invoiceMatch = true;

        if (invoiceValue) {

            invoiceMatch =
                String(invoice.invoiceNo)
                    .toLowerCase()
                    .includes(invoiceValue);
        }


        // BOTH CONDITIONS MUST MATCH

        return dateMatch && invoiceMatch;

    });


    renderFilteredSummary(filtered);
}

function printSalesmanSummary() {

    if (!currentSalesman) {
        alert("Salesman information is not loaded.");
        return;
    }

    if (!currentSummary || currentSummary.length === 0) {
        alert("No summary records found.");
        return;
    }

    const printWindow = window.open(
        "",
        "_blank",
        "width=1200,height=900"
    );

    if (!printWindow) {
        alert("Please allow popups to print the summary.");
        return;
    }

    const salesmanName =
        currentSalesman.name || "-";

    const salesmanId =
        currentSalesman.id || "-";

    /*
     * Opening balance.
     *
     * If your backend sends openingBalance, it will be used.
     * Otherwise we calculate it from the first transaction.
     */
    let openingBalance =
        Number(currentSalesman.openingBalance ?? 0);

    if (
        !currentSalesman.openingBalance &&
        currentSummary.length > 0
    ) {

        const first = currentSummary[0];

        openingBalance =
            Number(first.balance || 0)
            - Number(first.amount || 0)
            + Number(first.commission || 0)
            + Number(first.cash || 0);
    }


    /*
     * Create table rows
     */
  const sortedSummary = [...currentSummary].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
});

const rows = sortedSummary.map((invoice, index) => {

        const date = invoice.date
            ? new Date(invoice.date).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            )
            : "-";


        const amount =
            Number(invoice.amount || 0);

        const commission =
            Number(invoice.commission || 0);

        const advance =
            Number(invoice.cash || 0);

        const balance =
            Number(invoice.balance || 0);


        return `
            <tr>

                <td class="center">
                    ${index + 1}
                </td>

                <td class="center">
                    ${date}
                </td>

                <td class="center">
                    ${invoice.invoiceNo || "-"}
                </td>

                <td>
                    Sales of Ice Cream
                </td>

                <td class="number">
                    ${Number(
                        invoice.totalQuantity || 0
                    ).toLocaleString("en-PK")}
                </td>

                <td class="number">
                    ${amount
                        ? amount.toLocaleString("en-PK")
                        : "-"
                    }
                </td>

                <td class="number">
                    ${commission
                        ? commission.toLocaleString("en-PK")
                        : "-"
                    }
                </td>

                <td class="number">
                    ${advance
                        ? advance.toLocaleString("en-PK")
                        : "-"
                    }
                </td>

                <td class="number balance-cell">
                    ${balance.toLocaleString("en-PK")}
                </td>

            </tr>
        `;

    }).join("");


    /*
     * Total values
     */
   const totalItems =
    sortedSummary.reduce(
            (sum, invoice) =>
                sum + Number(invoice.totalQuantity || 0),
            0
        );
const totalAmount =
    sortedSummary.reduce(
        (sum, invoice) =>
            sum + Number(invoice.amount || 0),
        0
    );

const totalCommission =
    sortedSummary.reduce(
        (sum, invoice) =>
            sum + Number(invoice.commission || 0),
        0
    );

const totalAdvance =
    sortedSummary.reduce(
        (sum, invoice) =>
            sum + Number(invoice.cash || 0),
        0
    );

const finalBalance =
    Number(
        sortedSummary[sortedSummary.length - 1]
            ?.balance || 0
    );


    /*
     * Print document
     */
    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Salesman Statement - ${salesmanName}
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


.salesman-name {

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


/*
 * Column widths
 */

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

        -webkit-print-color-adjust: exact;

        print-color-adjust: exact;

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


        <div class="statement-title">
            SALESMAN STATEMENT / HISTORY
        </div>


        <div class="salesman-name">
            ${salesmanName}
        </div>

    </div>



    <!-- SALESMAN INFORMATION -->

    <div class="info">

        <div class="info-left">

            Salesman ID:
            ${salesmanId}

            &nbsp;&nbsp;&nbsp;

            Total Transactions:
            ${currentSummary.length}

        </div>


        <div class="opening-balance">

            Opening Balance:
            Rs. ${openingBalance.toLocaleString("en-PK")}

        </div>

    </div>



    <!-- SUMMARY TABLE -->

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

                <th>
                    S. No
                </th>

                <th>
                    Date
                </th>

                <th>
                    Invoice<br>No
                </th>

                <th>
                    Particulars
                </th>

                <th>
                    No's of<br>Items
                </th>

                <th>
                    Amount
                </th>

                <th>
                    Commission/Discount<br>
                    @ 25%
                </th>

                <th>
                    Advance Payment
                </th>

                <th>
                    Balance Amount
                </th>

            </tr>

        </thead>


        <tbody>


            <!-- OPENING BALANCE -->

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
                    ${openingBalance.toLocaleString("en-PK")}
                </td>

            </tr>


            ${rows}


            <!-- TOTAL -->

            <tr class="total-row">

                <td colspan="4" class="number">
                    TOTAL
                </td>

                <td class="number">
                    ${totalItems.toLocaleString("en-PK")}
                </td>

                <td class="number">
                    ${totalAmount.toLocaleString("en-PK")}
                </td>

                <td class="number">
                    ${totalCommission.toLocaleString("en-PK")}
                </td>

                <td class="number">
                    ${totalAdvance.toLocaleString("en-PK")}
                </td>

                <td class="number">
                    ${finalBalance.toLocaleString("en-PK")}
                </td>

            </tr>


        </tbody>

    </table>



    <!-- FOOTER -->

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

document
    .getElementById("clearSummarySearch")
    .addEventListener("click", () => {

        document.getElementById("summaryDateSearch").value = "";

        document.getElementById("summaryInvoiceSearch").value = "";

        renderFilteredSummary(currentSummary);

    });
    document
    .getElementById("printSummaryBtn")
    ?.addEventListener("click", () => {

        printSalesmanSummary();

    });
    document
.getElementById("saveInvoiceEdit")
.addEventListener(
    "click",
    async () => {

        if (!editingInvoice) {

            alert(
                "No invoice selected."
            );

            return;

        }


        // =====================================
        // Collect return quantities
        // =====================================

        const rows =
            document.querySelectorAll(
                "#editInvoiceTbody tr"
            );


        const items =
            Array.from(rows).map(
                (row, index) => {

                    const item =
                        editingInvoice
                            .items[index];


                    const returnQuantity =
                        Number(
                            row.querySelector(
                                ".return-input"
                            ).value || 0
                        );


                    return {

                        productId:
                            item.productId,

                        returnQuantity:
                            returnQuantity

                    };

                }
            );


        // =====================================
        // Cash
        // =====================================

        const cash =
            Number(
                document.getElementById(
                    "editCash"
                ).value || 0
            );


        // =====================================
        // Save
        // =====================================

        try {

            const response =
                await fetch(
                    `${API}/invoice/${editingInvoice.id}/update-last`,
                    {

                        method: "PUT",
                        credentials:'include',
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


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Unable to update invoice"
                );

            }


            console.log(
                "Updated invoice:",
                result.invoice
            );


            alert(
                "Invoice updated successfully."
            );


            // =================================
            // Close popup
            // =================================

            document
                .getElementById(
                    "invoiceEditModal"
                )
                .classList.remove(
                    "show"
                );


            editingInvoice = null;


            // =================================
            // Reload salesman information
            // =================================

            await loadSalesman();


            // =================================
            // Reload summary
            // =================================

            await getSummary();


        }
        catch (error) {

            console.error(error);

            alert(
                error.message
            );

        }

    }
);

document
.getElementById("closeInvoiceModal")
.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "invoiceEditModal"
            )
            .classList.remove(
                "show"
            );

        editingInvoice = null;

    }
);


document
.getElementById("cancelInvoiceEdit")
.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "invoiceEditModal"
            )
            .classList.remove(
                "show"
            );

        editingInvoice = null;

    }
);

