// ============================================================
// FrostyOps - Offline IndexedDB
// ============================================================

const DB_NAME = "IceCreamManagementDB";

const DB_VERSION = 12;


// ============================================================
// STORE NAMES
// ============================================================

const STORES = {

    CATEGORIES:
        "categories",

    SUPPLIERS:
        "suppliers",

    PRODUCTS:
        "products",

    SALESMEN:
        "salesmen",

    INVOICES:
        "invoices",

    EXPENSES:
        "expenses",

    EXPENSE_PROFILES:
        "expenseProfiles",

    PAYMENT_TRANSACTIONS:
        "expensePayments",
        

    SYNC_QUEUE:
        "syncQueue",

    SYNC_META:
        "syncMeta",

    companySettings:
        "companySettings"

};


// ============================================================
// INDEXEDDB STORE PERMISSION MAP
// ============================================================

const OFFLINE_STORE_PERMISSIONS = {

    [STORES.CATEGORIES]: "categories:read",

    [STORES.SUPPLIERS]: "suppliers:read",

    [STORES.PRODUCTS]: "products:read",

    [STORES.SALESMEN]: "salesmen:read",

    [STORES.INVOICES]: "invoices:read",

    [STORES.EXPENSES]: "expenses:read",

    [STORES.EXPENSE_PROFILES]: "expenseProfiles:read",

    [STORES.PAYMENT_TRANSACTIONS]: "expensePayments:read"

};


// ============================================================
// CHECK OFFLINE STORE READ ACCESS
// ============================================================

function hasOfflineStoreReadAccess(storeName) {

    const access = window.FROSTYOPS_ACCESS;

    if (!access) {
        return false;
    }

    const user = access.getUser();

    if (!user) {
        return false;
    }

    // Admin can access every business-data store.
    if (user.role === "admin") {
        return true;
    }

    const requiredPermission =
        OFFLINE_STORE_PERMISSIONS[storeName];

    // Unknown or internal stores are not exposed
    // through ordinary business-data access.
    if (!requiredPermission) {
        return false;
    }

    return access.hasPermission(requiredPermission);

}


// ============================================================
// OPEN DATABASE
// ============================================================

function openOfflineDB() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded =
            function (event) {

                const db =
                    event.target.result;


                // ================= CATEGORIES =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.CATEGORIES
                    )
                ) {

                    db.createObjectStore(
                        STORES.CATEGORIES,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= SUPPLIERS =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.SUPPLIERS
                    )
                ) {

                    db.createObjectStore(
                        STORES.SUPPLIERS,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= PRODUCTS =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.PRODUCTS
                    )
                ) {

                    db.createObjectStore(
                        STORES.PRODUCTS,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= SALESMEN =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.SALESMEN
                    )
                ) {

                    db.createObjectStore(
                        STORES.SALESMEN,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= INVOICES =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.INVOICES
                    )
                ) {

                    db.createObjectStore(
                        STORES.INVOICES,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= EXPENSES =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.EXPENSES
                    )
                ) {

                    db.createObjectStore(
                        STORES.EXPENSES,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= EXPENSE PROFILES =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.EXPENSE_PROFILES
                    )
                ) {

                    db.createObjectStore(
                        STORES.EXPENSE_PROFILES,
                        {
                            keyPath: "_id"
                        }
                    );

                }


                // ================= EXPENSE PAYMENTS =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.PAYMENT_TRANSACTIONS
                    )
                ) {

                    db.createObjectStore(
                        STORES.PAYMENT_TRANSACTIONS,
                        {
                            keyPath: "id"
                        }
                    );

                }


                // ================= SYNC QUEUE =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.SYNC_QUEUE
                    )
                ) {

                    const syncStore =
                        db.createObjectStore(
                            STORES.SYNC_QUEUE,
                            {
                                keyPath: "queueId",
                                autoIncrement: true
                            }
                        );


                    syncStore.createIndex(
                        "status",
                        "status",
                        {
                            unique: false
                        }
                    );

                }


                // ================= SYNC META =================

                if (
                    !db.objectStoreNames.contains(
                        STORES.SYNC_META
                    )
                ) {

                    db.createObjectStore(
                        STORES.SYNC_META,
                        {
                            keyPath: "key"
                        }
                    );

                }


                // ============================================================
// COMPANY SETTINGS STORE
// ============================================================

if (!db.objectStoreNames.contains(STORES.companySettings)) {
    db.createObjectStore(STORES.companySettings, {
        keyPath: "id"
    });
}

            };


        request.onsuccess =
            function () {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function () {

                reject(
                    request.error
                );

            };

    });

}


// ============================================================
// SAVE ONE RECORD
// ============================================================

async function saveToOfflineDB(
    storeName,
    data
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    storeName
                );


            store.put(data);


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// SAVE MANY RECORDS
// ============================================================

async function saveManyToOfflineDB(
    storeName,
    records
) {

    if (
        !Array.isArray(records) ||
        records.length === 0
    ) {

        return;

    }


    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    storeName
                );


            records.forEach(
                record => {

                    store.put(record);

                }
            );


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// GET ALL RECORDS
// ============================================================

async function getAllFromOfflineDB(
    storeName
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    storeName
                );


            const request =
                store.getAll();


            request.onsuccess =
                function () {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}

// ============================================================
// COMPANY SETTINGS - OFFLINE STORAGE
// ============================================================

async function saveCompanySettingsToOfflineDB(settings) {

    if (!settings || typeof settings !== "object") {
        throw new Error("Invalid company settings.");
    }

    const record = {
        id: "default",
        ...settings,
        cachedAt: new Date().toISOString()
    };

    await saveToOfflineDB(
        STORES.companySettings,
        record
    );

    return record;
}


// ============================================================
// GET COMPANY SETTINGS FROM OFFLINE DB
// ============================================================

// ============================================================
// GET COMPANY SETTINGS FROM OFFLINE DB
// ============================================================

async function getCompanySettingsFromOfflineDB() {

    const settings = await getAllFromOfflineDB(
        STORES.companySettings
    );

    return settings.find(
        item => item.id === "default"
    ) || null;
}

// ============================================================
// SYNC COMPANY SETTINGS FROM BACKEND
// ============================================================

async function syncCompanySettingsToOfflineDB() {

    const API =
        window.APP_CONFIG?.API ||
        "https://ice-cream-management.vercel.app";

    try {

        const response = await fetch(
            `${API}/company-settings`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {

            throw new Error(
                `Company settings request failed: ${response.status}`
            );

        }

        const data = await response.json();

        if (
            !data.success ||
            !data.settings
        ) {
            throw new Error(
                "Invalid company settings response."
            );
        }

        await saveCompanySettingsToOfflineDB(
            data.settings
        );

        console.log(
            "Company settings synchronized successfully."
        );

        return data.settings;

    } catch (error) {

        console.error(
            "Company Settings Sync Error:",
            error
        );

        throw error;

    }
}



// ============================================================
// GET COMPANY SETTINGS FOR BILL PRINTING
// ONLINE AND OFFLINE
// ============================================================

async function getCompanySettingsForPrinting() {

    // First, use the locally cached settings.
    let settings =
        await getCompanySettingsFromOfflineDB();

    // If no cache exists, try retrieving settings online.
    if (
        !settings &&
        navigator.onLine
    ) {

        settings =
            await syncCompanySettingsToOfflineDB();

    }

    // Do not silently print with incomplete company information.
    if (
        !settings ||
        !settings.company ||
        !settings.billTemplates
    ) {

        throw new Error(
            "Company and bill settings are unavailable. Please connect to the internet and synchronize settings before printing."
        );

    }

    return settings;
}



// ============================================================
// DELETE ONE RECORD
// ============================================================

async function deleteFromOfflineDB(
    storeName,
    id
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    storeName
                );


            store.delete(id);


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// CLEAR STORE
// ============================================================

async function clearOfflineStore(
    storeName
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    storeName
                );


            store.clear();


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// CURRENT OFFLINE USER
// ============================================================

function getOfflineUserContext() {

    try {

        const user = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (
            !user ||
            !user._id ||
            !["admin", "employee"].includes(user.role)
        ) {
            return null;
        }

        return {
            userId: String(user._id),
            role: user.role
        };

    }
    catch (error) {

        return null;

    }

}


// ============================================================
// SYNC QUEUE
// ============================================================

async function addToSyncQueue(operation) {

    const user = getOfflineUserContext();

    if (!user) {
        throw new Error(
            "A valid logged-in user is required to queue offline operations."
        );
    }

    const db = await openOfflineDB();

    const queueItem = {

        ...operation,

        // Identify the account that created this operation.
        createdByUserId: user.userId,

        status: "pending",

        createdAt: new Date().toISOString()

    };

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORES.SYNC_QUEUE,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORES.SYNC_QUEUE
        );

        const request = store.add(queueItem);

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };

    });

}


// ============================================================
// GET PENDING SYNC QUEUE
// ============================================================

async function getPendingSyncQueue() {

    const user = getOfflineUserContext();

    if (!user) {
        return [];
    }

    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORES.SYNC_QUEUE,
            "readonly"
        );

        const store = transaction.objectStore(
            STORES.SYNC_QUEUE
        );

        const index = store.index("status");

        const request = index.getAll("pending");

        request.onsuccess = function () {

            const pendingItems =
                request.result || [];

            const userItems = pendingItems.filter(item => {

                // New operations belong to their creating account.
                if (item.createdByUserId) {

                    return (
                        String(item.createdByUserId) ===
                        user.userId
                    );

                }

                // Preserve legacy operations created before
                // account ownership was introduced.
                // Previously, only the admin account existed.
                return user.role === "admin";

            });

            resolve(userItems);

        };

        request.onerror = function () {
            reject(request.error);
        };

    });

}


// ============================================================
// REMOVE FROM SYNC QUEUE
// ============================================================

async function removeFromSyncQueue(
    queueId
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORES.SYNC_QUEUE
                );


            store.delete(
                queueId
            );


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// UPDATE SYNC QUEUE ITEM
// ============================================================

async function updateSyncQueueItem(
    queueId,
    changes
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORES.SYNC_QUEUE
                );


            const request =
                store.get(
                    queueId
                );


            request.onsuccess =
                function () {

                    const item =
                        request.result;


                    if (!item) {

                        resolve();

                        return;

                    }


                    Object.assign(
                        item,
                        changes
                    );


                    store.put(
                        item
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// GET ONE SYNC QUEUE ITEM
// ============================================================

async function getSyncQueueItem(
    queueId
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORES.SYNC_QUEUE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORES.SYNC_QUEUE
                );


            const request =
                store.get(
                    queueId
                );


            request.onsuccess =
                function () {

                    resolve(
                        request.result ||
                        null
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// SYNC METADATA
// ============================================================

async function getSyncMeta(
    key
) {

    const db =
        await openOfflineDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORES.SYNC_META,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORES.SYNC_META
                );


            const request =
                store.get(
                    key
                );


            request.onsuccess =
                function () {

                    resolve(
                        request.result ||
                        null
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// SAVE SYNC METADATA
// ============================================================

async function saveSyncMeta(
    key,
    value
) {

    await saveToOfflineDB(
        STORES.SYNC_META,
        {
            key,
            value
        }
    );

}


// ============================================================
// INITIAL DATABASE SYNCHRONIZATION
// ============================================================

async function initialDatabaseSync() {

    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Initial database synchronization skipped."
        );

        return false;

    }


    try {

        const initialSync =
            await getSyncMeta(
                "initialDatabaseSyncCompleted"
            );


       if (
    initialSync &&
    initialSync.value === true
) {

    console.log(
        "Initial database synchronization already completed."
    );

    // Always refresh company settings independently.
    try {

        await syncCompanySettingsToOfflineDB();

    } catch (settingsError) {

        console.error(
            "Company settings synchronization failed:",
            settingsError
        );

    }

    return true;

}


        console.log(
            "Starting initial database synchronization..."
        );


        const [

            categoriesResponse,

            suppliersResponse,

            productsResponse,

            salesmenResponse,

            invoicesResponse

        ] = await Promise.all([

            fetch(
                `${window.APP_CONFIG.API}/categories`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/suppliers`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/products`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/allSalesmen`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/invoices`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            )

        ]);


        const responses = [

            categoriesResponse,

            suppliersResponse,

            productsResponse,

            salesmenResponse,

            invoicesResponse

        ];


        if (
            responses.some(
                response =>
                    response.status === 401
            )
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        if (
            responses.some(
                response =>
                    !response.ok
            )
        ) {

            throw new Error(
                "One or more initial synchronization requests failed."
            );

        }


        const [

            categoriesData,

            suppliersData,

            productsData,

            salesmenData,

            invoicesData

        ] = await Promise.all([

            categoriesResponse.json(),

            suppliersResponse.json(),

            productsResponse.json(),

            salesmenResponse.json(),

            invoicesResponse.json()

        ]);


       if (
    !Array.isArray(
        categoriesData.data
    )
) {
    throw new Error(
        "Invalid categories response."
    );
}


      if (
    !Array.isArray(
        suppliersData
    )
) {
    throw new Error(
        "Invalid suppliers response."
    );
}

        if (
            !Array.isArray(
                productsData.products
            )
        ) {

            throw new Error(
                "Invalid products response."
            );

        }


        if (
            !Array.isArray(
                salesmenData.data
            )
        ) {

            throw new Error(
                "Invalid salesmen response."
            );

        }


        if (
            !Array.isArray(
                invoicesData.invoices
            )
        ) {

            throw new Error(
                "Invalid invoices response."
            );

        }


        await Promise.all([

            saveManyToOfflineDB(
                STORES.CATEGORIES,
               categoriesData.data
            ),

            saveManyToOfflineDB(
                STORES.SUPPLIERS,
                suppliersData
            ),

            saveManyToOfflineDB(
                STORES.PRODUCTS,
                productsData.products
            ),

            saveManyToOfflineDB(
                STORES.SALESMEN,
                salesmenData.data
            ),

            saveManyToOfflineDB(
                STORES.INVOICES,
                invoicesData.invoices
            )

        ]);


        console.log(
            "Initial database synchronization completed:",
            {
              categories:
    categoriesData.data.length,

suppliers:
    suppliersData.length,

                products:
                    productsData.products.length,

                salesmen:
                    salesmenData.data.length,

                invoices:
                    invoicesData.invoices.length
            }
        );


        await saveSyncMeta(
            "initialDatabaseSyncCompleted",
            true
        );


       await saveSyncMeta(
    "invoicesLastSyncAt",
    new Date().toISOString()
);


// ============================================================
// COMPANY SETTINGS SYNCHRONIZATION
// ============================================================

try {

    await syncCompanySettingsToOfflineDB();

} catch (settingsError) {

    console.error(
        "Company settings synchronization failed:",
        settingsError
    );

}


// ============================================================
// INITIAL SYNC COMPLETED
// ============================================================

return true;

    }
    catch (error) {

        console.error(
            "Initial database synchronization failed:",
            error
        );

        return false;

    }

}


// ============================================================
// INVOICE SYNCHRONIZATION
// ============================================================

async function syncInvoicesToOfflineDB() {
    

        // ----------------------------------------
    // CHECK INVOICE READ PERMISSION
    // ----------------------------------------

    if (
        !hasOfflineStoreReadAccess(
            STORES.INVOICES
        )
    ) {

        console.log(
            "Invoice synchronization skipped: invoices:read permission not granted."
        );

        return null;

    }


    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Invoice sync skipped."
        );

        return null;

    }


    try {

        const syncMeta =
            await getSyncMeta(
                "invoicesLastSyncAt"
            );


        const syncStartedAt =
            new Date().toISOString();


        let endpoint =
            "/invoices";


        if (
            syncMeta &&
            syncMeta.value
        ) {

            endpoint =
                `/invoices?since=${encodeURIComponent(
                    syncMeta.value
                )}`;

        }


        console.log(
            "Invoice synchronization endpoint:",
            endpoint
        );


        const response =
            await fetch(
                `${window.APP_CONFIG.API}${endpoint}`,
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return null;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                `Invoice sync failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(
                data.invoices
            )
        ) {

            throw new Error(
                "Invalid invoice response."
            );

        }


        if (
            data.invoices.length > 0
        ) {

            await saveManyToOfflineDB(
                STORES.INVOICES,
                data.invoices
            );

        }


        await saveSyncMeta(
            "invoicesLastSyncAt",
            syncStartedAt
        );


        console.log(
            "Invoices synchronized:",
            data.invoices.length
        );


        return data.invoices;

    }
    catch (error) {

        console.error(
            "Invoice synchronization error:",
            error
        );


        return null;

    }

}


// ============================================================
// GLOBAL SYNC QUEUE PROCESSING
// ============================================================

let isSyncing = false;


async function processSyncQueue() {

    if (
        !navigator.onLine
    ) {

        console.log(
            "Offline. Sync queue processing skipped."
        );

        return;

    }


    if (isSyncing) {

        console.log(
            "Sync already running. Skipping duplicate call."
        );

        return;

    }


    isSyncing = true;


    try {

        const queueItems =
            await getPendingSyncQueue();


        if (
            queueItems.length === 0
        ) {

            console.log(
                "Sync queue is empty."
            );

            return;

        }


        console.log(
            `Processing ${queueItems.length} queued operation(s)...`
        );


        for (
            const operation
            of queueItems
        ) {

            if (
                !navigator.onLine
            ) {

                console.log(
                    "Internet lost during sync. Stopping."
                );

                break;

            }


            try {

                const requestOptions = {

                    method:
                        operation.method,

                    credentials:
                        "include"

                };


                // ------------------------------------------------
                // BODY
                // ------------------------------------------------

                if (
                    operation.body !== null &&
                    operation.body !== undefined
                ) {

                    requestOptions.headers = {

                        "Content-Type":
                            "application/json"

                    };


                    requestOptions.body =
                        JSON.stringify(
                            operation.body
                        );

                }


                const response =
                    await fetch(
                        `${window.APP_CONFIG.API}${operation.endpoint}`,
                        requestOptions
                    );


                // ------------------------------------------------
                // AUTHENTICATION
                // ------------------------------------------------

                if (
                    response.status === 401
                ) {

                    console.log(
                        "Authentication expired during sync."
                    );


                    window.location.href =
                        "login.html";


                    break;

                }


                // ------------------------------------------------
                // RESPONSE
                // ------------------------------------------------

                let responseData =
                    null;


                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    responseData =
                        await response.json();

                }
                else {

                    responseData =
                        await response.text();

                }


                // ------------------------------------------------
                // FAILED REQUEST
                // ------------------------------------------------

                if (
                    !response.ok
                ) {

                    console.error(
                        "Queued operation failed:",
                        operation,
                        response.status,
                        responseData
                    );

                    // =================================================
// PERMISSION DENIED
// Keep operation for review; do not retry automatically.
// =================================================

if (response.status === 403) {

    await updateSyncQueueItem(
        operation.queueId,
        {
            status: "needs_review",

            lastError:
                typeof responseData === "object"
                    ? responseData?.message || "Permission denied."
                    : "Permission denied.",

            lastAttemptAt:
                new Date().toISOString()
        }
    );

    console.warn(
        "Queued operation requires permission review:",
        operation.endpoint
    );

    continue;

}


                    // =================================================
                    // EXPENSE PAYMENT FAILURE
                    //
                    // Example:
                    // A payment was created offline for 10,000.
                    // While offline someone else may have paid the
                    // vendor, reducing the actual outstanding amount.
                    //
                    // Backend rejects the queued payment.
                    // Remove the invalid local payment so the local
                    // ledger does not display a payment that never
                    // actually happened on the backend.
                    // =================================================

                    if (
                        operation.resource ===
                            "expensePayment" &&
                        [
                            400,
                            404,
                            409
                        ].includes(
                            response.status
                        )
                    ) {

                        await removeFromSyncQueue(
                            operation.queueId
                        );


                        if (
                            operation.method ===
                                "POST" &&
                            operation.recordId
                        ) {

                            await deleteFromOfflineDB(
                                STORES.PAYMENT_TRANSACTIONS,
                                operation.recordId
                            );

                        }
                        else if (
                            operation.previousRecord
                        ) {

                            await saveToOfflineDB(
                                STORES.PAYMENT_TRANSACTIONS,
                                operation.previousRecord
                            );

                        }


                        continue;

                    }


                    // =================================================
                    // DELETE + 404
                    //
                    // Backend already removed the record.
                    // The queue item is therefore stale.
                    // =================================================

                    if (
                        operation.method ===
                            "DELETE" &&
                        response.status === 404
                    ) {

                        await removeFromSyncQueue(
                            operation.queueId
                        );

                    }


                    // Keep other failures pending.
                    continue;

                }


                // =====================================================
                // SUCCESSFUL INVOICE CREATION
                // =====================================================

                if (
                    operation.method ===
                        "POST" &&
                    operation.endpoint ===
                        "/invoices" &&
                    operation.body
                ) {

                    await saveToOfflineDB(
                        STORES.INVOICES,
                        operation.body
                    );


                    console.log(
                        "Queued invoice cached locally:",
                        operation.body.id
                    );

                }


                // =====================================================
                // SUCCESSFUL LATEST-INVOICE UPDATE
                // =====================================================

                if (
                    operation.method ===
                        "PUT" &&
                    operation.endpoint.includes(
                        "/update-last"
                    ) &&
                    responseData &&
                    responseData.invoice
                ) {

                    await saveToOfflineDB(
                        STORES.INVOICES,
                        responseData.invoice
                    );


                    console.log(
                        "Updated invoice cached locally:",
                        responseData.invoice.id
                    );

                }


                // =====================================================
                // SUCCESSFUL EXPENSE PAYMENT
                // =====================================================

                if (
                    operation.resource ===
                        "expensePayment" &&
                    (
                        operation.method ===
                            "POST" ||
                        operation.method ===
                            "PUT"
                    ) &&
                    responseData &&
                    responseData.payment
                ) {

                    await saveToOfflineDB(
                        STORES.PAYMENT_TRANSACTIONS,
                        responseData.payment
                    );

                }


                // =====================================================
                // SUCCESSFUL OPERATION
                // =====================================================

                await removeFromSyncQueue(
                    operation.queueId
                );


                console.log(
                    "Queued operation synchronized:",
                    operation.endpoint
                );

            }
            catch (operationError) {

                // Network/server failure.
                // Keep the queue item pending.

                console.error(
                    "Sync operation error:",
                    operationError
                );

            }

        }

    }
    catch (error) {

        console.error(
            "Sync queue processing error:",
            error
        );

    }
    finally {

        isSyncing = false;

    }

}


// ============================================================
// ONLINE EVENT
// ============================================================

window.addEventListener(
    "online",
    async function () {

        console.log(
            "Internet restored. Starting synchronization..."
        );


        // First synchronize queued changes.

        await processSyncQueue();


        // Then refresh invoices.

        await syncInvoicesToOfflineDB();

    }
);