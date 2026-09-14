
// ============================================================
// FROSTYOPS - DASHBOARD
// Offline-first dashboard
// ============================================================


// ============================================================
// API
// ============================================================

const API_URL =
    window.APP_CONFIG.API;


// ============================================================
// ADMIN USER
// ============================================================

let adminUser = null;


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// LOCAL USER
// ============================================================

function getLocalStorageUser() {

    const user =
        localStorage.getItem(
            "user"
        );


    if (!user) {

        window.location.href =
            "login.html";

        return null;

    }


    try {

        return JSON.parse(
            user
        );

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
        document.getElementById(
            "admin"
        );


    if (adminElement) {

        adminElement.textContent =
            adminUser.email || "";

    }

}


// ============================================================
// ELEMENTS
// ============================================================

const totalProductsElement =
    document.getElementById(
        "totalProducts"
    );


const totalStocksElement =
    document.getElementById(
        "totalStocks"
    );


const totalSalesmenElement =
    document.getElementById(
        "totalSalesmen"
    );


const todayIssuedElement =
    document.getElementById(
        "todayIssued"
    );


const todaySalesValueElement =
    document.getElementById(
        "todaySalesValue"
    );


const stockTableBody =
    document.getElementById(
        "Values"
    );


const invoiceTableBody =
    document.getElementById(
        "Values2"
    );


const salesmenList =
    document.getElementById(
        "salesmenList"
    );


// ============================================================
// DASHBOARD STATE
// ============================================================

let dashboardInvoices = [];

let dashboardSalesmen = [];

let dashboardProducts = [];

let activeAnalyticsPeriod =
    "weekly";


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0";

    }


    return number.toLocaleString(
        "en-PK"
    );

}


// ============================================================
// FORMAT COMPACT MONEY
// ============================================================

function formatCompactMoney(
    value
) {

    const number =
        Number(
            value || 0
        );


    if (
        number >=
        1000000
    ) {

        return (
            number /
            1000000
        ).toFixed(1) +
        "M";

    }


    if (
        number >=
        1000
    ) {

        return (
            number /
            1000
        ).toFixed(1) +
        "K";

    }


    return Math.round(
        number
    ).toLocaleString(
        "en-PK"
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(
            dateValue
        );


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


// ============================================================
// CURRENT DATE
// ============================================================

function showCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    if (!element) {

        return;

    }


    const today =
        new Date();


    element.textContent =
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
// CHECK TODAY
// ============================================================

function isToday(
    dateValue
) {

    if (!dateValue) {

        return false;

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;

    }


    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );

}


// ============================================================
// INVOICE SALES VALUE
// ============================================================

function getInvoiceSalesValue(
    invoice
) {

    const value =
        Number(
            invoice?.netTotal ??
            invoice?.subtotal ??
            invoice?.amount ??
            0
        );


    return Number.isFinite(
        value
    )
        ? value
        : 0;

}


// ============================================================
// INVOICE NET UNITS
// ============================================================

function getInvoiceNetUnits(
    invoice
) {

    const items =
        Array.isArray(
            invoice?.items
        )
            ? invoice.items
            : [];


    return items.reduce(
        (
            total,
            item
        ) => {

            const quantity =
                Number(
                    item?.quantity
                ) || 0;


            const returned =
                Number(
                    item?.returnQuantity ??
                    item?.returnedQuantity ??
                    0
                ) || 0;


            return (
                total +
                Math.max(
                    quantity -
                    returned,
                    0
                )
            );

        },
        0
    );

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        console.log(
            "Loading dashboard..."
        );


        // =====================================================
        // SYNC INVOICES
        // =====================================================

       if (navigator.onLine) {

        await initialDatabaseSync();

        await processSyncQueue();

        await syncInvoicesToOfflineDB();
    }


        // =====================================================
        // READ LOCAL DATA
        // =====================================================

        const [
            products,
            salesmen,
            invoices
        ] =
            await Promise.all([

                getAllFromOfflineDB(
                    "products"
                ),

                getAllFromOfflineDB(
                    "salesmen"
                ),

                getAllFromOfflineDB(
                    "invoices"
                )

            ]);


        dashboardProducts =
            Array.isArray(
                products
            )
                ? products
                : [];


        dashboardSalesmen =
            Array.isArray(
                salesmen
            )
                ? salesmen
                : [];


        dashboardInvoices =
            (
                Array.isArray(
                    invoices
                )
                    ? invoices
                    : []
            )
                .filter(
                    invoice =>
                        String(
                            invoice?.type ||
                            ""
                        ).toLowerCase() ===
                        "salesman"
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const dateA =
                            new Date(
                                a?.date
                            ).getTime();


                        const dateB =
                            new Date(
                                b?.date
                            ).getTime();


                        const safeDateA =
                            Number.isFinite(
                                dateA
                            )
                                ? dateA
                                : 0;


                        const safeDateB =
                            Number.isFinite(
                                dateB
                            )
                                ? dateB
                                : 0;


                        const dateDifference =
                            safeDateB -
                            safeDateA;


                        if (
                            dateDifference !==
                            0
                        ) {

                            return dateDifference;

                        }


                        return (
                            Number(
                                b?.id
                            ) -
                            Number(
                                a?.id
                            )
                        );

                    }
                );


        console.log(
            "Dashboard products:",
            dashboardProducts
        );


        console.log(
            "Dashboard salesmen:",
            dashboardSalesmen
        );


        console.log(
            "Dashboard salesman invoices:",
            dashboardInvoices
        );


        // =====================================================
        // STATS
        // =====================================================

        renderStats(
            calculateStats(
                dashboardProducts,
                dashboardSalesmen,
                dashboardInvoices
            )
        );


        // =====================================================
        // STOCK
        // =====================================================

        renderStockOverview(
            buildStockOverview(
                dashboardProducts
            )
        );


        // =====================================================
        // RECENT INVOICES
        // =====================================================

        renderRecentInvoices(
            buildRecentInvoices(
                dashboardInvoices,
                dashboardSalesmen
            )
        );


        // =====================================================
        // TOP SALESMEN
        // =====================================================

        renderTopSalesmen(
            buildTopSalesmen(
                dashboardInvoices,
                dashboardSalesmen
            )
        );


        // =====================================================
        // ANALYTICS
        // =====================================================

        renderSalesAnalytics(
            activeAnalyticsPeriod
        );

    }
    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        renderStats({

            totalProducts:
                0,

            totalStocks:
                0,

            totalSalesmen:
                0,

            todayIssued:
                0,

            todaySalesValue:
                0

        });


        if (stockTableBody) {

            stockTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="text-align:center"
                    >
                        Failed to load stock data
                    </td>

                </tr>

            `;

        }


        if (invoiceTableBody) {

            invoiceTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="text-align:center"
                    >
                        Failed to load invoices
                    </td>

                </tr>

            `;

        }


        if (salesmenList) {

            salesmenList.innerHTML = `

                <div
                    style="
                        text-align:center;
                        padding:20px;
                    "
                >
                    Failed to load sales data
                </div>

            `;

        }


        renderSalesAnalytics(
            activeAnalyticsPeriod
        );

    }

}


// ============================================================
// CALCULATE DASHBOARD STATS
// ============================================================

function calculateStats(
    products,
    salesmen,
    invoices
) {

    const safeProducts =
        Array.isArray(
            products
        )
            ? products
            : [];


    const safeSalesmen =
        Array.isArray(
            salesmen
        )
            ? salesmen
            : [];


    const safeInvoices =
        Array.isArray(
            invoices
        )
            ? invoices
            : [];


    const totalProducts =
        safeProducts.length;


    const totalStocks =
        safeProducts.reduce(
            (
                total,
                product
            ) => {

                const stock =
                    Number(
                        product?.stock ??
                        product?.qunatity ??
                        product?.quantity ??
                        0
                    ) || 0;


                return (
                    total +
                    stock
                );

            },
            0
        );


    const totalSalesmen =
        safeSalesmen.length;


    const todayInvoices =
        safeInvoices.filter(
            invoice =>
                isToday(
                    invoice?.date
                )
        );


    const todayIssued =
        todayInvoices.reduce(
            (
                total,
                invoice
            ) => {

                return (
                    total +
                    getInvoiceNetUnits(
                        invoice
                    )
                );

            },
            0
        );


    const todaySalesValue =
        todayInvoices.reduce(
            (
                total,
                invoice
            ) =>
                total +
                getInvoiceSalesValue(
                    invoice
                ),
            0
        );


    return {

        totalProducts,

        totalStocks,

        totalSalesmen,

        todayIssued,

        todaySalesValue

    };

}


// ============================================================
// STOCK OVERVIEW DATA
// ============================================================

function buildStockOverview(
    products
) {

    const safeProducts =
        Array.isArray(
            products
        )
            ? products
            : [];


    return safeProducts
        .map(
            product => {

                const stock =
                    Number(
                        product?.stock ??
                        product?.qunatity ??
                        product?.quantity ??
                        0
                    ) || 0;


                const salePrice =
                    Number(
                        product?.salePrice ??
                        product?.price ??
                        0
                    ) || 0;


                return {

                    productName:
                        product?.productName ??
                        product?.name ??
                        "Unknown",

                    brand:
                        product?.brand ??
                        product?.company ??
                        product?.category ??
                        "",

                    stock,

                    salePrice,

                    totalValue:
                        stock *
                        salePrice

                };

            }
        )
        .sort(
            (
                a,
                b
            ) =>
                b.stock -
                a.stock
        );

}


// ============================================================
// RECENT INVOICES DATA
// ============================================================

function buildRecentInvoices(
    invoices,
    salesmen
) {

    const safeInvoices =
        Array.isArray(
            invoices
        )
            ? invoices
            : [];


    const safeSalesmen =
        Array.isArray(
            salesmen
        )
            ? salesmen
            : [];


    return safeInvoices
        .slice(
            0,
            5
        )
        .map(
            invoice => {

                const salesman =
                    safeSalesmen.find(
                        item =>
                            String(
                                item?.id
                            ) ===
                            String(
                                invoice?.partyId
                            )
                    );


                return {

                    invoiceNo:
                        `INV-${
                            invoice?.id ??
                            "-"
                        }`,

                    salesman:
                        invoice?.partyName ||
                        salesman?.name ||
                        "Unknown Salesman",

                    date:
                        invoice?.date,

                    total:
                        getInvoiceSalesValue(
                            invoice
                        ),

                    id:
                        invoice?.id

                };

            }
        );

}


// ============================================================
// TOP SALESMEN DATA
// ============================================================
//
// Ranking source:
// salesman invoices in IndexedDB.
//
// Ranking:
// 1. Total sales value
// 2. Net units issued
// 3. Salesman name
//
// ============================================================

function buildTopSalesmen(
    invoices,
    salesmen
) {

    const safeInvoices =
        Array.isArray(
            invoices
        )
            ? invoices
            : [];


    const safeSalesmen =
        Array.isArray(
            salesmen
        )
            ? salesmen
            : [];


    /*
     * Master salesman lookup.
     */
    const salesmanMap =
        new Map();


    safeSalesmen.forEach(
        salesman => {

            const id =
                salesman?.id ??
                salesman?.salesman_id;


            if (
                id !== null &&
                id !== undefined
            ) {

                salesmanMap.set(
                    String(
                        id
                    ),
                    salesman
                );

            }

        }
    );


    /*
     * Aggregate invoice performance.
     */
    const totals =
        new Map();


    safeInvoices
        .filter(
            invoice =>
                String(
                    invoice?.type ||
                    ""
                ).toLowerCase() ===
                "salesman"
        )
        .forEach(
            invoice => {

                const partyId =
                    invoice?.partyId ??
                    invoice?.salesmanId ??
                    invoice?.salesman_id ??
                    null;


                const fallbackName =
                    String(
                        invoice?.partyName ??
                        invoice?.salesmanName ??
                        invoice?.salesman ??
                        "Unknown Salesman"
                    ).trim();


                /*
                 * Prefer partyId.
                 * Fall back to name for legacy invoices.
                 */
                const key =
                    partyId !== null &&
                    partyId !== undefined
                        ? `id:${String(
                            partyId
                        )}`
                        : `name:${fallbackName
                            .toLowerCase()}`;


                if (
                    !totals.has(
                        key
                    )
                ) {

                    totals.set(
                        key,
                        {

                            id:
                                partyId,

                            name:
                                fallbackName ||
                                "Unknown Salesman",

                            total:
                                0,

                            invoiceCount:
                                0,

                            unitsIssued:
                                0

                        }
                    );

                }


                const performance =
                    totals.get(
                        key
                    );


                /*
                 * Sales value
                 */
                performance.total +=
                    getInvoiceSalesValue(
                        invoice
                    );


                /*
                 * Number of salesman invoices
                 */
                performance.invoiceCount +=
                    1;


                /*
                 * Net units after returns
                 */
                performance.unitsIssued +=
                    getInvoiceNetUnits(
                        invoice
                    );

            }
        );


    /*
     * Convert Map to array.
     */
    const entries =
        Array.from(
            totals.values()
        )
        .map(
            entry => {

                const salesman =
                    entry.id !== null &&
                    entry.id !== undefined
                        ? salesmanMap.get(
                            String(
                                entry.id
                            )
                        )
                        : null;


                return {

                    id:
                        entry.id,

                    name:
                        salesman?.name ||
                        entry.name ||
                        "Unknown Salesman",

                    total:
                        Number(
                            entry.total
                        ) || 0,

                    invoiceCount:
                        entry.invoiceCount,

                    unitsIssued:
                        entry.unitsIssued

                };

            }
        )
        .sort(
            (
                a,
                b
            ) => {

                /*
                 * Highest sales value first.
                 */
                if (
                    b.total !==
                    a.total
                ) {

                    return (
                        b.total -
                        a.total
                    );

                }


                /*
                 * If sales are equal,
                 * highest units first.
                 */
                if (
                    b.unitsIssued !==
                    a.unitsIssued
                ) {

                    return (
                        b.unitsIssued -
                        a.unitsIssued
                    );

                }


                /*
                 * Final deterministic tie-breaker.
                 */
                return a.name.localeCompare(
                    b.name
                );

            }
        )
        .slice(
            0,
            5
        );


    /*
     * Highest performer is the basis
     * for the progress bars.
     */
    const highestTotal =
        entries[0]?.total ||
        0;


    return entries.map(
        (
            item,
            index
        ) => {

            const percentage =
                highestTotal > 0
                    ? (
                        item.total /
                        highestTotal
                    ) *
                    100
                    : 0;


            return {

                ...item,

                rank:
                    index + 1,

                percentage:
                    Math.max(
                        percentage,
                        3
                    )

            };

        }
    );

}


// ============================================================
// RENDER STATS
// ============================================================

function renderStats(
    stats
) {

    if (!stats) {

        return;

    }


    if (totalProductsElement) {

        totalProductsElement.textContent =
            formatMoney(
                stats.totalProducts
            );

    }


    if (totalStocksElement) {

        totalStocksElement.textContent =
            formatMoney(
                stats.totalStocks
            );

    }


    if (totalSalesmenElement) {

        totalSalesmenElement.textContent =
            formatMoney(
                stats.totalSalesmen
            );

    }


    if (todayIssuedElement) {

        todayIssuedElement.textContent =
            formatMoney(
                stats.todayIssued
            );

    }


    if (todaySalesValueElement) {

        todaySalesValueElement.textContent =
            `PKR ${formatMoney(
                stats.todaySalesValue
            )}`;

    }

}


// ============================================================
// RENDER STOCK
// ============================================================

function renderStockOverview(
    products
) {

    if (!stockTableBody) {

        return;

    }


    stockTableBody.innerHTML =
        "";


    if (
        !products ||
        products.length ===
        0
    ) {

        stockTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center"
                >
                    No products found
                </td>

            </tr>

        `;

        return;

    }


    products
        .slice(
            0,
            5
        )
        .forEach(
            product => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            product.productName
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.brand
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            product.stock
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            product.salePrice
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            product.totalValue
                        )}
                    </td>

                `;


                stockTableBody.appendChild(
                    row
                );

            }
        );

}


// ============================================================
// RENDER RECENT INVOICES
// ============================================================

function renderRecentInvoices(
    invoices
) {

    if (!invoiceTableBody) {

        return;

    }


    invoiceTableBody.innerHTML =
        "";


    if (
        !invoices ||
        invoices.length ===
        0
    ) {

        invoiceTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center"
                >
                    No recent invoices
                </td>

            </tr>

        `;

        return;

    }


    invoices.forEach(
        invoice => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        String(
                            invoice.invoiceNo
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        String(
                            invoice.salesman
                        )
                    )}
                </td>

                <td>
                    ${formatDate(
                        invoice.date
                    )}
                </td>

                <td>
                    ${formatMoney(
                        invoice.total
                    )}
                </td>

             

            `;


            invoiceTableBody.appendChild(
                row
            );

        }
    );

}


// ============================================================
// RENDER TOP SALESMEN
// ============================================================

function renderTopSalesmen(
    salesmen
) {

    if (!salesmenList) {

        console.warn(
            "Top Salesmen element #salesmenList not found."
        );

        return;

    }


    salesmenList.innerHTML =
        "";


    if (
        !Array.isArray(
            salesmen
        ) ||
        salesmen.length ===
        0
    ) {

        salesmenList.innerHTML = `

            <div
                class="top-salesmen-empty"
            >

                <div
                    class="top-salesmen-empty-icon"
                >
                    <i
                        class="fas fa-chart-line"
                    ></i>
                </div>

                <h4>
                    No sales recorded yet
                </h4>

                <p>
                    Salesman performance will appear here
                    once issue invoices are generated.
                </p>

            </div>

        `;

        return;

    }


    salesmen.forEach(
        (
            salesman,
            index
        ) => {

            const rank =
                salesman.rank ??
                index + 1;


            const name =
                salesman.name ||
                "Unknown Salesman";


            const initials =
                String(
                    name
                )
                    .trim()
                    .split(
                        /\s+/
                    )
                    .slice(
                        0,
                        2
                    )
                    .map(
                        part =>
                            part
                                .charAt(0)
                                .toUpperCase()
                    )
                    .join("") ||
                "U";


            const total =
                Number(
                    salesman.total
                ) || 0;


            const unitsIssued =
                Number(
                    salesman.unitsIssued
                ) || 0;


            const invoiceCount =
                Number(
                    salesman.invoiceCount
                ) || 0;


            const percentage =
                Math.min(
                    Math.max(
                        Number(
                            salesman.percentage
                        ) || 3,
                        3
                    ),
                    100
                );


            let rankClass =
                "";


            if (
                rank === 1
            ) {

                rankClass =
                    "top-salesman-gold";

            }
            else if (
                rank === 2
            ) {

                rankClass =
                    "top-salesman-silver";

            }
            else if (
                rank === 3
            ) {

                rankClass =
                    "top-salesman-bronze";

            }


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "top-salesman-row";


            row.innerHTML = `

                <div
                    class="
                        top-salesman-rank
                        ${rankClass}
                    "
                >
                    ${rank}
                </div>


                <div
                    class="top-salesman-avatar"
                >
                    ${escapeHTML(
                        initials
                    )}
                </div>


                <div
                    class="top-salesman-main"
                >

                    <div
                        class="top-salesman-header"
                    >

                        <div
                            class="top-salesman-name"
                        >
                            ${escapeHTML(
                                name
                            )}
                        </div>


                        <div
                            class="top-salesman-value"
                        >
                            PKR
                            ${formatMoney(
                                total
                            )}
                        </div>

                    </div>


                    <div
                        class="top-salesman-meta"
                    >

                        <span>

                            <i
                                class="fas fa-box"
                            ></i>

                            ${formatMoney(
                                unitsIssued
                            )}
                            units

                        </span>


                        <span>

                            <i
                                class="fas fa-file-invoice"
                            ></i>

                            ${formatMoney(
                                invoiceCount
                            )}
                            invoices

                        </span>

                    </div>


                    <div
                        class="top-salesman-progress"
                    >

                        <div
                            class="top-salesman-progress-fill"
                            style="
                                width:${percentage}%
                            "
                        ></div>

                    </div>

                </div>

            `;


            salesmenList.appendChild(
                row
            );

        }
    );

}


// ============================================================
// SALES ANALYTICS
// ============================================================

function renderSalesAnalytics(
    period
) {

    activeAnalyticsPeriod =
        period;


    const periodData =
        getAnalyticsPeriodData(
            period
        );


    updateAnalyticsSummary(
        periodData
    );


    renderSalesChart(
        periodData
    );

}


// ============================================================
// ANALYTICS PERIOD DATA
// ============================================================

function getAnalyticsPeriodData(
    period
) {

    if (
        period ===
        "monthly"
    ) {

        return buildMonthlyAnalytics();

    }


    return buildWeeklyAnalytics();

}


// ============================================================
// WEEKLY ANALYTICS
// ============================================================
//
// Current period:
// last 7 calendar days.
//
// Previous period:
// 7 calendar days immediately before that.
//
// ============================================================

function buildWeeklyAnalytics() {

    const today =
        startOfDay(
            new Date()
        );


    const currentStart =
        new Date(
            today
        );


    currentStart.setDate(
        currentStart.getDate() -
        6
    );


    const previousStart =
        new Date(
            currentStart
        );


    previousStart.setDate(
        previousStart.getDate() -
        7
    );


    const previousEnd =
        new Date(
            currentStart
        );


    previousEnd.setDate(
        previousEnd.getDate() -
        1
    );


    const currentPoints = [];

    const previousPoints = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const currentDate =
            new Date(
                currentStart
            );


        currentDate.setDate(
            currentDate.getDate() +
            i
        );


        const previousDate =
            new Date(
                previousStart
            );


        previousDate.setDate(
            previousDate.getDate() +
            i
        );


        currentPoints.push({

            label:
                currentDate.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                ),

            fullLabel:
                currentDate.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "long",
                        day: "2-digit",
                        month: "short"
                    }
                ),

            value:
                getSalesForDate(
                    currentDate
                ),

            date:
                currentDate

        });


        previousPoints.push({

            label:
                previousDate.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                ),

            fullLabel:
                previousDate.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "long",
                        day: "2-digit",
                        month: "short"
                    }
                ),

            value:
                getSalesForDate(
                    previousDate
                ),

            date:
                previousDate

        });

    }


    const currentTotal =
        currentPoints.reduce(
            (
                total,
                point
            ) =>
                total +
                point.value,
            0
        );


    const previousTotal =
        previousPoints.reduce(
            (
                total,
                point
            ) =>
                total +
                point.value,
            0
        );


    return {

        period:
            "weekly",

        subtitle:
            "Revenue trend for the current week",

        points:
            currentPoints,

        comparisonPoints:
            previousPoints,

        currentTotal,

        previousTotal,

        currentLabel:
            "Current Week",

        previousLabel:
            "Previous Week"

    };

}


// ============================================================
// MONTHLY ANALYTICS
// ============================================================
//
// Current period:
// current calendar month.
//
// Previous period:
// previous calendar month.
//
// Chart:
// last 6 months.
//
// ============================================================

function buildMonthlyAnalytics() {

    const now =
        new Date();


    const currentMonthStart =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );


    const previousMonthStart =
        new Date(
            now.getFullYear(),
            now.getMonth() -
            1,
            1
        );


    const nextMonthStart =
        new Date(
            now.getFullYear(),
            now.getMonth() +
            1,
            1
        );


    const currentTotal =
        getSalesBetween(
            currentMonthStart,
            nextMonthStart
        );


    const previousTotal =
        getSalesBetween(
            previousMonthStart,
            currentMonthStart
        );


    const points = [];


    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const start =
            new Date(
                now.getFullYear(),
                now.getMonth() -
                i,
                1
            );


        const end =
            new Date(
                now.getFullYear(),
                now.getMonth() -
                i +
                1,
                1
            );


        points.push({

            label:
                start.toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                ),

            fullLabel:
                start.toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        year: "numeric"
                    }
                ),

            value:
                getSalesBetween(
                    start,
                    end
                ),

            date:
                start

        });

    }


    return {

        period:
            "monthly",

        subtitle:
            "Revenue trend for the last six months",

        points,

        comparisonPoints:
            [],

        currentTotal,

        previousTotal,

        currentLabel:
            "Current Month",

        previousLabel:
            "Previous Month"

    };

}


// ============================================================
// START OF DAY
// ============================================================

function startOfDay(
    date
) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


// ============================================================
// GET SALES FOR DATE
// ============================================================

function getSalesForDate(
    date
) {

    const start =
        startOfDay(
            date
        );


    const end =
        new Date(
            start
        );


    end.setDate(
        end.getDate() +
        1
    );


    return getSalesBetween(
        start,
        end
    );

}


// ============================================================
// GET SALES BETWEEN DATES
// ============================================================

function getSalesBetween(
    start,
    end
) {

    return dashboardInvoices.reduce(
        (
            total,
            invoice
        ) => {

            const invoiceDate =
                new Date(
                    invoice?.date
                );


            if (
                Number.isNaN(
                    invoiceDate.getTime()
                )
            ) {

                return total;

            }


            if (
                invoiceDate >= start &&
                invoiceDate < end
            ) {

                return (
                    total +
                    getInvoiceSalesValue(
                        invoice
                    )
                );

            }


            return total;

        },
        0
    );

}


// ============================================================
// ANALYTICS SUMMARY
// ============================================================

function updateAnalyticsSummary(
    data
) {

    const currentElement =
        document.getElementById(
            "analyticsCurrent"
        );


    const previousElement =
        document.getElementById(
            "analyticsPrevious"
        );


    const growthElement =
        document.getElementById(
            "analyticsGrowth"
        );


    const growthLabel =
        document.getElementById(
            "analyticsGrowthLabel"
        );


    const currentSub =
        document.getElementById(
            "analyticsCurrentSub"
        );


    const subtitle =
        document.getElementById(
            "analyticsSubtitle"
        );


    if (currentElement) {

        currentElement.textContent =
            `PKR ${formatMoney(
                data.currentTotal
            )}`;

    }


    if (previousElement) {

        previousElement.textContent =
            `PKR ${formatMoney(
                data.previousTotal
            )}`;

    }


    if (subtitle) {

        subtitle.textContent =
            data.subtitle;

    }


    if (currentSub) {

        currentSub.textContent =
            data.currentLabel;

    }


    const previous =
        Number(
            data.previousTotal
        ) || 0;


    const current =
        Number(
            data.currentTotal
        ) || 0;


    let growth =
        0;


    if (
        previous > 0
    ) {

        growth =
            (
                (
                    current -
                    previous
                ) /
                previous
            ) *
            100;

    }
    else if (
        current > 0
    ) {

        growth =
            100;

    }


    if (growthElement) {

        growthElement.textContent =
            `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;

    }


    if (growthLabel) {

        growthLabel.className =
            "analytics-mini-growth";


        if (
            growth > 0
        ) {

            growthLabel.classList.add(
                "growth-positive"
            );


            growthLabel.textContent =
                "Growing vs previous period";

        }
        else if (
            growth < 0
        ) {

            growthLabel.classList.add(
                "growth-negative"
            );


            growthLabel.textContent =
                "Down vs previous period";

        }
        else {

            growthLabel.classList.add(
                "growth-neutral"
            );


            growthLabel.textContent =
                "No change";

        }

    }

}


// ============================================================
// BUILD SVG CHART
// ============================================================

function renderSalesChart(
    data
) {

    const svg =
        document.getElementById(
            "salesChart"
        );


    const empty =
        document.getElementById(
            "analyticsEmpty"
        );


    if (!svg) {

        return;

    }


    svg.innerHTML =
        "";


    if (
        !data.points ||
        data.points.length ===
        0
    ) {

        svg.style.display =
            "none";


        if (empty) {

            empty.style.display =
                "flex";

        }


        return;

    }


    svg.style.display =
        "block";


    if (empty) {

        empty.style.display =
            "none";

    }


    const width =
        850;


    const height =
        200;


    const padding = {

        left:
            62,

        right:
            28,

        top:
            26,

        bottom:
            44

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    const values =
        data.points.map(
            point =>
                Number(
                    point.value
                ) || 0
        );


    const maximum =
        Math.max(
            ...values,
            0
        );


    const safeMaximum =
        maximum > 0
            ? maximum
            : 100;


    const roundedMaximum =
        getNiceMaximum(
            safeMaximum
        );


    // ========================================================
    // GRID
    // ========================================================

    const gridGroup =
        svgElement(
            "g"
        );


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding.top +
            (
                chartHeight *
                i /
                4
            );


        const line =
            svgElement(
                "line",
                {
                    x1:
                        padding.left,

                    y1:
                        y,

                    x2:
                        width -
                        padding.right,

                    y2:
                        y,

                    stroke:
                        "#eceef3",

                    "stroke-width":
                        1
                }
            );


        gridGroup.appendChild(
            line
        );


        const value =
            roundedMaximum -
            (
                roundedMaximum *
                i /
                4
            );


        const label =
            svgElement(
                "text",
                {
                    x:
                        padding.left -
                        10,

                    y:
                        y +
                        4,

                    "text-anchor":
                        "end",

                    fill:
                        "#9aa1b2",

                    "font-size":
                        11
                }
            );


        label.textContent =
            formatCompactMoney(
                value
            );


        gridGroup.appendChild(
            label
        );

    }


    svg.appendChild(
        gridGroup
    );


    // ========================================================
    // POINT POSITIONS
    // ========================================================

    const points =
        data.points.map(
            (
                point,
                index
            ) => {

                const x =
                    padding.left +
                    (
                        data.points.length === 1
                            ? chartWidth / 2
                            : (
                                index /
                                (
                                    data.points.length -
                                    1
                                )
                            ) *
                            chartWidth
                    );


                const value =
                    Number(
                        point.value
                    ) || 0;


                const y =
                    padding.top +
                    chartHeight -
                    (
                        value /
                        roundedMaximum
                    ) *
                    chartHeight;


                return {

                    ...point,

                    x,

                    y

                };

            }
        );


    // ========================================================
    // AREA
    // ========================================================

    let linePath =
        "";


    points.forEach(
        (
            point,
            index
        ) => {

            linePath +=
                index === 0
                    ? `M ${point.x} ${point.y}`
                    : ` L ${point.x} ${point.y}`;

        }
    );


    const lastPoint =
        points[
            points.length -
            1
        ];


    const firstPoint =
        points[0];


    const areaPath =
        `${linePath}
         L ${lastPoint.x} ${
             padding.top +
             chartHeight
         }
         L ${firstPoint.x} ${
             padding.top +
             chartHeight
         }
         Z`;


    const defs =
        svgElement(
            "defs"
        );


    const gradient =
        svgElement(
            "linearGradient",
            {
                id:
                    "salesGradient",

                x1:
                    "0",

                y1:
                    "0",

                x2:
                    "0",

                y2:
                    "1"
            }
        );


    gradient.appendChild(
        svgElement(
            "stop",
            {
                offset:
                    "0%",

                "stop-color":
                    "#5b4b8a",

                "stop-opacity":
                    "0.22"
            }
        )
    );


    gradient.appendChild(
        svgElement(
            "stop",
            {
                offset:
                    "100%",

                "stop-color":
                    "#5b4b8a",

                "stop-opacity":
                    "0"
            }
        )
    );


    defs.appendChild(
        gradient
    );


    svg.appendChild(
        defs
    );


    svg.appendChild(
        svgElement(
            "path",
            {
                d:
                    areaPath,

                fill:
                    "url(#salesGradient)"
            }
        )
    );


    // ========================================================
    // LINE
    // ========================================================

    svg.appendChild(
        svgElement(
            "path",
            {
                d:
                    linePath,

                fill:
                    "none",

                stroke:
                    "#5b4b8a",

                "stroke-width":
                    3,

                "stroke-linecap":
                    "round",

                "stroke-linejoin":
                    "round"
            }
        )
    );


    // ========================================================
    // X LABELS
    // ========================================================

    points.forEach(
        point => {

            const label =
                svgElement(
                    "text",
                    {
                        x:
                            point.x,

                        y:
                            height -
                            14,

                        "text-anchor":
                            "middle",

                        fill:
                            "#8f96a7",

                        "font-size":
                            11
                    }
                );


            label.textContent =
                point.label;


            svg.appendChild(
                label
            );

        }
    );


    // ========================================================
    // POINTS
    // ========================================================

    points.forEach(
        (
            point,
            index
        ) => {

            const circle =
                svgElement(
                    "circle",
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            5,

                        fill:
                            "#ffffff",

                        stroke:
                            "#5b4b8a",

                        "stroke-width":
                            3,

                        "data-index":
                            index
                    }
                );


            circle.style.cursor =
                "pointer";


            circle.addEventListener(
                "mouseenter",
                event => {

                    showChartTooltip(
                        event,
                        point
                    );

                }
            );


            circle.addEventListener(
                "mouseleave",
                hideChartTooltip
            );


            svg.appendChild(
                circle
            );

        }
    );


    // ========================================================
    // CURRENT VALUE LABEL
    // ========================================================

    if (
        points.length > 0
    ) {

        const last =
            points[
                points.length -
                1
            ];


        const label =
            svgElement(
                "text",
                {
                    x:
                        last.x,

                    y:
                        Math.max(
                            last.y -
                            14,
                            16
                        ),

                    "text-anchor":
                        "middle",

                    fill:
                        "#5b4b8a",

                    "font-size":
                        12,

                    "font-weight":
                        700
                }
            );


        label.textContent =
            `PKR ${formatCompactMoney(
                last.value
            )}`;


        svg.appendChild(
            label
        );

    }

}


// ============================================================
// SVG ELEMENT HELPER
// ============================================================

function svgElement(
    tag,
    attributes = {}
) {

    const element =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );


    Object.entries(
        attributes
    )
    .forEach(
        (
            [
                key,
                value
            ]
        ) => {

            element.setAttribute(
                key,
                value
            );

        }
    );


    return element;

}


// ============================================================
// NICE CHART MAXIMUM
// ============================================================

function getNiceMaximum(
    value
) {

    if (
        value <=
        1000
    ) {

        return Math.ceil(
            value /
            250
        ) *
        250;

    }


    if (
        value <=
        10000
    ) {

        return Math.ceil(
            value /
            1000
        ) *
        1000;

    }


    if (
        value <=
        100000
    ) {

        return Math.ceil(
            value /
            10000
        ) *
        10000;

    }


    return Math.ceil(
        value /
        100000
    ) *
    100000;

}


// ============================================================
// CHART TOOLTIP
// ============================================================

function showChartTooltip(
    event,
    point
) {

    const tooltip =
        document.getElementById(
            "chartTooltip"
        );


    if (!tooltip) {

        return;

    }


    tooltip.innerHTML = `

        <strong>
            ${escapeHTML(
                point.fullLabel
            )}
        </strong>

        <br>

        PKR ${formatMoney(
            point.value
        )}

    `;


    tooltip.classList.add(
        "show"
    );


    tooltip.style.left =
        `${event.clientX + 14}px`;


    tooltip.style.top =
        `${event.clientY - 50}px`;

}


function hideChartTooltip() {

    const tooltip =
        document.getElementById(
            "chartTooltip"
        );


    if (tooltip) {

        tooltip.classList.remove(
            "show"
        );

    }

}


// ============================================================
// ANALYTICS PERIOD BUTTONS
// ============================================================

document
    .querySelectorAll(
        ".period-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".period-btn"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    activeAnalyticsPeriod =
                        button.dataset.period ||
                        "weekly";


                    renderSalesAnalytics(
                        activeAnalyticsPeriod
                    );

                }
            );

        }
    );


// ============================================================
// VIEW ALL STOCK
// ============================================================

document
    .getElementById(
        "viewAllStock"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "stockInventory.html";

        }
    );


// ============================================================
// VIEW ALL INVOICES
// ============================================================

document
    .getElementById(
        "viewAllInvoices"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "issueStocks.html";

        }
    );


// ============================================================
// VIEW ALL SALESMEN
// ============================================================

document
    .getElementById(
        "viewAllSalesmen"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "salesmen.html";

        }
    );


// ============================================================
// VIEW INVOICE
// ============================================================

invoiceTableBody
    ?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".view-invoice"
                );


            if (!button) {

                return;

            }


            const id =
                Number(
                    button.dataset.id
                );


            if (
                Number.isFinite(
                    id
                )
            ) {

                window.location.href =
                    `invoice.html?id=${id}`;

            }

        }
    );


// ============================================================
// MOBILE SIDEBAR
// ============================================================

const sidebar =
    document.getElementById(
        "sidebar"
    );


const overlay =
    document.getElementById(
        "overlay"
    );


const hamburgerBtn =
    document.getElementById(
        "hamburgerBtn"
    );


function openSidebar() {

    sidebar?.classList.add(
        "open"
    );


    overlay?.classList.add(
        "show"
    );

}


function closeSidebar() {

    sidebar?.classList.remove(
        "open"
    );


    overlay?.classList.remove(
        "show"
    );

}


hamburgerBtn?.addEventListener(
    "click",
    () => {

        if (
            sidebar?.classList.contains(
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


overlay?.addEventListener(
    "click",
    closeSidebar
);


// ============================================================
// ONLINE EVENT
// ============================================================
//
// After reconnect:
//
// 1. send pending offline operations
// 2. synchronize invoices
// 3. rebuild dashboard
//
// ============================================================

let dashboardOnlineSyncRunning =
    false;


window.addEventListener(
    "online",
    async () => {

        if (
            dashboardOnlineSyncRunning
        ) {

            return;

        }


        dashboardOnlineSyncRunning =
            true;


        try {

            console.log(
                "Internet restored. Refreshing dashboard..."
            );


            await processSyncQueue();


            await syncInvoicesToOfflineDB();


            await loadDashboard();

        }
        catch (error) {

            console.error(
                "Dashboard online refresh failed:",
                error
            );

        }
        finally {

            dashboardOnlineSyncRunning =
                false;

        }

    }
);


// ============================================================
// START
// ============================================================

showCurrentDate();

loadDashboard();

