// ============================================================
// FrostyOps - Offline IndexedDB
// ============================================================

const DB_NAME = "IceCreamManagementDB";
const DB_VERSION = 9;

// ============================================================
// STORE NAMES
// ============================================================

const STORES = {
    CATEGORIES: "categories",
    SUPPLIERS: "suppliers",
    PRODUCTS: "products",
    SALESMEN: "salesmen",
    INVOICES: "invoices",
    EXPENSES: "expenses",
    SYNC_QUEUE: "syncQueue",
    SYNC_META: "syncMeta"
};

// ============================================================
// OPEN DATABASE
// ============================================================

function openOfflineDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = function (event) {

            const db =
                event.target.result;

            // Categories
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

            // Suppliers
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

            // Products
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

            // Salesmen
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

            // Invoices
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

            // Expenses
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

            // Global sync queue
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

            // Synchronization metadata
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
        };

        request.onsuccess = function () {

            resolve(
                request.result
            );

        };

        request.onerror = function () {

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
// SYNC QUEUE
// ============================================================

async function addToSyncQueue(
    operation
) {

    const db =
        await openOfflineDB();

    const queueItem = {

        ...operation,

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    };

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
                store.add(queueItem);

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

        }
    );
}

// ============================================================
// GET PENDING SYNC QUEUE
// ============================================================

async function getPendingSyncQueue() {

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

            const index =
                store.index("status");

            const request =
                index.getAll("pending");

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

            store.delete(queueId);

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
                store.get(queueId);

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

                    store.put(item);

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
                store.get(queueId);

            request.onsuccess =
                function () {

                    resolve(
                        request.result || null
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
                store.get(key);

            request.onsuccess =
                function () {

                    resolve(
                        request.result || null
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

    if (!navigator.onLine) {

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
                    method: "GET",
                    credentials: "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/suppliers`,
                {
                    method: "GET",
                    credentials: "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/products`,
                {
                    method: "GET",
                    credentials: "include"
                }
            ),

            // IMPORTANT:
            // Salesmen endpoint is /allSalesmen
            fetch(
                `${window.APP_CONFIG.API}/allSalesmen`,
                {
                    method: "GET",
                    credentials: "include"
                }
            ),

            fetch(
                `${window.APP_CONFIG.API}/invoices`,
                {
                    method: "GET",
                    credentials: "include"
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

        // =====================================================
        // JWT EXPIRED
        // =====================================================

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

        // =====================================================
        // CHECK REQUESTS
        // =====================================================

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

        // =====================================================
        // READ RESPONSES
        // =====================================================

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

        // =====================================================
        // VALIDATE CATEGORIES
        // =====================================================

        if (
            !Array.isArray(
                categoriesData.data
            )
        ) {

            throw new Error(
                "Invalid categories response."
            );
        }

        // =====================================================
        // VALIDATE SUPPLIERS
        // =====================================================

        if (
            !Array.isArray(
                suppliersData
            )
        ) {

            throw new Error(
                "Invalid suppliers response."
            );
        }

        // =====================================================
        // VALIDATE PRODUCTS
        // =====================================================

        if (
            !Array.isArray(
                productsData.products
            )
        ) {

            throw new Error(
                "Invalid products response."
            );
        }

        // =====================================================
        // VALIDATE SALESMEN
        //
        // /allSalesmen returns:
        //
        // {
        //     data: [...]
        // }
        //
        // =====================================================

        if (
            !Array.isArray(
                salesmenData.data
            )
        ) {

            throw new Error(
                "Invalid salesmen response."
            );
        }

        // =====================================================
        // VALIDATE INVOICES
        // =====================================================

        if (
            !Array.isArray(
                invoicesData.invoices
            )
        ) {

            throw new Error(
                "Invalid invoices response."
            );
        }

        // =====================================================
        // SAVE EVERYTHING TO INDEXEDDB
        // =====================================================

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

            // IMPORTANT:
            // Salesmen array is data.data
            saveManyToOfflineDB(
                STORES.SALESMEN,
                salesmenData.data
            ),

            saveManyToOfflineDB(
                STORES.INVOICES,
                invoicesData.invoices
            )

        ]);

        // =====================================================
        // LOG SYNC RESULT
        // =====================================================

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

        // =====================================================
        // MARK INITIAL SYNC AS COMPLETED
        // =====================================================

        await saveSyncMeta(
            "initialDatabaseSyncCompleted",
            true
        );

        // =====================================================
        // SAVE INVOICE SYNC CHECKPOINT
        // =====================================================

        await saveSyncMeta(
            "invoicesLastSyncAt",
            new Date().toISOString()
        );

        return true;

    } catch (error) {

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

    if (!navigator.onLine) {

        console.log(
            "Offline. Invoice sync skipped."
        );

        return null;
    }

    try {

        // ----------------------------------------------------
        // Check previous invoice synchronization checkpoint
        // ----------------------------------------------------

        const syncMeta =
            await getSyncMeta(
                "invoicesLastSyncAt"
            );

        const syncStartedAt =
            new Date().toISOString();

        let endpoint =
            "/invoices";

        // ----------------------------------------------------
        // FIRST SYNC
        //
        // Download everything.
        // ----------------------------------------------------

        // ----------------------------------------------------
        // LATER SYNC
        //
        // Download invoices created since the previous
        // successful synchronization.
        // ----------------------------------------------------

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
                    method: "GET",
                    credentials: "include"
                }
            );

        // ----------------------------------------------------
        // Authentication expired
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Upsert invoices into IndexedDB
        // ----------------------------------------------------

        if (
            data.invoices.length > 0
        ) {

            await saveManyToOfflineDB(
                STORES.INVOICES,
                data.invoices
            );
        }

        // ----------------------------------------------------
        // Save START time of synchronization
        // ----------------------------------------------------

        await saveSyncMeta(
            "invoicesLastSyncAt",
            syncStartedAt
        );

        console.log(
            "Invoices synchronized:",
            data.invoices.length
        );

        return data.invoices;

    } catch (error) {

        console.error(
            "Invoice synchronization error:",
            error
        );

        // IMPORTANT:
        // Do NOT update invoicesLastSyncAt when sync fails.

        return null;
    }
}

// ============================================================
// GLOBAL SYNC QUEUE PROCESSING
// ============================================================

let isSyncing = false;
let syncRetryTimer = null;

function waitForSyncRetry(
    milliseconds
) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );

    });

}

function isTransientSyncStatus(
    status
) {

    return (
        status === 408 ||
        status === 429 ||
        status >= 500
    );

}

function scheduleSyncQueueRetry(
    delay = 5000
) {

    if (syncRetryTimer) {

        clearTimeout(
            syncRetryTimer
        );

    }

    syncRetryTimer = setTimeout(
        async () => {

            syncRetryTimer = null;

            if (
                !navigator.onLine
            ) {

                console.log(
                    "Still offline. Sync retry postponed."
                );

                return;
            }

            console.log(
                "Retrying pending synchronization..."
            );

            await processSyncQueue();

        },
        delay
    );

}

async function processSyncQueue() {

    if (!navigator.onLine) {

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

    let shouldRetryLater = false;

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

                shouldRetryLater = true;

                break;
            }

            let operationSucceeded = false;

            for (
                let attempt = 1;
                attempt <= 3;
                attempt++
            ) {

                try {

                    if (
                        !navigator.onLine
                    ) {

                        console.log(
                            "Internet lost during sync."
                        );

                        shouldRetryLater = true;

                        break;
                    }

                    if (
                        attempt > 1
                    ) {

                        const retryDelay =
                            attempt === 2
                                ? 2000
                                : 4000;

                        console.log(
                            `Retrying ${operation.method} ${operation.endpoint} in ${retryDelay}ms...`
                        );

                        await waitForSyncRetry(
                            retryDelay
                        );
                    }

                    const requestOptions = {

                        method:
                            operation.method,

                        credentials:
                            "include"

                    };

                    // ------------------------------------------------
                    // Only attach JSON body when a real body exists.
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
                    // Authentication expired
                    // ------------------------------------------------

                    if (
                        response.status === 401
                    ) {

                        console.log(
                            "Authentication expired during sync."
                        );

                        window.location.href =
                            "login.html";

                        return;
                    }

                    // ------------------------------------------------
                    // Read response
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

                    } else {

                        responseData =
                            await response.text();

                    }

                    // ------------------------------------------------
                    // Request failed
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

                        // DELETE + 404 means the record is already
                        // gone from backend.
                        if (
                            operation.method ===
                                "DELETE" &&
                            response.status === 404
                        ) {

                            await removeFromSyncQueue(
                                operation.queueId
                            );

                            operationSucceeded =
                                true;

                            break;
                        }

                        // Retry temporary HTTP failures.
                        if (
                            isTransientSyncStatus(
                                response.status
                            )
                        ) {

                            shouldRetryLater =
                                true;

                            continue;
                        }

                        // Permanent server error.
                        // Keep it pending.
                        break;
                    }

                    // ------------------------------------------------
                    // Successful invoice creation
                    // ------------------------------------------------

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

                    // ------------------------------------------------
                    // Successful latest-invoice update
                    // ------------------------------------------------

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

                    // ------------------------------------------------
                    // Successful operation
                    // ------------------------------------------------

                    await removeFromSyncQueue(
                        operation.queueId
                    );

                    console.log(
                        "Queued operation synchronized:",
                        operation.endpoint
                    );

                    operationSucceeded =
                        true;

                    break;

                } catch (
                    operationError
                ) {

                    // Network errors such as:
                    // ERR_NETWORK_CHANGED
                    // Failed to fetch

                    console.error(
                        `Sync attempt ${attempt} failed:`,
                        operationError
                    );

                    if (
                        attempt < 3
                    ) {

                        shouldRetryLater =
                            true;

                        continue;
                    }

                    shouldRetryLater =
                        true;

                }

            }

            if (
                !operationSucceeded &&
                shouldRetryLater
            ) {

                console.log(
                    "Operation remains pending and will be retried later:",
                    operation.endpoint
                );

            }

        }

    } catch (error) {

        console.error(
            "Sync queue processing error:",
            error
        );

        shouldRetryLater = true;

    } finally {

        isSyncing = false;

    }

    // --------------------------------------------------------
    // Schedule another attempt if pending operations remain.
    // --------------------------------------------------------

    if (
        shouldRetryLater &&
        navigator.onLine
    ) {

        const remainingItems =
            await getPendingSyncQueue();

        if (
            remainingItems.length > 0
        ) {

            scheduleSyncQueueRetry(
                5000
            );

        }

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

        // Give the connection a moment to stabilize.
        await waitForSyncRetry(
            1500
        );

        // First send pending offline operations.
        await processSyncQueue();

        // Then synchronize invoices.
        await syncInvoicesToOfflineDB();

    }
);

// ============================================================
// REQUEST PERSISTENT STORAGE
// ============================================================

async function requestPersistentStorage() {

    if (
        !navigator.storage ||
        !navigator.storage.persist
    ) {

        console.log(
            "Persistent storage is not supported by this browser."
        );

        return;

    }

    try {

        const alreadyPersisted =
            await navigator.storage.persisted();

        if (alreadyPersisted) {

            console.log(
                "FrostyOps storage is already persistent."
            );

            return;

        }

        const persisted =
            await navigator.storage.persist();

        console.log(
            "FrostyOps persistent storage:",
            persisted
        );

    }
    catch (error) {

        console.error(
            "Persistent storage request failed:",
            error
        );

    }

}

requestPersistentStorage();

// ============================================================
// SERVICE WORKER
// ============================================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("/sw.js")
            .then(registration => {

                console.log(
                    "FrostyOps Service Worker registered:",
                    registration.scope
                );

            })
            .catch(error => {

                console.error(
                    "FrostyOps Service Worker registration failed:",
                    error
                );

            });

    });

}