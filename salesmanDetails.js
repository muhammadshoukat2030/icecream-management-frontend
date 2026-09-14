// =========================================================
// FrostyOps - Salesman Details
// Offline-first Salesman Details
// =========================================================


// =========================================================
// GLOBAL API
// =========================================================

const API =
    window.APP_CONFIG.API;


// =========================================================
// ADMIN USER
// =========================================================

let adminUser = null;


try {

    adminUser =
        JSON.parse(
            localStorage.getItem("user")
        );

}
catch (error) {

    console.error(
        "Unable to read local user:",
        error
    );

}


if (!adminUser) {

    window.location.href =
        "login.html";

}
else {

    const adminElement =
        document.getElementById("admin");

    if (adminElement) {

        adminElement.textContent =
            adminUser.email;

    }

}


// =========================================================
// DATE
// =========================================================

const today =
    new Date().toLocaleDateString(
        "en-GB",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );


const datePill =
    document.getElementById("datePill");


if (datePill) {

    datePill.textContent =
        today;

}


// =========================================================
// URL PARAMETERS
// =========================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const salesmanId =
    params.get("id");


if (!salesmanId) {

    alert(
        "Salesman ID not found"
    );

    window.location.href =
        "salesmen.html";

}


// =========================================================
// PAGE STATE
// =========================================================

let selectedInvoice = null;

let currentSalesman = null;

let editingInvoice = null;

let currentSummary = [];


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeSalesmanDetails
);


// =========================================================
// INITIALIZE PAGE
// =========================================================

async function initializeSalesmanDetails() {

    await loadSalesman();

}


// =========================================================
// AUTHENTICATED FETCH HELPER
// =========================================================

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


// =========================================================
// GET RETURN QUANTITY
// =========================================================
//
// Different invoice objects in the project have used:
// returnQuantity
// returnedQuantity
//
// Always normalize both here.
// =========================================================

function getReturnQuantity(
    item
) {

    return Number(
        item?.returnQuantity ??
        item?.returnedQuantity ??
        0
    ) || 0;

}


// =========================================================
// TODAY CHECK
// =========================================================

function isToday(
    dateValue
) {

    if (!dateValue) {
        return false;
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;

    }


    const now =
        new Date();


    return (
        date.getFullYear() ===
        now.getFullYear() &&

        date.getMonth() ===
        now.getMonth() &&

        date.getDate() ===
        now.getDate()
    );

}


// =========================================================
// LOAD SALESMAN
// =========================================================
//
// Offline-first:
//
// 1. Load salesman from IndexedDB.
// 2. Load invoice history from IndexedDB.
// 3. If online, refresh salesman from backend.
// 4. Synchronize invoices.
// 5. Build page from local invoice store.
//
// =========================================================

async function loadSalesman() {

    try {

        // =====================================================
        // 1. LOAD SALESMAN CACHE
        // =====================================================

        let cachedSalesman =
            null;


        try {

            const cachedSalesmen =
                await getAllFromOfflineDB(
                    "salesmen"
                );


            cachedSalesman =
                cachedSalesmen.find(
                    salesman =>
                        Number(
                            salesman.id
                        ) ===
                        Number(
                            salesmanId
                        )
                ) || null;

        }
        catch (cacheError) {

            console.error(
                "Salesman cache load failed:",
                cacheError
            );

        }


        if (cachedSalesman) {

            currentSalesman =
                cachedSalesman;


            renderSalesman(
                cachedSalesman
            );

        }


        // =====================================================
        // 2. LOAD LOCAL INVOICES
        // =====================================================

        await renderFromLocalInvoices();


        // =====================================================
        // 3. OFFLINE
        // =====================================================

        if (
            !navigator.onLine
        ) {

            if (!cachedSalesman) {

                alert(
                    "Salesman is not available offline."
                );

            }

            return;

        }


        // =====================================================
        // 4. REFRESH SALESMAN FROM BACKEND
        // =====================================================

        try {

            const response =
                await authenticatedFetch(
                    `${API}/oneSalesman?id=${salesmanId}`
                );


            if (!response) {
                return;
            }


            if (
                response.ok
            ) {

                const data =
                    await response.json();


                console.log(
                    "Fresh salesman data:",
                    data
                );


                if (
                    data.salesman
                ) {

                    currentSalesman =
                        data.salesman;


                    await saveToOfflineDB(
                        "salesmen",
                        data.salesman
                    );


                    renderSalesman(
                        data.salesman
                    );

                }

            }

            else {

                console.error(
                    "Salesman refresh failed:",
                    response.status
                );

            }

        }
        catch (salesmanError) {

            console.error(
                "Salesman online refresh error:",
                salesmanError
            );

        }


        // =====================================================
        // 5. SYNCHRONIZE INVOICES
        // =====================================================
        //
        // First synchronization:
        // all invoices.
        //
        // Later:
        // invoices since last synchronization.
        //
        // =====================================================

        await syncInvoicesToOfflineDB();


        // =====================================================
        // 6. REBUILD PAGE FROM LOCAL DATA
        // =====================================================

        await renderFromLocalInvoices();

    }
    catch (error) {

        console.error(
            "Salesman load error:",
            error
        );


        alert(
            "Unable to load salesman."
        );

    }

}


// =========================================================
// RENDER FROM LOCAL INVOICES
// =========================================================

async function renderFromLocalInvoices() {

    try {

        const allInvoices =
            await getAllFromOfflineDB(
                "invoices"
            );


        const salesmanInvoices =
            allInvoices
                .filter(
                    invoice =>
                        invoice.type ===
                            "salesman" &&

                        Number(
                            invoice.partyId
                        ) ===
                        Number(
                            salesmanId
                        )
                )
                .sort(
                    (a, b) => {

                        const dateDifference =
                            new Date(b.date) -
                            new Date(a.date);


                        if (
                            dateDifference !== 0
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
            "Local salesman invoices:",
            salesmanInvoices
        );


        const summary =
            salesmanInvoices.map(
                invoice => ({

                    invoiceId:
                        invoice.id,

                    invoiceNo:
                        "INV-" +
                        invoice.id,

                    date:
                        invoice.date,

                    totalItems:
                        Array.isArray(
                            invoice.items
                        )
                            ? invoice.items.length
                            : 0,

                    amount:
                        Number(
                            invoice.subtotal || 0
                        ),

                    commission:
                        Number(
                            invoice.commission || 0
                        ),

                    cash:
                        Number(
                            invoice.cash || 0
                        ),

                    balance:
                        Number(
                            invoice.balance || 0
                        ),

                    totalQuantity:
                        Array.isArray(
                            invoice.items
                        )
                            ? invoice.items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    Number(
                                        item.quantity || 0
                                    ),
                                0
                            )
                            : 0

                })
            );


        renderSummary(
            summary
        );


        renderLocalStats(
            salesmanInvoices
        );


        // =====================================================
        // UPDATE CURRENT SALESMAN BALANCE FROM LATEST INVOICE
        // =====================================================

        if (
            currentSalesman &&
            salesmanInvoices.length > 0
        ) {

            const latestInvoice =
                salesmanInvoices[0];


            const localBalance =
                Number(
                    latestInvoice.balance
                ) || 0;


            // Only use local invoice balance for the
            // displayed balance if it exists.
            //
            // Backend remains authoritative after sync.

            if (
                Number.isFinite(
                    localBalance
                )
            ) {

                const outstandingElement =
                    document.getElementById(
                        "detOutstanding"
                    );


                if (
                    outstandingElement
                ) {

                    outstandingElement.textContent =
                        localBalance.toLocaleString(
                            "en-PK"
                        );

                }

            }

        }

    }
    catch (error) {

        console.error(
            "Failed to build local invoice view:",
            error
        );

    }

}


// =========================================================
// RENDER SALESMAN
// =========================================================

function renderSalesman(
    salesman
) {

    if (!salesman) {
        return;
    }


    currentSalesman =
        salesman;


    const nameElement =
        document.getElementById(
            "detName"
        );


    if (nameElement) {

        nameElement.innerHTML = `

            ${salesman.name || "-"}

            <span class="status-badge ${
                salesman.status
                    ? "active"
                    : "inactive"
            }">

                <span class="dot"></span>

                ${
                    salesman.status
                        ? "Active"
                        : "Inactive"
                }

            </span>

        `;

    }


    const subElement =
        document.getElementById(
            "detSub"
        );


    if (subElement) {

        subElement.innerHTML = `

            Salesman ID:
            ${salesman.id || "-"}

            &nbsp;·&nbsp;

            Joined -
            ${salesman.joinedDate || ""}

        `;

    }


    const phoneElement =
        document.getElementById(
            "detPhone"
        );


    if (phoneElement) {

        phoneElement.textContent =
            salesman.phone || "-";

    }


    const addressElement =
        document.getElementById(
            "detAddress"
        );


    if (addressElement) {

        addressElement.textContent =
            salesman.address || "-";

    }


    const cnicElement =
        document.getElementById(
            "detCnic"
        );


    if (cnicElement) {

        cnicElement.textContent =
            salesman.cnic || "-";

    }


    const emailElement =
        document.getElementById(
            "detEmail"
        );


    if (emailElement) {

        emailElement.textContent =
            salesman.email || "-";

    }


    const whatsappElement =
        document.getElementById(
            "detWhatsapp"
        );


    if (whatsappElement) {

        whatsappElement.textContent =
            salesman.phone || "-";

    }


    const outstandingElement =
        document.getElementById(
            "detOutstanding"
        );


    if (outstandingElement) {

        outstandingElement.textContent =
            Number(
                salesman.outstandingBalance ??
                salesman.outStandingBalance ??
                0
            ).toLocaleString(
                "en-PK"
            );

    }


    const photoElement =
        document.getElementById(
            "detPhoto"
        );


    if (photoElement) {

        photoElement.src =
            salesman.photo ||
            "images/default-user.png";

    }

}


// =========================================================
// RENDER LOCAL STATS
// =========================================================

function renderLocalStats(
    invoices
) {

    const totalInvoices =
        invoices.length;


    const totalPayments =
        invoices.reduce(
            (
                sum,
                invoice
            ) =>
                sum +
                Number(
                    invoice.cash || 0
                ),
            0
        );


    const todayInvoices =
        invoices.filter(
            invoice =>
                isToday(
                    invoice.date
                )
        );


    const statElements =
        document.querySelectorAll(
            ".stat-num"
        );


    // =====================================================
    // Today issued
    // =====================================================

    const todayIssuedElement =
        document.getElementById(
            "detTodayIssued"
        );


    if (todayIssuedElement) {

        todayIssuedElement.textContent =
            todayInvoices.length.toLocaleString(
                "en-PK"
            );

    }


    // =====================================================
    // Total invoices
    // =====================================================

    if (
        statElements[2]
    ) {

        statElements[2].textContent =
            totalInvoices;

    }


    // =====================================================
    // Total payments
    // =====================================================

    if (
        statElements[3]
    ) {

        statElements[3].textContent =
            totalPayments.toLocaleString(
                "en-PK"
            );

    }

}


// =========================================================
// ISSUE STOCK BUTTON
// =========================================================

document
    .querySelector(".btn-issue")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                `issueStocks.html?salesman=${salesmanId}`;

        }
    );


// =========================================================
// FULLSCREEN / INVOICE PAGE
// =========================================================

document
    .getElementById(
        "fullscreenLink"
    )
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();


            window.location.href =
                `invoice.html?salesman=${salesmanId}`;

        }
    );


// =========================================================
// NUMBER HELPER
// =========================================================

function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-PK"
    );

}


// =========================================================
// RENDER SUMMARY
// =========================================================

function renderSummary(
    summary
) {

    currentSummary =
        Array.isArray(
            summary
        )
            ? summary
            : [];


    renderFilteredSummary(
        currentSummary
    );

}


// =========================================================
// FILTERED SUMMARY
// =========================================================

function renderFilteredSummary(
    summary
) {

    const tbody =
        document.getElementById(
            "summaryTbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    if (
        !summary ||
        summary.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="9">
                    No invoices found
                </td>

            </tr>

        `;

        return;

    }


    summary.forEach(
        (
            invoice,
            index
        ) => {

            tbody.innerHTML += `

                <tr
                    class="invoice-row"
                    data-id="${invoice.invoiceId}"
                >

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${
                            new Date(
                                invoice.date
                            ).toLocaleDateString()
                        }
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
                        ${Number(
                            invoice.amount || 0
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${Number(
                            invoice.commission || 0
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${Number(
                            invoice.cash || 0
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${Number(
                            invoice.balance || 0
                        ).toLocaleString()}
                    </td>

                </tr>

            `;

        }
    );

}


// =========================================================
// RENDER INVOICE
// =========================================================

function renderInvoice(
    invoice
) {

    if (!invoice) {
        return;
    }


    selectedInvoice =
        invoice;


    const invoiceNumberElement =
        document.getElementById(
            "invNo"
        );


    if (invoiceNumberElement) {

        invoiceNumberElement.textContent =
            "Invoice No: " +
            invoice.id;

    }


    const tbody =
        document.getElementById(
            "invoiceTbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    if (
        !Array.isArray(
            invoice.items
        )
    ) {

        return;

    }


    invoice.items.forEach(
        item => {

            const quantity =
                Number(
                    item.quantity || 0
                );


            const returnQuantity =
                getReturnQuantity(
                    item
                );


            const net =
                Math.max(
                    quantity -
                    returnQuantity,
                    0
                );


            const amount =
                net *
                Number(
                    item.price || 0
                );


            tbody.innerHTML += `

                <tr>

                    <td>
                        ${item.productName || ""}
                    </td>

                    <td>
                        Issue
                    </td>

                    <td>
                        ${Number(
                            item.price || 0
                        ).toLocaleString()}
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
                        ${amount.toLocaleString()}
                    </td>

                </tr>

            `;

        }
    );


    setText(
        "subTotal",
        Number(
            invoice.subtotal || 0
        ).toLocaleString()
    );


    setText(
        "commision",
        Number(
            invoice.commission || 0
        ).toLocaleString()
    );


    setText(
        "Discount",
        Number(
            invoice.discount || 0
        ).toLocaleString()
    );


    setText(
        "NetTotal",
        Number(
            invoice.netTotal || 0
        ).toLocaleString()
    );


    setText(
        "Cash",
        Number(
            invoice.cash || 0
        ).toLocaleString()
    );


    setText(
        "currentBill",
        (
            Number(
                invoice.netTotal || 0
            ) -
            Number(
                invoice.cash || 0
            )
        ).toLocaleString()
    );


    setText(
        "Arrears",
        Number(
            invoice.arrears || 0
        ).toLocaleString()
    );


    setText(
        "balance",
        Number(
            invoice.balance || 0
        ).toLocaleString()
    );


    setText(
        "comissionPercentage",
        (
            Number(
                invoice.dynamicComission || 0
            ) * 100
        )
    );

}


// =========================================================
// SET TEXT HELPER
// =========================================================

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


// =========================================================
// OPEN INVOICE EDIT POPUP
// =========================================================

function openInvoiceEditPopup(
    invoice
) {

    editingInvoice =
        structuredClone(
            invoice
        );


    // =====================================================
    // Invoice information
    // =====================================================

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

                ${invoice.id}

            </div>


            <div>

                <strong>
                    Salesman:
                </strong>

                ${invoice.partyName || ""}

            </div>


            <div>

                <strong>
                    Date:
                </strong>

                ${
                    new Date(
                        invoice.date
                    ).toLocaleDateString()
                }

            </div>

        `;

    }


    // =====================================================
    // Product rows
    // =====================================================

    const tbody =
        document.getElementById(
            "editInvoiceTbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    invoice.items.forEach(
        (
            item,
            index
        ) => {

            const quantity =
                Number(
                    item.quantity || 0
                );


            const returnQuantity =
                getReturnQuantity(
                    item
                );


            const net =
                Math.max(
                    quantity -
                    returnQuantity,
                    0
                );


            const amount =
                net *
                Number(
                    item.price || 0
                );


            tbody.innerHTML += `

                <tr
                    data-index="${index}"
                >

                    <td>
                        ${item.productName || ""}
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


    // =====================================================
    // Cash
    // =====================================================

    const cashElement =
        document.getElementById(
            "editCash"
        );


    if (cashElement) {

        cashElement.value =
            Number(
                invoice.cash || 0
            );

    }


    setText(
        "editingComission",
        (
            Number(
                invoice.dynamicComission || 0
            ) * 100
        )
    );


    // =====================================================
    // Calculate
    // =====================================================

    updateEditInvoiceTotals(
        editingInvoice
    );


    // =====================================================
    // Show modal
    // =====================================================

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


// =========================================================
// UPDATE EDIT INVOICE TOTALS
// =========================================================

function updateEditInvoiceTotals(
    invoice = editingInvoice
) {

    if (!editingInvoice) {
        return;
    }


    let subtotal = 0;

    let nonCommissionableAmount = 0;


    const rows =
        document.querySelectorAll(
            "#editInvoiceTbody tr"
        );


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


            const quantity =
                Number(
                    item.quantity || 0
                );


            let returnQuantity =
                Number(
                    row.querySelector(
                        ".return-input"
                    )?.value || 0
                );


            if (
                returnQuantity < 0
            ) {

                returnQuantity =
                    0;

            }


            if (
                returnQuantity >
                quantity
            ) {

                returnQuantity =
                    quantity;

            }


            const net =
                Math.max(
                    quantity -
                    returnQuantity,
                    0
                );


            const amount =
                net *
                Number(
                    item.price || 0
                );


            const returnInput =
                row.querySelector(
                    ".return-input"
                );


            if (returnInput) {

                returnInput.value =
                    returnQuantity;

            }


            const netElement =
                row.querySelector(
                    ".edit-net"
                );


            if (netElement) {

                netElement.textContent =
                    net;

            }


            const amountElement =
                row.querySelector(
                    ".edit-amount"
                );


            if (amountElement) {

                amountElement.textContent =
                    amount.toLocaleString();

            }


            subtotal +=
                amount;


            if (
                item.commissionApplicable ===
                "no"
            ) {

                nonCommissionableAmount +=
                    amount;

            }

        }
    );


    const commissionableAmount =
        Math.max(
            subtotal -
            nonCommissionableAmount,
            0
        );


    const dynamicCommission =
        Number(
            editingInvoice.dynamicComission ||
            0
        );


    const commission =
        commissionableAmount *
        dynamicCommission;


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


    // =====================================================
    // Display
    // =====================================================

    setText(
        "editSubtotal",
        subtotal.toLocaleString()
    );


    setText(
        "editCommission",
        commission.toLocaleString()
    );


    setText(
        "editDiscount",
        discount.toLocaleString()
    );


    setText(
        "editNetTotal",
        netTotal.toLocaleString()
    );


    setText(
        "editCurrentBill",
        currentBill.toLocaleString()
    );


    setText(
        "editArrears",
        arrears.toLocaleString()
    );


    setText(
        "editBalance",
        balance.toLocaleString()
    );

}


// =========================================================
// EDIT TABLE INPUT
// =========================================================

document
    .getElementById(
        "editInvoiceTbody"
    )
    ?.addEventListener(
        "input",
        event => {

            if (
                event.target.classList.contains(
                    "return-input"
                )
            ) {

                updateEditInvoiceTotals(
                    editingInvoice
                );

            }

        }
    );


// =========================================================
// EDIT CASH INPUT
// =========================================================

document
    .getElementById(
        "editCash"
    )
    ?.addEventListener(
        "input",
        () => {

            updateEditInvoiceTotals(
                editingInvoice
            );

        }
    );


// =========================================================
// SUMMARY ROW CLICK
// =========================================================

document
    .getElementById(
        "summaryTbody"
    )
    ?.addEventListener(
        "click",
        async event => {

            const row =
                event.target.closest(
                    ".invoice-row"
                );


            if (!row) {
                return;
            }


            const invoiceId =
                Number(
                    row.dataset.id
                );


            try {

                // =================================================
                // READ INVOICE FROM INDEXEDDB
                // =================================================

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
                            invoiceId
                    );


                if (!invoice) {

                    alert(
                        "Invoice is not available locally."
                    );

                    return;

                }


                console.log(
                    "Selected local invoice:",
                    invoice
                );


                // =================================================
                // DISPLAY
                // =================================================

                renderInvoice(
                    invoice
                );


                // =================================================
                // DETERMINE LATEST LOCALLY
                // =================================================

                const salesmanInvoices =
                    allInvoices
                        .filter(
                            item =>
                                item.type ===
                                    "salesman" &&

                                Number(
                                    item.partyId
                                ) ===
                                Number(
                                    salesmanId
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


                const latestInvoice =
                    salesmanInvoices[0] ||
                    null;


                console.log(
                    "Latest local invoice:",
                    latestInvoice
                );


                // =================================================
                // ONLY LATEST EDITABLE
                // =================================================

                if (
                    latestInvoice &&
                    Number(
                        invoice.id
                    ) ===
                    Number(
                        latestInvoice.id
                    )
                ) {

                    openInvoiceEditPopup(
                        invoice
                    );

                }

            }
            catch (error) {

                console.error(
                    "Invoice selection error:",
                    error
                );


                alert(
                    "Unable to load invoice."
                );

            }

        }
    );


// =========================================================
// PRINT REAL INVOICE
// =========================================================

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
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const itemsRows =
        invoice.items
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


                    const amount =
                        net *
                        Number(
                            item.price || 0
                        );


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${item.productName || ""}
                            </td>

                            <td>
                                ${Number(
                                    item.price || 0
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
                                ${amount.toLocaleString()}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    const totalQuantity =
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
                getReturnQuantity(
                    item
                ),
            0
        );


    const totalNet =
        invoice.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Math.max(
                    Number(
                        item.quantity || 0
                    ) -
                    getReturnQuantity(
                        item
                    ),
                    0
                ),
            0
        );


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

            Tel # 091-2601784

            &nbsp;&nbsp;

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
                ${invoice.partyName || ""}
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
                    ${totalQuantity}
                </td>

                <td>
                    ${totalReturn}
                </td>

                <td>
                    ${totalNet}
                </td>

                <td>
                    ${Number(
                        invoice.subtotal || 0
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
                        invoice.subtotal || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Commission ${
                        Number(
                            invoice.dynamicComission || 0
                        ) * 100
                    }%
                </td>

                <td>
                    ${Number(
                        invoice.commission || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Discount
                </td>

                <td>
                    ${Number(
                        invoice.discount || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Net Total
                </td>

                <td>
                    ${Number(
                        invoice.netTotal || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Cash
                </td>

                <td>
                    ${Number(
                        invoice.cash || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Current Bill
                </td>

                <td>
                    ${(
                        Number(
                            invoice.netTotal || 0
                        ) -
                        Number(
                            invoice.cash || 0
                        )
                    ).toLocaleString()}
                </td>
            </tr>


            <tr>
                <td>
                    Arrears
                </td>

                <td>
                    ${Number(
                        invoice.arrears || 0
                    ).toLocaleString()}
                </td>
            </tr>


            <tr class="balance-row">

                <td>
                    Balance
                </td>

                <td>
                    ${Number(
                        invoice.balance || 0
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


// =========================================================
// PRINT INVOICE BUTTON
// =========================================================

document
    .getElementById(
        "printInvoiceBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (!selectedInvoice) {

                alert(
                    "Please select an invoice first."
                );

                return;

            }


            printRealInvoice(
                selectedInvoice
            );

        }
    );


// =========================================================
// PRINT THERMAL INVOICE
// =========================================================

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
                getReturnQuantity(
                    item
                ),
            0
        );


    const totalNet =
        invoice.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Math.max(
                    Number(
                        item.quantity || 0
                    ) -
                    getReturnQuantity(
                        item
                    ),
                    0
                ),
            0
        );


    const itemsRows =
        invoice.items
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


                    const amount =
                        net *
                        Number(
                            item.price || 0
                        );


                    return `

                        <tr>

                            <td class="no">
                                ${index + 1}
                            </td>

                            <td class="product">
                                ${item.productName || ""}
                            </td>

                            <td class="qty">
                                ${quantity}
                            </td>

                            <td class="price">
                                ${Number(
                                    item.price || 0
                                ).toLocaleString()}
                            </td>

                            <td class="amount">
                                ${amount.toLocaleString()}
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
                ${invoice.partyName || ""}
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
                Rs. ${Number(
                    invoice.subtotal || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Commission ${
                    Number(
                        invoice.dynamicComission || 0
                    ) * 100
                }%
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.commission || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Discount
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.discount || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Net Total
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.netTotal || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Cash
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.cash || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Current Bill
            </span>

            <span class="total-value">
                Rs. ${(
                    Number(
                        invoice.netTotal || 0
                    ) -
                    Number(
                        invoice.cash || 0
                    )
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row">

            <span class="total-label">
                Arrears
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.arrears || 0
                ).toLocaleString()}
            </span>

        </div>


        <div class="total-row balance">

            <span class="total-label">
                BALANCE
            </span>

            <span class="total-value">
                Rs. ${Number(
                    invoice.balance || 0
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


// =========================================================
// PRINT SUMMARY
// =========================================================

function printSalesmanSummary() {

    if (!currentSalesman) {

        alert(
            "Salesman information is not loaded."
        );

        return;

    }


    if (
        !currentSummary ||
        currentSummary.length === 0
    ) {

        alert(
            "No summary records found."
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
            "Please allow popups to print the summary."
        );

        return;

    }


    const salesmanName =
        currentSalesman.name ||
        "-";


    const currentSalesmanId =
        currentSalesman.id ||
        "-";


    // =====================================================
    // OPENING BALANCE
    // =====================================================

    let openingBalance =
        Number(
            currentSalesman.openingBalance ??
            0
        );


    if (
        !currentSalesman.openingBalance &&
        currentSummary.length > 0
    ) {

        const first =
            [...currentSummary]
                .sort(
                    (a, b) =>
                        new Date(a.date) -
                        new Date(b.date)
                )[0];


        openingBalance =
            Number(
                first.balance || 0
            ) -
            Number(
                first.amount || 0
            ) +
            Number(
                first.commission || 0
            ) +
            Number(
                first.cash || 0
            );

    }


    // =====================================================
    // SORT
    // =====================================================

    const sortedSummary =
        [...currentSummary]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    // =====================================================
    // ROWS
    // =====================================================

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
                            invoice.amount || 0
                        );


                    const commission =
                        Number(
                            invoice.commission || 0
                        );


                    const advance =
                        Number(
                            invoice.cash || 0
                        );


                    const balance =
                        Number(
                            invoice.balance || 0
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
                                ${
                                    amount
                                        ? amount.toLocaleString("en-PK")
                                        : "-"
                                }
                            </td>

                            <td class="number">
                                ${
                                    commission
                                        ? commission.toLocaleString("en-PK")
                                        : "-"
                                }
                            </td>

                            <td class="number">
                                ${
                                    advance
                                        ? advance.toLocaleString("en-PK")
                                        : "-"
                                }
                            </td>

                            <td class="number balance-cell">
                                ${balance.toLocaleString("en-PK")}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    // =====================================================
    // TOTALS
    // =====================================================

    const totalItems =
        sortedSummary.reduce(
            (
                sum,
                invoice
            ) =>
                sum +
                Number(
                    invoice.totalQuantity || 0
                ),
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
                    invoice.amount || 0
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
                    invoice.commission || 0
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
                    invoice.cash || 0
                ),
            0
        );


    const finalBalance =
        Number(
            sortedSummary[
                sortedSummary.length - 1
            ]?.balance || 0
        );


    // =====================================================
    // PRINT
    // =====================================================

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


    <div class="info">

        <div class="info-left">

            Salesman ID:
            ${currentSalesmanId}

            &nbsp;&nbsp;&nbsp;

            Total Transactions:
            ${currentSummary.length}

        </div>


        <div class="opening-balance">

            Opening Balance:
            Rs. ${openingBalance.toLocaleString("en-PK")}

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


// =========================================================
// PRINT SUMMARY BUTTON
// =========================================================

document
    .getElementById(
        "printSummaryBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            printSalesmanSummary();

        }
    );


// =========================================================
// SUMMARY SEARCH
// =========================================================

document
    .getElementById(
        "summaryDateSearch"
    )
    ?.addEventListener(
        "change",
        filterSummary
    );


document
    .getElementById(
        "summaryInvoiceSearch"
    )
    ?.addEventListener(
        "input",
        filterSummary
    );


// =========================================================
// FILTER SUMMARY
// =========================================================

function filterSummary() {

    const dateValue =
        document.getElementById(
            "summaryDateSearch"
        )?.value || "";


    const invoiceValue =
        (
            document.getElementById(
                "summaryInvoiceSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const filtered =
        currentSummary.filter(
            invoice => {

                // =============================================
                // DATE
                // =============================================

                let dateMatch =
                    true;


                if (
                    dateValue
                ) {

                    const invoiceDate =
                        new Date(
                            invoice.date
                        );


                    const year =
                        invoiceDate.getFullYear();


                    const month =
                        String(
                            invoiceDate.getMonth() + 1
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const day =
                        String(
                            invoiceDate.getDate()
                        )
                        .padStart(
                            2,
                            "0"
                        );


                    const formattedDate =
                        `${year}-${month}-${day}`;


                    dateMatch =
                        formattedDate ===
                        dateValue;

                }


                // =============================================
                // INVOICE
                // =============================================

                let invoiceMatch =
                    true;


                if (
                    invoiceValue
                ) {

                    invoiceMatch =
                        String(
                            invoice.invoiceNo
                        )
                        .toLowerCase()
                        .includes(
                            invoiceValue
                        );

                }


                return (
                    dateMatch &&
                    invoiceMatch
                );

            }
        );


    renderFilteredSummary(
        filtered
    );

}


// =========================================================
// CLEAR SUMMARY SEARCH
// =========================================================

document
    .getElementById(
        "clearSummarySearch"
    )
    ?.addEventListener(
        "click",
        () => {

            const dateInput =
                document.getElementById(
                    "summaryDateSearch"
                );


            const invoiceInput =
                document.getElementById(
                    "summaryInvoiceSearch"
                );


            if (dateInput) {

                dateInput.value =
                    "";

            }


            if (invoiceInput) {

                invoiceInput.value =
                    "";

            }


            renderFilteredSummary(
                currentSummary
            );

        }
    );


// =========================================================
// APPLY LOCAL EDIT TO PRODUCT STOCK
// =========================================================
//
// Backend rule for salesman invoices:
// stockDifference = newReturn - oldReturn
//
// Example:
// old return 2
// new return 5
// stock +3
//
// Example:
// old return 5
// new return 2
// stock -3
//
// =========================================================

async function applySalesmanReturnLocally(
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
                    newReturn -
                    oldReturn;


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


    // =====================================================
    // UPDATE SALESMAN BALANCE
    // =====================================================

    const localSalesmen =
        await getAllFromOfflineDB(
            "salesmen"
        );


    const updatedSalesmen =
        localSalesmen.map(
            salesman => {

                if (
                    Number(
                        salesman.id
                    ) !==
                    Number(
                        updatedInvoice.partyId
                    )
                ) {

                    return salesman;

                }


                return {

                    ...salesman,

                    outstandingBalance:
                        Number(
                            updatedInvoice.balance
                        ) || 0,

                    outStandingBalance:
                        Number(
                            updatedInvoice.balance
                        ) || 0

                };

            }
        );


    await saveManyToOfflineDB(
        "salesmen",
        updatedSalesmen
    );

}


// =========================================================
// BUILD UPDATED LOCAL INVOICE
// =========================================================

function buildUpdatedLocalInvoice(
    originalInvoice
) {

    const invoice =
        structuredClone(
            originalInvoice
        );


    const rows =
        document.querySelectorAll(
            "#editInvoiceTbody tr"
        );


    invoice.items =
        invoice.items.map(
            (
                item,
                index
            ) => {

                const row =
                    rows[index];


                if (!row) {

                    return item;

                }


                const returnInput =
                    row.querySelector(
                        ".return-input"
                    );


                const returnQuantity =
                    Number(
                        returnInput?.value || 0
                    );


                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const net =
                    Math.max(
                        quantity -
                        returnQuantity,
                        0
                    );


                const amount =
                    net *
                    Number(
                        item.price || 0
                    );


                return {

                    ...item,

                    returnQuantity:
                        returnQuantity,

                    // Keep compatibility with old
                    // invoice objects.
                    returnedQuantity:
                        returnQuantity,

                    amount:
                        amount

                };

            }
        );


    let subtotal = 0;

    let nonCommissionableAmount = 0;


    invoice.items.forEach(
        item => {

            const amount =
                Number(
                    item.amount || 0
                );


            subtotal +=
                amount;


            if (
                item.commissionApplicable ===
                "no"
            ) {

                nonCommissionableAmount +=
                    amount;

            }

        }
    );


    const commissionableAmount =
        Math.max(
            subtotal -
            nonCommissionableAmount,
            0
        );


    const commission =
        commissionableAmount *
        Number(
            invoice.dynamicComission || 0
        );


    const discount =
        Number(
            invoice.discount || 0
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
            invoice.arrears || 0
        );


    const balance =
        currentBill +
        arrears;


    invoice.subtotal =
        subtotal;


    invoice.commission =
        commission;


    invoice.netTotal =
        netTotal;


    invoice.cash =
        cash;


    invoice.currentBill =
        currentBill;


    invoice.balance =
        balance;


    return invoice;

}


// =========================================================
// SAVE INVOICE EDIT
// =========================================================

document
    .getElementById(
        "saveInvoiceEdit"
    )
    ?.addEventListener(
        "click",
        async () => {

            if (!editingInvoice) {

                alert(
                    "No invoice selected."
                );

                return;

            }


            const oldInvoice =
                structuredClone(
                    editingInvoice
                );


            // =================================================
            // BUILD LOCAL UPDATED INVOICE
            // =================================================

            const updatedInvoice =
                buildUpdatedLocalInvoice(
                    editingInvoice
                );


            const payloadItems =
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


            const saveButton =
                document.getElementById(
                    "saveInvoiceEdit"
                );


            try {

                if (saveButton) {

                    saveButton.disabled =
                        true;

                }


                // =================================================
                // OFFLINE
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    await applySalesmanReturnLocally(
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
                                payloadItems,

                            cash:
                                cash

                        }

                    });


                    selectedInvoice =
                        updatedInvoice;


                    editingInvoice =
                        null;


                    const modal =
                        document.getElementById(
                            "invoiceEditModal"
                        );


                    if (modal) {

                        modal.classList.remove(
                            "show"
                        );

                    }


                    await renderFromLocalInvoices();


                    renderInvoice(
                        updatedInvoice
                    );


                    alert(
                        "Invoice updated offline. The changes were saved locally and will synchronize when internet returns."
                    );


                    return;

                }


                // =================================================
                // ONLINE
                // =================================================

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
                                        payloadItems,

                                    cash:
                                        cash

                                })

                        }
                    );


                if (!response) {
                    return;
                }


                const result =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to update invoice"
                    );

                }


                console.log(
                    "Updated invoice:",
                    result.invoice
                );


                const serverInvoice =
                    result.invoice;


                // =================================================
                // CACHE SERVER INVOICE
                // =================================================

                if (
                    serverInvoice
                ) {

                    await saveToOfflineDB(
                        "invoices",
                        serverInvoice
                    );


                    selectedInvoice =
                        serverInvoice;

                }


                // =================================================
                // REFRESH SALESMAN CACHE
                // =================================================

                const salesmanResponse =
                    await authenticatedFetch(
                        `${API}/oneSalesman?id=${salesmanId}`
                    );


                if (
                    salesmanResponse &&
                    salesmanResponse.ok
                ) {

                    const salesmanData =
                        await salesmanResponse.json();


                    if (
                        salesmanData.salesman
                    ) {

                        currentSalesman =
                            salesmanData.salesman;


                        await saveToOfflineDB(
                            "salesmen",
                            salesmanData.salesman
                        );

                    }

                }


                // =================================================
                // REFRESH PRODUCT CACHE
                // =================================================
                //
                // Backend already performed the stock update.
                // Therefore use the authoritative product state
                // rather than applying the stock change a second time.
                //
                // =================================================

                try {

                    const productsResponse =
                        await authenticatedFetch(
                            `${API}/products`
                        );


                    if (
                        productsResponse &&
                        productsResponse.ok
                    ) {

                        const productData =
                            await productsResponse.json();


                        const freshProducts =
                            productData.products ||
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
                                                product.purchasePrice ||
                                                product.price ||
                                                0
                                            ),

                                        salePrice:
                                            Number(
                                                product.salePrice ||
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
                                            product.commissionApplicable

                                    })
                                )
                            );

                        }

                    }

                }
                catch (productRefreshError) {

                    console.error(
                        "Product refresh after invoice update failed:",
                        productRefreshError
                    );

                }


                // =================================================
                // CLOSE MODAL
                // =================================================

                const modal =
                    document.getElementById(
                        "invoiceEditModal"
                    );


                if (modal) {

                    modal.classList.remove(
                        "show"
                    );

                }


                editingInvoice =
                    null;


                // =================================================
                // REBUILD LOCAL PAGE
                // =================================================

                await renderFromLocalInvoices();


                if (
                    selectedInvoice
                ) {

                    renderInvoice(
                        selectedInvoice
                    );

                }


                alert(
                    "Invoice updated successfully."
                );

            }
            catch (error) {

                console.error(
                    "Invoice update error:",
                    error
                );


                // =================================================
                // NETWORK LOST DURING REQUEST
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    try {

                        await applySalesmanReturnLocally(
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
                                    payloadItems,

                                cash:
                                    cash

                            }

                        });


                        selectedInvoice =
                            updatedInvoice;


                        editingInvoice =
                            null;


                        const modal =
                            document.getElementById(
                                "invoiceEditModal"
                            );


                        if (modal) {

                            modal.classList.remove(
                                "show"
                            );

                        }


                        await renderFromLocalInvoices();


                        renderInvoice(
                            updatedInvoice
                        );


                        alert(
                            "Internet connection was lost. Invoice changes were saved offline and will synchronize when internet returns."
                        );

                    }
                    catch (offlineError) {

                        console.error(
                            "Offline invoice update fallback failed:",
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

                if (saveButton) {

                    saveButton.disabled =
                        false;

                }

            }

        }
    );


// =========================================================
// CLOSE EDIT MODAL
// =========================================================

document
    .getElementById(
        "closeInvoiceModal"
    )
    ?.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "invoiceEditModal"
                );


            if (modal) {

                modal.classList.remove(
                    "show"
                );

            }


            editingInvoice =
                null;

        }
    );


// =========================================================
// CANCEL EDIT
// =========================================================

document
    .getElementById(
        "cancelInvoiceEdit"
    )
    ?.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "invoiceEditModal"
                );


            if (modal) {

                modal.classList.remove(
                    "show"
                );

            }


            editingInvoice =
                null;

        }
    );


// =========================================================
// PRINT THERMAL BUTTON
// =========================================================
//
// Keeps compatibility if the page has a separate
// thermal print button.
// =========================================================

document
    .getElementById(
        "printThermalBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (!selectedInvoice) {

                alert(
                    "Please select an invoice first."
                );

                return;

            }


            printThermalInvoice(
                selectedInvoice
            );

        }
    );