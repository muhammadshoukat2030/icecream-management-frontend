// ============================================================
// DASHBOARD
// ============================================================

const API_URL ="https://ice-cream-management.vercel.app";
// ============================================================
// ELEMENTS
// ============================================================
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
const totalProductsElement =
    document.getElementById("totalProducts");

const totalStocksElement =
    document.getElementById("totalStocks");

const totalSalesmenElement =
    document.getElementById("totalSalesmen");

const todayIssuedElement =
    document.getElementById("todayIssued");

const todaySalesValueElement =
    document.getElementById("todaySalesValue");


const stockTableBody =
    document.getElementById("Values");

const invoiceTableBody =
    document.getElementById("Values2");

const salesmenList =
    document.getElementById("salesmenList");


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

    return Number(value || 0).toLocaleString("en-PK");

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-GB", {

        day: "2-digit",
        month: "short",
        year: "numeric"

    });

}


// ============================================================
// CURRENT DATE
// ============================================================

function showCurrentDate() {

    const element =
        document.getElementById("currentDate");

    const today = new Date();

    element.textContent =
        today.toLocaleDateString("en-GB", {

            day: "2-digit",
            month: "long",
            year: "numeric"

        });

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        console.log("Loading dashboard...");


        const response =
            await fetch(`${API_URL}/dashboard`,
                 {
        credentials: 'include'
    }
            );
            
 if (response.status === 401) {
        window.location.href = 'login.html';
        return;
    }

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log("Dashboard data:", data);


        // Render everything

        renderStats(data.stats);

        renderStockOverview(
            data.stockOverview
        );

        renderRecentInvoices(
            data.recentInvoices
        );

        renderTopSalesmen(
            data.topSalesmen
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        // Show zero values

        renderStats({

            totalProducts: 0,
            totalStocks: 0,
            totalSalesmen: 0,
            todayIssued: 0,
            todaySalesValue: 0

        });


        stockTableBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center">
                    Failed to load stock data
                </td>
            </tr>
        `;


        invoiceTableBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center">
                    Failed to load invoices
                </td>
            </tr>
        `;

    }

}


// ============================================================
// RENDER STAT CARDS
// ============================================================

function renderStats(stats) {


    totalProductsElement.textContent =
        formatMoney(stats.totalProducts);


    totalStocksElement.textContent =
        formatMoney(stats.totalStocks);


    totalSalesmenElement.textContent =
        formatMoney(stats.totalSalesmen);


    todayIssuedElement.textContent =
        formatMoney(stats.todayIssued);


    todaySalesValueElement.textContent =
        formatMoney(stats.todaySalesValue);

}


// ============================================================
// STOCK OVERVIEW
// ============================================================

function renderStockOverview(products) {


    stockTableBody.innerHTML = "";


    if (!products || products.length === 0) {

        stockTableBody.innerHTML = `
            <tr>

                <td colspan="5"
                    style="text-align:center">

                    No products found

                </td>

            </tr>
        `;

        return;

    }


    // Show only first 5

    products
        .slice(0, 5)
        .forEach(product => {


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(product.productName)}
                </td>

                <td>
                    ${escapeHTML(product.brand)}
                </td>

                <td>
                    ${formatMoney(product.stock)}
                </td>

                <td>
                    ${formatMoney(product.salePrice)}
                </td>

                <td>
                    ${formatMoney(product.totalValue)}
                </td>

            `;


            stockTableBody.appendChild(row);

        });

}


// ============================================================
// RECENT INVOICES
// ============================================================

function renderRecentInvoices(invoices) {


    invoiceTableBody.innerHTML = "";


    if (!invoices || invoices.length === 0) {

        invoiceTableBody.innerHTML = `
            <tr>

                <td colspan="5"
                    style="text-align:center">

                    No recent invoices

                </td>

            </tr>
        `;

        return;

    }


    invoices
        .slice(0, 5)
        .forEach(invoice => {


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        String(invoice.invoiceNo || "-")
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        String(invoice.salesman || "-")
                    )}
                </td>

                <td>
                    ${formatDate(invoice.date)}
                </td>

                <td>
                    ${formatMoney(invoice.total)}
                </td>

                <td>

                  

                </td>

            `;


            invoiceTableBody.appendChild(row);

        });

}


// ============================================================
// TOP SALESMEN
// ============================================================

function renderTopSalesmen(data) {


    salesmenList.innerHTML = "";


    if (!data || data.length === 0) {

        salesmenList.innerHTML = `

            <div style="
                text-align:center;
                padding:20px;
            ">

                No sales data available

            </div>

        `;

        return;

    }


    data.forEach(item => {


        const row =
            document.createElement("div");


        row.className =
            "salesman-row";


        row.innerHTML = `

            <p class="salesman-name">

                ${escapeHTML(item.name)}

            </p>


            <div class="progress-container">

                <div
                    class="progress-bar"
                    style="width:${item.percentage}%">

                </div>

            </div>

        `;


        salesmenList.appendChild(row);

    });

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ============================================================
// VIEW ALL STOCK
// ============================================================

document
    .getElementById("viewAllStock")
    .addEventListener("click", () => {

        window.location.href =
            "stockInventory.html";

    });


// ============================================================
// VIEW ALL INVOICES
// ============================================================

document
    .getElementById("viewAllInvoices")
    .addEventListener("click", () => {

        // Change this to your invoice page

        window.location.href =
            "issueStocks.html";

    });


// ============================================================
// VIEW ALL SALESMEN
// ============================================================

document
    .getElementById("viewAllSalesmen")
    .addEventListener("click", () => {

        window.location.href =
            "salesmen.html";

    });


// ============================================================
// INVOICE VIEW BUTTON
// ============================================================

invoiceTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(".view-invoice");


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        console.log(
            "View invoice:",
            id
        );


        // You can later redirect to:
        //
        // window.location.href =
        //     `invoice.html?id=${id}`;

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

    sidebar.classList.add("open");

    overlay.classList.add("show");

}


function closeSidebar() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


hamburgerBtn.addEventListener(
    "click",
    () => {

        if (
            sidebar.classList.contains("open")
        ) {

            closeSidebar();

        } else {

            openSidebar();

        }

    }
);


overlay.addEventListener(
    "click",
    closeSidebar
);


// ============================================================
// START
// ============================================================

showCurrentDate();

loadDashboard();