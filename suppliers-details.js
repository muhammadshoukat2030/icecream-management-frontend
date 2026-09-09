// ============================================================
// SUPPLIER DETAILS PAGE
// ============================================================
const API= "https://icecream-management-backend.vercel.app";


// ============================================================
// GLOBAL STATE
// ============================================================

let supplier = null;

let supplierInvoices = [];

let supplierProducts = [];

let filteredSupplierInvoices = [];

let filteredSupplierProducts = [];
let invoiceForPrint;
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
// ============================================================
// GET SUPPLIER ID FROM URL
// ============================================================

const urlParams =
    new URLSearchParams(window.location.search);

const supplierId =
    Number(urlParams.get("id"));


if (!supplierId) {

    alert("Supplier ID is missing.");

    window.location.href =
        "suppliers.html";
}


// ============================================================
// DOM ELEMENTS
// ============================================================

const crumbCurrent =
    document.getElementById("crumbCurrent");

const supplierNameElement =
    document.querySelector(".supplier-name");

const infoCompanyName =
    document.getElementById("infoCompanyName");

const infoContactPerson =
    document.getElementById("infoContactPerson");

const infoAddress =
    document.getElementById("infoAddress");

const infoPhone =
    document.getElementById("infoPhone");

const infoWhatsapp =
    document.getElementById("infoWhatsapp");

const infoEmail =
    document.getElementById("infoEmail");

const infoCity =
    document.getElementById("infoCity");

const infoStatus =
    document.getElementById("infoStatus");

const detailsLogo =
    document.getElementById("detailsLogo");

const summaryTableBody =
    document.getElementById("summaryTableBody");

const invoiceTableBody =
    document.getElementById("invoiceTableBody");

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

        await loadSupplier();

    }
);


// ============================================================
// LOAD SUPPLIER
// ============================================================

async function loadSupplier() {

    try {

        showLoading();

        const response =
            await fetch(
                `${API}/suppliers/${supplierId}`,{
  credentials: "include",
}
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load supplier"
            );

        }


        const result =
            await response.json();


        supplier =
            result.data || result;


        await loadSupplierDetails();

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load supplier information."
        );

    }

}


// ============================================================
// LOAD SUPPLIER DETAILS
// ============================================================

async function loadSupplierDetails() {

    renderSupplierInformation();

    await Promise.all([
        loadSupplierInvoices(),
        loadSupplierProducts()
    ]);


    filteredSupplierInvoices =
        [...supplierInvoices];


    filteredSupplierProducts =
        [...supplierProducts];


    renderSummary();

    renderProducts();

    updateStats();

}


// ============================================================
// SUPPLIER INFORMATION
// ============================================================

function renderSupplierInformation() {

    if (!supplier) return;


    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

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

function getSupplierStatusText(status) {

    /*
     * Your MongoDB schema uses Boolean for status.
     *
     * true  = Active
     * false = Inactive
     *
     * This also supports old/string data.
     */

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

function getSupplierStatusBoolean(status) {

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

    if (!detailsLogo) return;


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
// LOAD SUPPLIER INVOICES
// ============================================================

async function loadSupplierInvoices() {

    try {

        const response =
            await fetch(
                `${API}/suppliers/${supplierId}/invoices`,
                {
                    credentials:'include'
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load supplier invoices"
            );

        }


        const result =
            await response.json();


        supplierInvoices =
            result.invoices ||
            result.data ||
            [];


    }
    catch (error) {

        console.error(error);

        supplierInvoices = [];

    }

}


// ============================================================
// LOAD SUPPLIER PRODUCTS
// ============================================================

async function loadSupplierProducts() {

    try {

        const response =
            await fetch(
                `${API}/suppliers/${supplierId}/products`,
                {
                    credentials:'include'
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load supplier products"
            );

        }


        const result =
            await response.json();


        supplierProducts =
            result.products ||
            result.data ||
            [];


    }
    catch (error) {

        console.error(error);

        supplierProducts = [];

    }

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

    if (!summaryTableBody) return;


    const table =
        summaryTableBody.closest("table");


    if (!table) return;


    /*
     * Do not create the search twice.
     */

    if (
        document.getElementById(
            "supplierInvoiceSearch"
        )
    ) {

        return;

    }


    const wrapper =
        document.createElement("div");


    wrapper.id =
        "supplierInvoiceSearchWrapper";


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
                id="supplierInvoiceSearch"
                placeholder="Search invoice ID or date..."
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
            id="clearSupplierInvoiceSearch"
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
            "supplierInvoiceSearch"
        );


    const clearButton =
        document.getElementById(
            "clearSupplierInvoiceSearch"
        );


    searchInput.addEventListener(
        "input",
        () => {

            filterSupplierInvoices(
                searchInput.value
            );

        }
    );


    clearButton.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            filterSupplierInvoices("");

            searchInput.focus();

        }
    );

}


// ============================================================
// CREATE PRODUCT SEARCH
// ============================================================

function createProductSearch() {

    if (!supplierProductsTableBody) return;


    const table =
        supplierProductsTableBody.closest(
            "table"
        );


    if (!table) return;


    if (
        document.getElementById(
            "supplierProductSearch"
        )
    ) {

        return;

    }


    const wrapper =
        document.createElement("div");


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


    searchInput.addEventListener(
        "input",
        () => {

            filterSupplierProducts(
                searchInput.value
            );

        }
    );


    clearButton.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            filterSupplierProducts("");

            searchInput.focus();

        }
    );

}


// ============================================================
// FILTER INVOICES
// ============================================================

function filterSupplierInvoices(searchValue) {

    const search =
        String(searchValue || "")
            .trim()
            .toLowerCase();


    if (!search) {

        filteredSupplierInvoices =
            [...supplierInvoices];

    }
    else {

        filteredSupplierInvoices =
            supplierInvoices.filter(
                invoice => {

                    const invoiceId =
                        String(
                            invoice.id ??
                            invoice.invoiceId ??
                            invoice.invoiceNo ??
                            ""
                        )
                            .toLowerCase();


                    const date =
                        formatDate(
                            invoice.date
                        )
                            .toLowerCase();


                    const rawDate =
                        invoice.date
                            ? String(
                                invoice.date
                            ).toLowerCase()
                            : "";


                    return (
                        invoiceId.includes(
                            search
                        ) ||
                        date.includes(
                            search
                        ) ||
                        rawDate.includes(
                            search
                        )
                    );

                }
            );

    }


    renderSummary();

}


// ============================================================
// FILTER PRODUCTS
// ============================================================

function filterSupplierProducts(searchValue) {

    const search =
        String(searchValue || "")
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

    if (!summaryTableBody) return;


    summaryTableBody.innerHTML = "";


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
        (invoice, index) => {

            const row =
                document.createElement("tr");


            /*
             * Make the entire row clickable.
             */

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
                invoice.items || [];


            const totalItems =
                items.reduce(
                    (total, item) =>
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
                    invoice.subtotal ??
                    invoice.netTotal ??
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


            /*
             * Entire row opens invoice.
             */

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
// SHOW INVOICE
// ============================================================

async function showInvoice(invoiceId) {

    try {

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


        renderInvoice(invoice);
        invoiceForPrint=invoice;

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load invoice."
        );

    }

}


// ============================================================
// RENDER INVOICE
// ============================================================

function renderInvoice(invoice) {

    const invoiceNo =
        document.getElementById(
            "invoiceNo"
        );


    if (invoiceNo) {

        invoiceNo.textContent =
            `INV-${invoice.id}`;

    }


    if (!invoiceTableBody) return;


    invoiceTableBody.innerHTML = "";


    const items =
        invoice.items || [];


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
                quantity -
                returnQuantity;


            const price =
                Number(
                    item.price || 0
                );


            const amount =
                item.amount !== undefined
                    ? Number(item.amount || 0)
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

                    ${formatMoney(
                        price
                    )}

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

                    ${formatMoney(
                        amount
                    )}

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


    /*
     * Add/enable print button for the
     * currently displayed invoice.
     */

    setupInvoicePrintButton(
        invoice
    );

}


// ============================================================
// INVOICE TOTALS
// ============================================================

function updateInvoiceTotals(invoice) {

    const totals =
        document.querySelectorAll(
            ".invoice-totals .t-row"
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
                    netTotal - cash
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
    document.getElementById('editingComission').textContent=invoice.dynamicComission*100;

}


// ============================================================
// INVOICE PRINT BUTTON
// ============================================================

function setupInvoicePrintButton(
    invoice
) {

    const printInvoiceBtn =
        document.getElementById(
            "printInvoiceBtn"
        );


    if (
        printInvoiceBtn &&
        !printInvoiceBtn.dataset.bound
    ) {

        printInvoiceBtn.dataset.bound =
            "true";


        printInvoiceBtn.addEventListener(
            "click",
            () => {

              

            }
        );

    }

}


// ============================================================
// REAL INVOICE PRINT
// ============================================================

function printRealInvoice(invoice) {

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
        invoice.items || [];


    const itemsRows =
        items.map(
            (item, index) => {

                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const returned =
                    Number(
                        item.returnedQuantity ??
                        item.returnQuantity ??
                        0
                    );


                const net =
                    quantity -
                    returned;


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


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.productName || "-"
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
        ).join("");


    const totalQuantity =
        items.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );


    const totalReturned =
        items.reduce(
            (total, item) =>
                total +
                Number(
                    item.returnedQuantity ??
                    item.returnQuantity ??
                    0
                ),
            0
        );


    const totalNet =
        totalQuantity -
        totalReturned;


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
        String(invoice.id || "")
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
            INVOICE
        </div>

    </div>



    <table class="info-table">

        <tr>

            <td class="info-label">
                Supplier
            </td>

            <td class="info-value">
                ${escapeHTML(
                    supplier?.companyName || "-"
                )}
            </td>


            <td class="info-label">
                Inv No.
            </td>

            <td class="info-value">
                ${escapeHTML(
                    String(invoice.id || "-")
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
                    Commission ${invoice.dynamicComission*100}%
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
                        netTotal - cash
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
// PRODUCTS TABLE
// ============================================================

function renderProducts() {

    if (!supplierProductsTableBody)
        return;


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


            supplierProductsTableBody
                .appendChild(row);

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
                                p =>
                                    Number(
                                        p.id
                                    ) === id
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


    /*
     * Only automatically show the first
     * product when no product has been
     * displayed yet.
     */

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

function showProductDetails(product) {

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


    /*
     * Support both the old typo "qunatity"
     * and correct "quantity".
     */

    const stock =
        Number(
            product.quantity ??
            product.qunatity ??
            0
        );


    if (detailStock) {

        detailStock.innerHTML = `

            ${stock.toLocaleString("en-PK")}

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


    if (!statNumbers.length)
        return;


    const outstanding =
        Number(
            supplier?.outstandingBalance ||
            0
        );


    const totalPurchases =
        supplierInvoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.netTotal ??
                    invoice.subtotal ??
                    invoice.amount ??
                    0
                ),
            0
        );


    const currentMonth =
        new Date().getMonth();


    const currentYear =
        new Date().getFullYear();


    const monthlyPurchases =
        supplierInvoices
            .filter(
                invoice => {

                    const date =
                        new Date(
                            invoice.date
                        );


                    return (
                        date.getMonth() ===
                            currentMonth &&
                        date.getFullYear() ===
                            currentYear
                    );

                }
            )
            .reduce(
                (sum, invoice) =>
                    sum +
                    Number(
                        invoice.netTotal ??
                        invoice.subtotal ??
                        invoice.amount ??
                        0
                    ),
                0
            );


    /*
     * IMPORTANT:
     *
     * Do NOT use K/M.
     *
     * Show complete numbers on cards.
     */

    if (statNumbers[0]) {

        statNumbers[0].textContent =
            `Rs.${formatMoney(
                outstanding
            )}`;

    }


    if (statNumbers[1]) {

        statNumbers[1].textContent =
            `Rs.${formatMoney(
                totalPurchases
            )}`;

    }


    if (statNumbers[2]) {

        statNumbers[2].textContent =
            `Rs.${formatMoney(
                monthlyPurchases
            )}`;

    }


    if (statNumbers[3]) {

        statNumbers[3].textContent =
            supplierProducts.length
                .toLocaleString("en-PK");

    }


    if (
        statNumbers[4] &&
        supplier.lastPayment
    ) {

        statNumbers[4].textContent =
            `Rs.${formatMoney(
                supplier.lastPayment.amount ||
                0
            )}`;


        const lastPaymentSub =
            statNumbers[4]
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
        supplierInvoices.length === 0
    ) {

        alert(
            "No supplier invoice records found."
        );

        return;

    }


    /*
     * Use currently filtered invoices.
     *
     * If search is active, only the matching
     * invoices will be printed.
     */

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
        supplier.companyName || "-";


    const supplierIdValue =
        supplier.id ||
        supplierId ||
        "-";


    /*
     * Opening balance.
     */

    let openingBalance =
        Number(
            supplier.openingBalance ?? 0
        );


    if (
        supplier.openingBalance === undefined ||
        supplier.openingBalance === null
    ) {

        if (summary.length > 0) {

            const first =
                summary[0];


            openingBalance =
                Number(
                    first.balance || 0
                )
                -
                Number(
                    first.amount ||
                    first.subtotal ||
                    0
                )
                +
                Number(
                    first.commission || 0
                )
                +
                Number(
                    first.cash || 0
                );

        }

    }


    /*
     * Sort by date.
     */

    const sortedSummary =
        [...summary].sort(
            (a, b) => {

                return (
                    new Date(a.date) -
                    new Date(b.date)
                );

            }
        );


    /*
     * Create rows.
     */

    const rows =
        sortedSummary.map(
            (invoice, index) => {

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
        ).join("");


    /*
     * Totals.
     */

    const totalItems =
        sortedSummary.reduce(
            (sum, invoice) => {

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
            (sum, invoice) =>
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
            (sum, invoice) =>
                sum +
                Number(
                    invoice.commission ||
                    0
                ),
            0
        );


    const totalAdvance =
        sortedSummary.reduce(
            (sum, invoice) =>
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
                sortedSummary.length - 1
            ]?.balance || 0
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

            Mobile # 0345-9101300 /
            0317-1234570

            <br>

            Peshawar Pakistan

        </div>


        <div class="statement-title">

            SUPPLIER STATEMENT / HISTORY

        </div>


        <div class="supplier-name">

            ${escapeHTML(
                supplierName
            )}

        </div>

    </div>



    <!-- SUPPLIER INFORMATION -->

    <div class="info">


        <div class="info-left">

            Supplier ID:
            ${escapeHTML(
                String(
                    supplierIdValue
                )
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
                    Commission/Discount
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

                    ${openingBalance.toLocaleString(
                        "en-PK"
                    )}

                </td>


            </tr>


            ${rows}


            <!-- TOTAL -->

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


// ============================================================
// EDIT BUTTON
// ============================================================

function createEditButton() {

    const header =
        document.querySelector(
            ".info-panel h4"
        );


    if (!header) return;


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
                            supplier.id || supplierId
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
                event.target === modal
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

async function updateSupplier(event) {

    event.preventDefault();


    const form =
        event.target;


    const formData =
        new FormData(form);


    const updateData = {};


    /*
     * Normal fields.
     */

    for (
        const [key, value]
        of formData.entries()
    ) {

        updateData[key] =
            String(value).trim();

    }


    /*
     * IMPORTANT FIX:
     *
     * MongoDB schema expects Boolean.
     *
     * Do NOT send:
     *
     * status: "Active"
     *
     * Send:
     *
     * status: true
     */

    updateData.status =
        getSupplierStatusBoolean(
            updateData.status
        );


    /*
     * Original values.
     */

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


    /*
     * Find changed fields.
     */

    const changedData = {};


    Object.keys(updateData)
        .forEach(
            field => {

                if (
                    field === "status"
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


    /*
     * Nothing changed.
     */

    if (
        Object.keys(
            changedData
        ).length === 0
    ) {

        alert(
            "No changes were made."
        );

        closeEditSupplierModal();

        return;

    }


    try {

        const saveButton =
            form.querySelector(
                ".save-btn"
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

        }


        const response =
            await fetch(
                `${API}/suppliers/${supplierId}`,
                {

                    method: "PATCH",
                    credentials:'include',
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


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to update supplier"
            );

        }


        /*
         * Replace local supplier.
         */

        supplier =
            result.data ||
            result.supplier ||
            result;


        /*
         * Refresh page data.
         */

        renderSupplierInformation();


        await loadSupplierInvoices();

        await loadSupplierProducts();


        filteredSupplierInvoices =
            [...supplierInvoices];


        filteredSupplierProducts =
            [...supplierProducts];


        renderSummary();

        renderProducts();

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


        alert(
            error.message ||
            "Failed to update supplier."
        );


        const saveButton =
            form.querySelector(
                ".save-btn"
            );


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Changes";

        }

    }

}


// ============================================================
// CLOSE EDIT MODAL
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
                        t =>
                            t.classList.remove(
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
// BUTTONS
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


    /*
     * Supplier statement print.
     */

    const printLink =
        document.getElementById(
            "printLink"
        );


    if (printLink) {

        printLink.addEventListener(
            "click",
            event => {

                event.preventDefault();
  printRealInvoice(
                    invoiceForPrint
                );
                

            }
        );

    }


    /*
     * Fullscreen invoice.
     */

    const fullscreenLink =
        document.getElementById(
            "fullscreenLink"
        );


    if (fullscreenLink) {

        fullscreenLink.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const invoice =
                    document.querySelector(
                        ".invoice-panel"
                    );


                if (
                    invoice &&
                    invoice.requestFullscreen
                ) {

                    invoice.requestFullscreen();

                }

            }
        );

    }

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


    if (!datePill) return;


    const today =
        new Date();


    datePill.textContent =
        today.toLocaleDateString(
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

function formatMoney(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-PK"
    );

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(date) {

    if (!date)
        return "-";


    const d =
        new Date(date);


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
// HTML SECURITY
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#039;"

            })[char]
        );

}


// ============================================================
// ATTRIBUTE SECURITY
// ============================================================

function escapeAttribute(value) {

    return escapeHTML(value);

}
document.getElementById('PrintSummary').addEventListener("click",()=>{
printSupplierSummary();
})
