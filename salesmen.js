// ===========================================================
// SALESMEN ADMIN PAGE
// ===========================================================


// ===========================================================
// DOM
// ===========================================================

const tbody =
    document.getElementById(
        "salesmenTbody"
    );

const statTotal =
    document.getElementById(
        "statTotal"
    );

const statActive =
    document.getElementById(
        "statActive"
    );

const statDeliveries =
    document.getElementById(
        "todayDeliveries"
    );

const addPanel =
    document.getElementById(
        "addPanel"
    );

const profilePanel =
    document.getElementById(
        "profilePanel"
    );

const openAddBtn =
    document.getElementById(
        "openAddBtn"
    );


// ===========================================================
// GLOBAL API
// ===========================================================

const API =
    window.APP_CONFIG.API;


// ===========================================================
// STATE
// ===========================================================

let salesmen = [];

let todayDeliveries = 0;


// ===========================================================
// AUTH
// ===========================================================

let adminUser;

getLocalStorageUser = () => {

    if (
        !localStorage.getItem(
            "user"
        )
    ) {

        window.location.href =
            "login.html";

        return;

    }


    adminUser =
        JSON.parse(
            localStorage.getItem(
                "user"
            )
        );


    console.log(
        adminUser.email
    );

};


getLocalStorageUser();


if (adminUser) {

    document.getElementById(
        "admin"
    ).textContent =
        adminUser.email;

}


const today =
    new Date().toLocaleDateString(
        "en-GB",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );


console.log(today);


document.getElementById(
    "datePill"
).textContent =
    today;


// ===========================================================
// LOAD SALESMEN
// ===========================================================

async function loadSalesmen() {

    // =======================================================
    // LOAD CACHED SALESMEN FIRST
    // =======================================================

    try {

        const cachedSalesmen =
            await getAllFromOfflineDB(
                "salesmen"
            );


        if (
            cachedSalesmen &&
            cachedSalesmen.length > 0
        ) {

            salesmen =
                cachedSalesmen;


            console.log(
                "Salesmen loaded from IndexedDB:",
                salesmen
            );


            renderSalesmen(
                salesmen,
                0
            );

        }

    }

    catch (error) {

        console.error(
            "Offline Salesmen Load Error:",
            error
        );

    }


    // =======================================================
    // OFFLINE
    // =======================================================

    if (!navigator.onLine) {

        console.log(
            "Offline mode. Using IndexedDB salesmen."
        );


        if (
            salesmen.length === 0
        ) {

            renderSalesmen(
                [],
                0
            );

        }


        return;

    }


    // =======================================================
    // PROCESS PENDING QUEUE FIRST
    // =======================================================

    try {

        await processSyncQueue();

    }

    catch (error) {

        console.error(
            "Initial sync error:",
            error
        );

    }


    // =======================================================
    // FETCH FRESH SALESMEN
    // =======================================================

    try {

        const response =
            await fetch(
                `${API}/allSalesmen`,
                {
                    credentials:
                        "include"
                }
            );


        // ===================================================
        // JWT EXPIRED
        // ===================================================

        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Failed to fetch salesmen"
            );

        }


        const data =
            await response.json();


        console.log(
            "Salesmen API response:",
            data
        );


        const freshSalesmen =
            data.data || [];


        todayDeliveries =
            data.todayDeliveries || 0;


        // ===================================================
        // UPDATE STATE
        // ===================================================

        salesmen =
            freshSalesmen;


        // ===================================================
        // CACHE SALESmen
        // ===================================================

        await clearOfflineStore(
            "salesmen"
        );


        await saveManyToOfflineDB(
            "salesmen",
            salesmen
        );


        // ===================================================
        // RENDER
        // ===================================================

        renderSalesmen(
            salesmen,
            todayDeliveries
        );

    }

    catch (error) {

        console.error(
            "Salesmen API Error:",
            error
        );


        // ===================================================
        // FALLBACK TO INDEXEDDB
        // ===================================================

        try {

            const cachedSalesmen =
                await getAllFromOfflineDB(
                    "salesmen"
                );


            salesmen =
                cachedSalesmen || [];


            renderSalesmen(
                salesmen,
                todayDeliveries
            );

        }

        catch (offlineError) {

            console.error(
                "Salesmen offline fallback error:",
                offlineError
            );


            renderSalesmen(
                [],
                0
            );

        }

    }

}


// ===========================================================
// RENDER SALESMEN
// ===========================================================

function renderSalesmen(
    salesmenData,
    deliveries = 0
) {

    tbody.innerHTML = "";


    let activeCount = 0;


    salesmenData.forEach(
        (salesman) => {

            if (
                salesman.status
            ) {

                activeCount++;

            }


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${salesman.id}
                </td>

                <td>
                    ${salesman.name}
                </td>

                <td>
                    ${salesman.phone || "-"}
                </td>

                <td>
                    ${salesman.address || salesman.Adress || "-"}
                </td>

                <td>

                    <span class="badge ${salesman.status ? "success" : "danger"}">

                        ${salesman.status
                            ? "Active"
                            : "Inactive"
                        }

                    </span>

                </td>

                <td>
                    Rs ${salesman.outstandingBalance || 0}
                </td>

                <td>

                    <div class="action-cell">

                        <button
                            class="btn btn-secondary btn-sm"
                            onclick="editSalesman('${salesman.id}')">

                            Edit

                        </button>


                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteSalesman('${salesman.id}')">

                            Delete

                        </button>

                    </div>

                </td>

            `;


            row.addEventListener(
                "click",
                async () => {

                    await showSalesmanProfile(
                        salesman
                    );

                }
            );


            tbody.appendChild(
                row
            );

        }
    );


    statTotal.textContent =
        salesmenData.length;


    statActive.textContent =
        activeCount;


    statDeliveries.textContent =
        deliveries;

}


// ===========================================================
// EDIT SALESMAN
// ===========================================================

async function editSalesman(id) {

    let salesman = null;


    const numericId =
        Number(id);


    // =======================================================
    // OFFLINE / CACHE FIRST
    // =======================================================

    try {

        const cachedSalesmen =
            await getAllFromOfflineDB(
                "salesmen"
            );


        salesman =
            cachedSalesmen.find(
                s =>
                    Number(s.id) === numericId
            ) || null;

    }

    catch (error) {

        console.error(
            "Salesman cache lookup error:",
            error
        );

    }


    // =======================================================
    // ONLINE: GET LATEST SINGLE SALESMAN
    // =======================================================

    if (
        navigator.onLine
    ) {

        try {

            const response =
                await fetch(
                    `${API}/oneSalesman?id=${numericId}`,
                    {
                        credentials:
                            "include"
                    }
                );


            if (
                response.status === 401
            ) {

                window.location.href =
                    "login.html";

                return;

            }


            const data =
                await response.json();


            if (
                response.ok &&
                data.salesman
            ) {

                salesman =
                    data.salesman;


                // Keep cache current

                await saveToOfflineDB(
                    "salesmen",
                    salesman
                );

            }

            else if (
                !salesman
            ) {

                alert(
                    data.message ||
                    "Failed to get salesman"
                );

                return;

            }

        }

        catch (error) {

            console.error(
                error
            );


            if (!salesman) {

                alert(
                    "Server error while loading salesman"
                );

                return;

            }

        }

    }


    if (!salesman) {

        alert(
            "Salesman not found"
        );

        return;

    }


    console.log(
        "Editing salesman:",
        salesman
    );


    // =======================================================
    // SHOW EDIT PANEL
    // =======================================================

    profilePanel.classList.add(
        "hidden"
    );


    addPanel.classList.remove(
        "hidden"
    );


    addPanel.innerHTML = `

        <div class="add-panel">

            <h3>
                Edit Salesman
            </h3>


            <p class="hint">
                Update salesman information
            </p>


            <form id="editSalesmanForm">


                <div class="field">

                    <label>
                        ID
                    </label>


                    <input
                        type="number"
                        value="${salesman.id}"
                        disabled
                    >

                </div>


                <div class="field">

                    <label>
                        Name
                    </label>


                    <input
                        id="editName"
                        type="text"
                        value="${salesman.name || ""}"
                        required
                    >

                </div>


                <div class="field">

                    <label>
                        Phone
                    </label>


                    <input
                        id="editPhone"
                        type="text"
                        value="${salesman.phone || ""}"
                        required
                    >

                </div>


                <div class="field">

                    <label>
                        Address
                    </label>


                    <input
                        id="editAddress"
                        type="text"
                        value="${salesman.address || salesman.Adress || ""}"
                        required
                    >

                </div>


                <div class="field">

                    <label>
                        Outstanding Balance
                    </label>


                    <input
                        id="editBalance"
                        type="number"
                        value="${salesman.outstandingBalance || 0}"
                    >

                </div>


                <div class="field">

                    <label>
                        CNIC
                    </label>


                    <input
                        id="editCNIC"
                        type="text"
                        value="${salesman.CNIC || salesman.cnic || ""}"
                    >

                </div>


                <div class="field">

                    <label>
                        Email
                    </label>


                    <input
                        id="editEmail"
                        type="email"
                        value="${salesman.email || ""}"
                    >

                </div>


                <div class="field">

                    <label>
                        Status
                    </label>


                    <select id="editStatus">

                        <option
                            value="true"
                            ${salesman.status ? "selected" : ""}>

                            Active

                        </option>


                        <option
                            value="false"
                            ${!salesman.status ? "selected" : ""}>

                            Inactive

                        </option>

                    </select>

                </div>


                <div class="add-actions">

                    <button
                        type="button"
                        class="btn-ghost"
                        id="cancelEdit">

                        Cancel

                    </button>


                    <button
                        type="submit"
                        class="btn-save">

                        Update

                    </button>

                </div>


            </form>

        </div>

    `;


    // =======================================================
    // CANCEL
    // =======================================================

    document
        .getElementById(
            "cancelEdit"
        )
        .onclick = () => {

            addPanel.classList.add(
                "hidden"
            );

            profilePanel.classList.remove(
                "hidden"
            );

        };


    // =======================================================
    // SUBMIT UPDATE
    // =======================================================

    document
        .getElementById(
            "editSalesmanForm"
        )
        .addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const updatedSalesman = {

                    name:
                        document.getElementById(
                            "editName"
                        ).value,

                    phone:
                        document.getElementById(
                            "editPhone"
                        ).value,

                    // Preserve backend spelling.
                    Adress:
                        document.getElementById(
                            "editAddress"
                        ).value,

                    outstandingBalance:
                        Number(
                            document.getElementById(
                                "editBalance"
                            ).value
                        ),

                    cnic:
                        document.getElementById(
                            "editCNIC"
                        ).value,

                    email:
                        document.getElementById(
                            "editEmail"
                        ).value,

                    status:
                        document.getElementById(
                            "editStatus"
                        ).value === "true"

                };


                console.log(
                    "Sending update:",
                    updatedSalesman
                );


                // =================================================
                // OFFLINE
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    try {

                        const updatedLocalSalesman = {

                            ...salesman,

                            name:
                                updatedSalesman.name,

                            phone:
                                updatedSalesman.phone,

                            address:
                                updatedSalesman.Adress,

                            Adress:
                                updatedSalesman.Adress,

                            outstandingBalance:
                                updatedSalesman.outstandingBalance,

                            cnic:
                                updatedSalesman.cnic,

                            email:
                                updatedSalesman.email,

                            status:
                                updatedSalesman.status

                        };


                        await saveToOfflineDB(
                            "salesmen",
                            updatedLocalSalesman
                        );


                        await addToSyncQueue({

                            endpoint:
                                `/salesmen/${numericId}`,

                            method:
                                "PUT",

                            body:
                                updatedSalesman

                        });


                        salesmen =
                            salesmen.map(
                                s =>
                                    Number(s.id) ===
                                    numericId
                                    ? updatedLocalSalesman
                                    : s
                            );


                        renderSalesmen(
                            salesmen,
                            todayDeliveries
                        );


                        addPanel.classList.add(
                            "hidden"
                        );

                        profilePanel.classList.remove(
                            "hidden"
                        );


                        alert(
                            "Salesman updated offline. It will be synchronized when internet returns."
                        );


                        return;

                    }

                    catch (error) {

                        console.error(
                            "Offline salesman update error:",
                            error
                        );


                        alert(
                            "Failed to update salesman offline."
                        );


                        return;

                    }

                }


                // =================================================
                // ONLINE UPDATE
                // =================================================

                try {

                    const updateResponse =
                        await fetch(
                            `${API}/salesmen/${numericId}`,
                            {

                                method:
                                    "PUT",

                                credentials:
                                    "include",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify(
                                        updatedSalesman
                                    )

                            }
                        );


                    if (
                        updateResponse.status === 401
                    ) {

                        window.location.href =
                            "login.html";

                        return;

                    }


                    const result =
                        await updateResponse.json();


                    if (
                        !updateResponse.ok
                    ) {

                        throw new Error(
                            result.message ||
                            "Failed to update salesman"
                        );

                    }


                    // =================================================
                    // UPDATE LOCAL CACHE
                    // =================================================

                    const updatedLocalSalesman = {

                        ...salesman,

                        name:
                            updatedSalesman.name,

                        phone:
                            updatedSalesman.phone,

                        address:
                            updatedSalesman.Adress,

                        Adress:
                            updatedSalesman.Adress,

                        outstandingBalance:
                            updatedSalesman.outstandingBalance,

                        cnic:
                            updatedSalesman.cnic,

                        email:
                            updatedSalesman.email,

                        status:
                            updatedSalesman.status

                    };


                    await saveToOfflineDB(
                        "salesmen",
                        updatedLocalSalesman
                    );


                    alert(
                        "Salesman updated successfully"
                    );


                    addPanel.classList.add(
                        "hidden"
                    );


                    profilePanel.classList.remove(
                        "hidden"
                    );


                    await loadSalesmen();

                }

                catch (error) {

                    console.error(
                        "Update salesman error:",
                        error
                    );


                    // =============================================
                    // NETWORK FAILURE
                    // =============================================

                    if (
                        !navigator.onLine
                    ) {

                        try {

                            const updatedLocalSalesman = {

                                ...salesman,

                                name:
                                    updatedSalesman.name,

                                phone:
                                    updatedSalesman.phone,

                                address:
                                    updatedSalesman.Adress,

                                Adress:
                                    updatedSalesman.Adress,

                                outstandingBalance:
                                    updatedSalesman.outstandingBalance,

                                cnic:
                                    updatedSalesman.cnic,

                                email:
                                    updatedSalesman.email,

                                status:
                                    updatedSalesman.status

                            };


                            await saveToOfflineDB(
                                "salesmen",
                                updatedLocalSalesman
                            );


                            await addToSyncQueue({

                                endpoint:
                                    `/salesmen/${numericId}`,

                                method:
                                    "PUT",

                                body:
                                    updatedSalesman

                            });


                            salesmen =
                                salesmen.map(
                                    s =>
                                        Number(s.id) ===
                                        numericId
                                        ? updatedLocalSalesman
                                        : s
                                );


                            renderSalesmen(
                                salesmen,
                                todayDeliveries
                            );


                            alert(
                                "Internet connection was lost. Salesman update was saved offline."
                            );


                            addPanel.classList.add(
                                "hidden"
                            );

                            profilePanel.classList.remove(
                                "hidden"
                            );


                            return;

                        }

                        catch (
                            offlineError
                        ) {

                            console.error(
                                "Offline fallback update error:",
                                offlineError
                            );

                            alert(
                                "Failed to save salesman update offline."
                            );

                            return;

                        }

                    }


                    alert(
                        error.message ||
                        "Server error while updating salesman"
                    );

                }

            }
        );

}


// ===========================================================
// DELETE SALESMAN
// ===========================================================

async function deleteSalesman(id) {

    const numericId =
        Number(id);


    const salesman =
        salesmen.find(
            s =>
                Number(s.id) ===
                numericId
        );


    const confirmed =
        confirm(
            `Are you sure you want to delete "${salesman?.name || "this salesman"}"?`
        );


    if (!confirmed) {

        return;

    }


    // =======================================================
    // OFFLINE DELETE
    // =======================================================

    if (
        !navigator.onLine
    ) {

        try {

            await deleteFromOfflineDB(
                "salesmen",
                numericId
            );


            await addToSyncQueue({

                endpoint:
                    `/salesmen/${numericId}`,

                method:
                    "DELETE",

                body:
                    null

            });


            salesmen =
                salesmen.filter(
                    s =>
                        Number(s.id) !==
                        numericId
                );


            renderSalesmen(
                salesmen,
                todayDeliveries
            );


            profilePanel.classList.add(
                "hidden"
            );


            alert(
                "Salesman deleted offline. The deletion will sync when internet returns."
            );

        }

        catch (error) {

            console.error(
                "Offline delete salesman error:",
                error
            );


            alert(
                "Failed to delete salesman offline."
            );

        }


        return;

    }


    // =======================================================
    // ONLINE DELETE
    // =======================================================

    try {

        const response =
            await fetch(
                `${API}/salesmen/${numericId}`,
                {

                    method:
                        "DELETE",

                    credentials:
                        "include"

                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                data.message ||
                "Failed to delete salesman"
            );

        }


        await deleteFromOfflineDB(
            "salesmen",
            numericId
        );


        salesmen =
            salesmen.filter(
                s =>
                    Number(s.id) !==
                    numericId
            );


        renderSalesmen(
            salesmen,
            todayDeliveries
        );


        profilePanel.classList.add(
            "hidden"
        );


        alert(
            "Salesman deleted successfully"
        );

    }

    catch (error) {

        console.error(
            "Delete salesman error:",
            error
        );


        // ===================================================
        // NETWORK FAILURE
        // ===================================================

        if (
            !navigator.onLine
        ) {

            try {

                await deleteFromOfflineDB(
                    "salesmen",
                    numericId
                );


                await addToSyncQueue({

                    endpoint:
                        `/salesmen/${numericId}`,

                    method:
                        "DELETE",

                    body:
                        null

                });


                salesmen =
                    salesmen.filter(
                        s =>
                            Number(s.id) !==
                            numericId
                    );


                renderSalesmen(
                    salesmen,
                    todayDeliveries
                );


                profilePanel.classList.add(
                    "hidden"
                );


                alert(
                    "Internet connection was lost. Salesman deletion was saved offline."
                );

            }

            catch (
                offlineError
            ) {

                console.error(
                    "Offline fallback delete error:",
                    offlineError
                );


                alert(
                    "Failed to save salesman deletion offline."
                );

            }


            return;

        }


        alert(
            error.message ||
            "Server error while deleting salesman"
        );

    }

}


// ===========================================================
// ADD SALESMAN PANEL
// ===========================================================

addPanel.innerHTML = `

    <div class="add-panel">

        <h3>
            Add Salesman
        </h3>


        <p class="hint">
            Create a new salesman profile
        </p>


        <form id="addSalesmanForm">


            <div class="field">

                <label>
                    ID
                </label>

                <input
                    id="salesmanId"
                    type="number"
                    required>

            </div>


            <div class="field">

                <label>
                    Name
                </label>

                <input
                    id="salesmanName"
                    type="text"
                    required>

            </div>


            <div class="field">

                <label>
                    Phone
                </label>

                <input
                    id="salesmanPhone"
                    type="text"
                    required>

            </div>


            <div class="field">

                <label>
                    Address
                </label>

                <input
                    id="salesmanAddress"
                    type="text"
                    required>

            </div>


            <div class="field">

                <label>
                    Outstanding Balance
                </label>

                <input
                    id="salesmanBalance"
                    type="number"
                    value="0">

            </div>


            <div class="field">

                <label>
                    CNIC
                </label>

                <input
                    id="CNIC"
                    type="text"
                    value="">

            </div>


            <div class="field">

                <label>
                    Email
                </label>

                <input
                    id="email"
                    type="email"
                    value="">

            </div>


            <div class="field">

                <label>
                    Status
                </label>


                <select id="salesmanStatus">

                    <option value="true">
                        Active
                    </option>

                    <option value="false">
                        Inactive
                    </option>

                </select>

            </div>


            <div class="add-actions">

                <button
                    type="button"
                    class="btn-ghost"
                    id="cancelAdd">

                    Cancel

                </button>


                <button
                    class="btn-save"
                    type="submit">

                    Save

                </button>

            </div>


        </form>

    </div>

`;


// ===========================================================
// OPEN ADD PANEL
// ===========================================================

openAddBtn.onclick = () => {

    profilePanel.classList.add(
        "hidden"
    );


    addPanel.classList.remove(
        "hidden"
    );

};


// ===========================================================
// CLOSE ADD PANEL
// ===========================================================

document
    .getElementById(
        "cancelAdd"
    )
    .onclick = () => {

        addPanel.classList.add(
            "hidden"
        );


        profilePanel.classList.remove(
            "hidden"
        );

    };


// ===========================================================
// ADD SALESMAN
// ===========================================================

document
    .getElementById(
        "addSalesmanForm"
    )
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const salesman = {

                id:
                    Number(
                        document.getElementById(
                            "salesmanId"
                        ).value
                    ),

                name:
                    document.getElementById(
                        "salesmanName"
                    ).value,

                phone:
                    document.getElementById(
                        "salesmanPhone"
                    ).value,

                address:
                    document.getElementById(
                        "salesmanAddress"
                    ).value,

                status:
                    document.getElementById(
                        "salesmanStatus"
                    ).value === "true",

                outstandingBalance:
                    Number(
                        document.getElementById(
                            "salesmanBalance"
                        ).value
                    ),

                cnic:
                    document.getElementById(
                        "CNIC"
                    ).value,

                email:
                    document.getElementById(
                        "email"
                    ).value

            };


            // =================================================
            // OFFLINE
            // =================================================

            if (
                !navigator.onLine
            ) {

                try {

                    // Save locally

                    await saveToOfflineDB(
                        "salesmen",
                        salesman
                    );


                    // Queue POST

                    await addToSyncQueue({

                        endpoint:
                            "/salesmen",

                        method:
                            "POST",

                        body:
                            salesman

                    });


                    // Update page state

                    salesmen.push(
                        salesman
                    );


                    renderSalesmen(
                        salesmen,
                        todayDeliveries
                    );


                    e.target.reset();


                    addPanel.classList.add(
                        "hidden"
                    );

                    profilePanel.classList.remove(
                        "hidden"
                    );


                    alert(
                        "Salesman saved offline. It will be synchronized when internet returns."
                    );

                }

                catch (error) {

                    console.error(
                        "Offline salesman save error:",
                        error
                    );


                    alert(
                        "Failed to save salesman offline."
                    );

                }


                return;

            }


            // =================================================
            // ONLINE ADD
            // =================================================

            try {

                const response =
                    await fetch(
                        `${API}/salesmen`,
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
                                    salesman
                                )

                        }
                    );


                if (
                    response.status === 401
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
                        "Failed to add salesman"
                    );

                }


                alert(
                    "Salesman Added Successfully"
                );


                e.target.reset();


                addPanel.classList.add(
                    "hidden"
                );


                profilePanel.classList.remove(
                    "hidden"
                );


                await loadSalesmen();

            }

            catch (error) {

                console.error(
                    "Add salesman error:",
                    error
                );


                // =============================================
                // NETWORK FAILURE
                // =============================================

                if (
                    !navigator.onLine
                ) {

                    try {

                        await saveToOfflineDB(
                            "salesmen",
                            salesman
                        );


                        await addToSyncQueue({

                            endpoint:
                                "/salesmen",

                            method:
                                "POST",

                            body:
                                salesman

                        });


                        salesmen.push(
                            salesman
                        );


                        renderSalesmen(
                            salesmen,
                            todayDeliveries
                        );


                        e.target.reset();


                        addPanel.classList.add(
                            "hidden"
                        );

                        profilePanel.classList.remove(
                            "hidden"
                        );


                        alert(
                            "Internet connection was lost. Salesman was saved offline."
                        );

                    }

                    catch (
                        offlineError
                    ) {

                        console.error(
                            "Offline fallback add error:",
                            offlineError
                        );


                        alert(
                            "Failed to save salesman offline."
                        );

                    }


                    return;

                }


                alert(
                    error.message ||
                    "Server Error"
                );

            }

        }
    );


// ===========================================================
// RIGHT-SIDE PROFILE
// ===========================================================

async function showSalesmanProfile(
    salesman
) {

    let salesmanSummary = {

        todayInvoices: [],

        todayInvoiceLength: 0,

        todayIssued: 0

    };


    // =======================================================
    // ONLINE SUMMARY
    // =======================================================

    if (
        navigator.onLine
    ) {

        try {

            const res =
                await fetch(
                    `${API}/summary?id=${salesman.id}`,
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


            if (res.ok) {

                salesmanSummary =
                    await res.json();

            }

        }

        catch (error) {

            console.error(
                "Salesman summary error:",
                error
            );

        }

    }


    console.log(
        "salesman_summary:",
        salesmanSummary
    );


    profilePanel.classList.remove(
        "hidden"
    );


    addPanel.classList.add(
        "hidden"
    );


    const statusClass =
        salesman.status
            ? "active"
            : "inactive";


    const statusText =
        salesman.status
            ? "Active"
            : "Inactive";


    const todayInvoices =
        salesmanSummary.todayInvoices || [];


    profilePanel.innerHTML = `

        <div class="profile-top">

            <div class="profile-photo"></div>


            <div>

                <div class="profile-name">

                    ${salesman.name}

                    <span
                        class="status-badge ${statusClass}">

                        <span class="dot"></span>

                        ${statusText}

                    </span>

                </div>


                <div class="profile-meta">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round">

                        <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 012 2.1z"/>

                    </svg>

                    ${salesman.phone || "N/A"}

                </div>


                <div class="profile-meta">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round">

                        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/>

                        <circle
                            cx="12"
                            cy="10"
                            r="3"/>

                    </svg>

                    ${
                        salesman.route ||
                        salesman.address ||
                        salesman.Adress ||
                        "N/A"
                    }

                </div>

            </div>

        </div>


        <div class="section-block">

            <div class="section-title">
                Personal information
            </div>


            <div class="info-grid">

                <div>

                    <div class="info-label">
                        CNIC
                    </div>

                    <div class="info-value">
                        ${salesman.cnic || salesman.CNIC || "N/A"}
                    </div>

                </div>


                <div>

                    <div class="info-label">
                        Phone
                    </div>

                    <div class="info-value">
                        ${salesman.phone || "N/A"}
                    </div>

                </div>


                <div>

                    <div class="info-label">
                        Email
                    </div>

                    <div class="info-value">
                        ${salesman.email || "N/A"}
                    </div>

                </div>


                <div>

                    <div class="info-label">
                        Address
                    </div>

                    <div class="info-value">
                        ${
                            salesman.address ||
                            salesman.Adress ||
                            "N/A"
                        }
                    </div>

                </div>


                <div>

                    <div class="info-label">
                        Whatsapp
                    </div>

                    <div class="info-value">
                        ${
                            salesman.whatsapp ||
                            salesman.phone ||
                            "N/A"
                        }
                    </div>

                </div>

            </div>

        </div>


        <div class="section-block">

            <div
                class="section-title"
                style="margin-bottom:14px;">

                Summary

            </div>


            <div class="summary-grid">

                <div class="summary-box">

                    <div class="summary-label">
                        Todays Issued
                    </div>

                    <div class="summary-value">

                        ${
                            salesmanSummary.todayInvoiceLength ??
                            todayInvoices.length ??
                            0
                        }

                    </div>

                </div>


                <div class="summary-box">

                    <div class="summary-label">
                        Total today Purchases
                    </div>

                    <div class="summary-value">

                        Rs. ${
                            Number(
                                salesmanSummary.todayIssued ??
                                0
                            ).toLocaleString()
                        }

                    </div>

                </div>


                <div class="summary-box">

                    <div class="summary-label">
                        Last Payment
                    </div>

                    <div
                        class="summary-value"
                        style="font-size:14px;">

                        ${
                            todayInvoices.length > 0
                                ? todayInvoices[0].cash
                                : "—"
                        }

                    </div>

                </div>


                <div class="summary-box">

                    <div class="summary-label">
                        Outstanding Balance
                    </div>

                    <div class="summary-value red">

                        Rs. ${
                            Number(
                                salesman.outstandingBalance ??
                                0
                            ).toLocaleString()
                        }

                    </div>

                </div>

            </div>

        </div>


        <div
            class="section-block"
            style="border-bottom:none;">

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:10px;
                ">

                <div
                    class="section-title"
                    style="margin-bottom:0;">

                    Recent Invoices

                </div>


                <span class="view-all">
                    View All
                </span>

            </div>


            ${
                renderRecentInvoices(
                    todayInvoices
                )
            }

        </div>


        <div class="quick-actions">

            <div
                class="section-title"
                style="margin-bottom:2px;">

                Quick Actions

            </div>


            <div class="qa-row">

                <button
                    class="btn-outline"
                    id="issueStockBtn">

                    Issue Stock

                </button>

            </div>


            <button
                class="btn-solid"
                id="viewFullProfileBtn">

                View Full Profile

            </button>

        </div>

    `;


    document
        .getElementById(
            "issueStockBtn"
        )
        .onclick = () => {

            alert(
                `Issue stock flow for ${salesman.name} isn't wired up to the API yet.`
            );

        };


    document
        .getElementById(
            "viewFullProfileBtn"
        )
        .onclick = () => {

            window.location.href =
                `./salesman-details.html?id=${salesman.id}`;

        };

}


// ===========================================================
// RECENT INVOICES
// ===========================================================

function renderRecentInvoices(
    invoices
) {

    if (
        !invoices ||
        !invoices.length
    ) {

        return `

            <div class="invoice-row">

                <span style="color:var(--muted);">

                    ${
                        navigator.onLine
                            ? "No recent invoices"
                            : "Recent invoices unavailable offline"
                    }

                </span>

            </div>

        `;

    }


    return invoices
        .slice(0, 3)
        .map(
            inv => `

                <div class="invoice-row">

                    <span>
                        ${
                            inv.date
                                ? inv.date.substring(
                                    0,
                                    10
                                )
                                : "-"
                        }
                    </span>

                    <span>
                        ${
                            inv.id !== undefined &&
                            inv.id !== null
                                ? "INV-" + inv.id
                                : "-"
                        }
                    </span>

                    <span>
                        Rs. ${
                            Number(
                                inv.balance ??
                                0
                            ).toLocaleString()
                        }
                    </span>

                </div>

            `
        )
        .join("");

}


// ===========================================================
// INITIAL LOAD
// ===========================================================

loadSalesmen();