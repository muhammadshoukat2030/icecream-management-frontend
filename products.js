// ===========================================================
// Products Admin Page - Script
// ===========================================================


// ===========================================================
// GLOBAL API
// ===========================================================

const API = window.APP_CONFIG.API;


// ===========================================================
// Product data
// ===========================================================

let data;
let products = [];

const companyOptions = [];
const categoryOptions = [];

const comissionApplicable = ["yes", "no"];


// ===========================================================
// AUTH
// ===========================================================

let adminUser;

getLocalStorageUser = () => {

    if (!localStorage.getItem("user")) {

        window.location.href = "login.html";

        return;

    }

    adminUser =
        JSON.parse(
            localStorage.getItem("user")
        );

    console.log(adminUser.email);

};

getLocalStorageUser();


if (adminUser) {

    document.getElementById("admin").textContent =
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

document.getElementById("datePill").textContent =
    today;


// ===========================================================
// PRODUCT MAPPER
// ===========================================================

function mapProduct(product) {

    return {

        id: product.id,

        productName: product.name,

        brand: product.company,

        company: product.company,

        purchasePrice: product.purchasePrice,

        salePrice: product.salePrice,

        category: product.category,

        description:
            product.description || "",

        stock:
            product.qunatity ??
            product.quantity ??
            0,

        commissionApplicable:
            product.commissionApplicable

    };

}


// ===========================================================
// RECALCULATE CATEGORY + SUPPLIER PRODUCT COUNTS
// ===========================================================
//
// These are LOCAL IndexedDB calculations.
//
// They are NOT added to syncQueue.
//
// The backend will perform the authoritative calculations
// when the original product operation is synchronized.
//
// ===========================================================

async function recalculateProductRelationshipCounts() {

    try {

        const [
            localProducts,
            localCategories,
            localSuppliers
        ] = await Promise.all([

            getAllFromOfflineDB(
                "products"
            ),

            getAllFromOfflineDB(
                "categories"
            ),

            getAllFromOfflineDB(
                "suppliers"
            )

        ]);


        // ===================================================
        // CATEGORY COUNTS
        // ===================================================

        const categoryCounts =
            new Map();


        localProducts.forEach(
            product => {

                const category =
                    product.category;


                if (!category) {
                    return;
                }


                categoryCounts.set(

                    category,

                    (
                        categoryCounts.get(
                            category
                        ) || 0
                    ) + 1

                );

            }
        );


        const updatedCategories =
            localCategories.map(
                category => {

                    const categoryName =
                        category.name ??
                        category.category;


                    const count =
                        categoryName
                            ? (
                                categoryCounts.get(
                                    categoryName
                                ) || 0
                            )
                            : 0;


                    const updatedCategory = {

                        ...category

                    };


                    // Backend-shaped category

                    if (
                        Object.prototype.hasOwnProperty.call(
                            updatedCategory,
                            "totalProducts"
                        ) ||
                        Object.prototype.hasOwnProperty.call(
                            updatedCategory,
                            "name"
                        )
                    ) {

                        updatedCategory.totalProducts =
                            count;

                    }


                    // Frontend-shaped category

                    if (
                        Object.prototype.hasOwnProperty.call(
                            updatedCategory,
                            "products"
                        ) ||
                        Object.prototype.hasOwnProperty.call(
                            updatedCategory,
                            "category"
                        )
                    ) {

                        updatedCategory.products =
                            count;

                    }


                    return updatedCategory;

                }
            );


        // ===================================================
        // SUPPLIER COUNTS
        // ===================================================

        const supplierCounts =
            new Map();


        localProducts.forEach(
            product => {

                const company =
                    product.company;


                if (!company) {
                    return;
                }


                supplierCounts.set(

                    company,

                    (
                        supplierCounts.get(
                            company
                        ) || 0
                    ) + 1

                );

            }
        );


        const updatedSuppliers =
            localSuppliers.map(
                supplier => {

                    const companyName =
                        supplier.companyName;


                    const count =
                        companyName
                            ? (
                                supplierCounts.get(
                                    companyName
                                ) || 0
                            )
                            : 0;


                    return {

                        ...supplier,

                        totalProducts:
                            count

                    };

                }
            );


        // ===================================================
        // SAVE UPDATED CATEGORY CACHE
        // ===================================================

        if (
            updatedCategories.length > 0
        ) {

            await saveManyToOfflineDB(
                "categories",
                updatedCategories
            );

        }


        // ===================================================
        // SAVE UPDATED SUPPLIER CACHE
        // ===================================================

        if (
            updatedSuppliers.length > 0
        ) {

            await saveManyToOfflineDB(
                "suppliers",
                updatedSuppliers
            );

        }


        console.log(
            "Local category counts recalculated:",
            updatedCategories
        );


        console.log(
            "Local supplier counts recalculated:",
            updatedSuppliers
        );

    }

    catch (error) {

        console.error(
            "Relationship recalculation error:",
            error
        );

    }

}


// ===========================================================
// GET PRODUCTS
// ===========================================================

async function getProducts() {

    // =======================================================
    // FIRST LOAD FROM INDEXEDDB
    // =======================================================

    try {

        const offlineProducts =
            await getAllFromOfflineDB(
                "products"
            );


        if (
            offlineProducts &&
            offlineProducts.length > 0
        ) {

            products =
                offlineProducts;


            console.log(
                "Products loaded from IndexedDB:",
                products
            );


            renderProductsTable();

            updateStatCounts();

        }

    }

    catch (error) {

        console.error(
            "Offline Products Load Error:",
            error
        );

    }


    // =======================================================
    // IF OFFLINE, STOP HERE
    // =======================================================

    if (!navigator.onLine) {

        console.log(
            "Offline mode. Using IndexedDB products."
        );

        return;

    }


    // =======================================================
    // PROCESS ANY PENDING CHANGES FIRST
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
    // GET LATEST PRODUCTS FROM BACKEND
    // =======================================================

    try {

        const res =
            await fetch(
                `${API}/products`,
                {
                    credentials: "include"
                }
            );


        // ===================================================
        // JWT EXPIRED
        // ===================================================

        if (res.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        if (!res.ok) {

            throw new Error(
                "Failed to fetch products"
            );

        }


        data =
            await res.json();

        console.log(
            "Products API response:",
            data
        );


        products =
            data.products.map(
                mapProduct
            );


        console.log(
            "Products from backend:",
            products
        );


        // ===================================================
        // SAVE LATEST PRODUCTS TO INDEXEDDB
        // ===================================================

        await clearOfflineStore(
            "products"
        );


        await saveManyToOfflineDB(
            "products",
            products
        );


        // ===================================================
        // REBUILD LOCAL DEPENDENT COUNTS
        // ===================================================

        await recalculateProductRelationshipCounts();


        // ===================================================
        // REFRESH UI
        // ===================================================

        renderProductsTable();

        updateStatCounts();

    }

    catch (error) {

        console.error(
            "API Error:",
            error
        );


        // ===================================================
        // FALLBACK TO INDEXEDDB
        // ===================================================

        try {

            const offlineProducts =
                await getAllFromOfflineDB(
                    "products"
                );


            products =
                offlineProducts || [];


            await recalculateProductRelationshipCounts();


            renderProductsTable();

            updateStatCounts();

        }

        catch (offlineError) {

            console.error(
                "Offline fallback error:",
                offlineError
            );

        }

    }

}


// ===========================================================
// GET CATEGORIES
// ===========================================================

async function getCategories() {

    try {

        const res =
            await fetch(
                `${API}/categories`,
                {
                    credentials: "include"
                }
            );


        if (res.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await res.json();


        categoryOptions.length = 0;


        data.data.forEach(item => {

            categoryOptions.push(
                item.name
            );

        });


        console.log(
            "Categories:",
            categoryOptions
        );

    }

    catch (error) {

        console.log(
            "Category API Error:",
            error
        );

    }

}


// ===========================================================
// GET COMPANIES FROM GLOBAL SUPPLIER CACHE
// ===========================================================

async function getCompanies() {

    try {

        const cachedSuppliers =
            await getAllFromOfflineDB(
                "suppliers"
            );


        companyOptions.length = 0;


        cachedSuppliers.forEach(
            supplier => {

                if (
                    supplier.companyName
                ) {

                    companyOptions.push(
                        supplier.companyName
                    );

                }

            }
        );


        console.log(
            "Companies loaded from supplier cache:",
            companyOptions
        );

    }

    catch (error) {

        console.error(
            "Supplier cache error:",
            error
        );

        companyOptions.length = 0;

    }

}


// ===========================================================
// INITIALIZE PAGE
// ===========================================================

async function initializePage() {

    await getCategories();

    await getCompanies();

    await getProducts();

    renderManualTable();

    renderProductsTable();

    updateStatCounts();

}


// ===========================================================
// Selected product
// ===========================================================

let selectedIndex = null;


// ===========================================================
// Products table
// ===========================================================

function renderProductsTable() {

    const tbody =
        document.getElementById(
            "productTableBody"
        );


    tbody.innerHTML = "";


    const query =
        (
            document
                .getElementById("searchInput")
                .value || ""
        )
        .trim()
        .toLowerCase();


    products.forEach((row, idx) => {

        if (query) {

            const haystack =
                row.productName +
                " " +
                row.id;


            if (
                !haystack
                    .toLowerCase()
                    .includes(query)
            ) {

                return;

            }

        }


        const tr =
            document.createElement("tr");


        tr.dataset.idx = idx;


        if (idx === selectedIndex) {

            tr.classList.add(
                "selected"
            );

        }


        tr.innerHTML = `

            <td>${row.id}</td>

            <td>${row.productName}</td>

            <td>${row.brand}</td>

            <td>${row.purchasePrice}</td>

            <td>${row.salePrice}</td>

            <td>${row.category}</td>

            <td>

                <div class="action-cell">

                    <button
                        class="btn btn-edit"
                        data-idx="${idx}"
                        data-action="edit">
                        &#9998; Edit
                    </button>

                    <button
                        class="btn btn-delete"
                        data-idx="${idx}"
                        data-action="delete">
                        &#128465; Delete
                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


// ===========================================================
// Show Product Details
// ===========================================================

function showProductDetails(idx) {

    const row =
        products[idx];


    if (!row) return;


    selectedIndex =
        idx;


    document.getElementById(
        "editProductForm"
    )
    .style.display = "none";


    document.getElementById(
        "detailName"
    )
    .textContent =
        row.productName;


    document.getElementById(
        "detailIdShort"
    )
    .textContent =
        "Id:" + row.id;


    document.getElementById(
        "detailFullName"
    )
    .textContent =
        row.productName;


    document.getElementById(
        "detailCompany"
    )
    .textContent =
        row.company;


    document.getElementById(
        "detailCategory"
    )
    .textContent =
        row.category;


    document.getElementById(
        "detailId"
    )
    .textContent =
        row.id;


    document.getElementById(
        "detailDescription"
    )
    .textContent =
        row.description;


    document.getElementById(
        "detailPurchasePrice"
    )
    .textContent =
        "Rs. " +
        row.purchasePrice;


    document.getElementById(
        "detailSalePrice"
    )
    .textContent =
        "Rs. " +
        row.salePrice;


    document.getElementById(
        "detailProfit"
    )
    .textContent =
        "Rs. " +
        (
            row.salePrice -
            row.purchasePrice
        );


    document.getElementById(
        "detailStock"
    )
    .innerHTML =
        row.stock +
        '<span class="units">units</span>';


    document.getElementById(
        "manualPanel"
    )
    .style.display =
        "none";


    document.getElementById(
        "detailsPanel"
    )
    .style.display =
        "block";


    document.getElementById(
        "searchWrap"
    )
    .classList.add(
        "show"
    );


    renderProductsTable();

}


// ===========================================================
// OPEN EDIT PRODUCT
// ===========================================================

document
    .getElementById(
        "editProductBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (
                selectedIndex === null
            ) {

                alert(
                    "Please select a product."
                );

                return;

            }


            const product =
                products[selectedIndex];


            document.getElementById(
                "editProductName"
            )
            .value =
                product.productName;


            document.getElementById(
                "editProductCompany"
            )
            .innerHTML =
                selectOptionsHtml(
                    companyOptions,
                    product.company
                );


            document.getElementById(
                "editProductCategory"
            )
            .innerHTML =
                selectOptionsHtml(
                    categoryOptions,
                    product.category
                );


            document.getElementById(
                "editProductPurchasePrice"
            )
            .value =
                product.purchasePrice;


            document.getElementById(
                "editProductSalePrice"
            )
            .value =
                product.salePrice;


            document.getElementById(
                "editProductDescription"
            )
            .value =
                product.description || "";


            document.getElementById(
                "editProductBtn"
            )
            .style.display =
                "none";


            document.getElementById(
                "editProductForm"
            )
            .style.display =
                "block";

        }
    );


// ===========================================================
// SAVE EDITED PRODUCT
// ===========================================================

document
    .getElementById(
        "saveEditProductBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                selectedIndex === null
            ) {

                alert(
                    "No product selected."
                );

                return;

            }


            const product =
                products[selectedIndex];


            const name =
                document
                    .getElementById(
                        "editProductName"
                    )
                    .value
                    .trim();


            const company =
                document
                    .getElementById(
                        "editProductCompany"
                    )
                    .value;


            const category =
                document
                    .getElementById(
                        "editProductCategory"
                    )
                    .value;


            const purchasePrice =
                Number(
                    document
                        .getElementById(
                            "editProductPurchasePrice"
                        )
                        .value
                );


            const salePrice =
                Number(
                    document
                        .getElementById(
                            "editProductSalePrice"
                        )
                        .value
                );


            const description =
                document
                    .getElementById(
                        "editProductDescription"
                    )
                    .value
                    .trim();


            // ================= VALIDATION =================

            if (!name) {

                alert(
                    "Product name is required."
                );

                return;

            }


            if (
                Number.isNaN(
                    purchasePrice
                ) ||
                Number.isNaN(
                    salePrice
                )
            ) {

                alert(
                    "Please enter valid prices."
                );

                return;

            }


            if (
                purchasePrice < 0 ||
                salePrice < 0
            ) {

                alert(
                    "Prices cannot be negative."
                );

                return;

            }


            // =================================================
            // REQUEST BODY
            // =================================================

            const updatePayload = {

                name: name,

                company: company,

                category: category,

                purchasePrice:
                    purchasePrice,

                salePrice:
                    salePrice,

                description:
                    description

            };


            // =================================================
            // OFFLINE
            // =================================================

            if (!navigator.onLine) {

                products[selectedIndex] = {

                    ...products[selectedIndex],

                    productName:
                        name,

                    brand:
                        company,

                    company:
                        company,

                    purchasePrice:
                        purchasePrice,

                    salePrice:
                        salePrice,

                    category:
                        category,

                    description:
                        description

                };


                await saveToOfflineDB(
                    "products",
                    products[selectedIndex]
                );


                await addToSyncQueue({

                    endpoint:
                        `/products/${product.id}`,

                    method:
                        "PUT",

                    body:
                        updatePayload

                });


                await recalculateProductRelationshipCounts();


                renderProductsTable();

                updateStatCounts();

                showProductDetails(
                    selectedIndex
                );


                alert(
                    "Product updated offline. It will be synchronized when internet returns."
                );


                return;

            }


            // =================================================
            // ONLINE
            // =================================================

            try {

                const res =
                    await fetch(
                        `${API}/products/${product.id}`,
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
                                    updatePayload
                                )

                        }
                    );


                if (
                    res.status === 401
                ) {

                    window.location.href =
                        "login.html";

                    return;

                }


                const result =
                    await res.json();


                console.log(
                    "Update result:",
                    result
                );


                if (!res.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to update product"
                    );

                }


                // =================================================
                // UPDATE FRONTEND
                // =================================================

                products[selectedIndex] = {

                    ...products[selectedIndex],

                    productName:
                        result.data.name,

                    brand:
                        result.data.company,

                    company:
                        result.data.company,

                    purchasePrice:
                        result.data.purchasePrice,

                    salePrice:
                        result.data.salePrice,

                    category:
                        result.data.category,

                    description:
                        result.data.description ||
                        ""

                };


                // =================================================
                // UPDATE INDEXEDDB
                // =================================================

                await saveToOfflineDB(
                    "products",
                    products[selectedIndex]
                );


                // =================================================
                // REBUILD LOCAL DEPENDENT COUNTS
                // =================================================

                await recalculateProductRelationshipCounts();


                // =================================================
                // REFRESH UI
                // =================================================

                document.getElementById(
                    "editProductForm"
                )
                .style.display =
                    "none";


                document.getElementById(
                    "editProductBtn"
                )
                .style.display =
                    "inline-block";


                showProductDetails(
                    selectedIndex
                );


                alert(
                    "Product updated successfully."
                );

            }

            catch (error) {

                console.error(
                    "Update Product Error:",
                    error
                );


                // =================================================
                // NETWORK FAILURE WHILE ONLINE
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    products[selectedIndex] = {

                        ...products[selectedIndex],

                        productName:
                            name,

                        brand:
                            company,

                        company:
                            company,

                        purchasePrice:
                            purchasePrice,

                        salePrice:
                            salePrice,

                        category:
                            category,

                        description:
                            description

                    };


                    await saveToOfflineDB(
                        "products",
                        products[selectedIndex]
                    );


                    await addToSyncQueue({

                        endpoint:
                            `/products/${product.id}`,

                        method:
                            "PUT",

                        body:
                            updatePayload

                    });


                    await recalculateProductRelationshipCounts();


                    renderProductsTable();

                    showProductDetails(
                        selectedIndex
                    );


                    alert(
                        "Internet connection was lost. Product update was saved offline."
                    );


                    return;

                }


                alert(
                    error.message ||
                    "Failed to update product."
                );

            }

        }
    );


// ===========================================================
// CANCEL EDIT
// ===========================================================

document
    .getElementById(
        "cancelEditProductBtn"
    )
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "editProductForm"
            )
            .style.display =
                "none";


            document.getElementById(
                "editProductBtn"
            )
            .style.display =
                "inline-block";


            if (
                selectedIndex !== null
            ) {

                showProductDetails(
                    selectedIndex
                );

            }

        }
    );


// ===========================================================
// Manual Entry
// ===========================================================

function showManualEntry() {

    selectedIndex = null;


    document.getElementById(
        "detailsPanel"
    )
    .style.display =
        "none";


    document.getElementById(
        "manualPanel"
    )
    .style.display =
        "block";


    document.getElementById(
        "searchWrap"
    )
    .classList.remove(
        "show"
    );


    renderProductsTable();

}


// ===========================================================
// Product table click
// ===========================================================

document
    .getElementById(
        "productTableBody"
    )
    .addEventListener(
        "click",
        async (e) => {

            const btn =
                e.target.closest(
                    "button"
                );


            const tr =
                e.target.closest(
                    "tr"
                );


            if (!tr) return;


            const rowIdx =
                Number(
                    tr.dataset.idx
                );


            const row =
                products[rowIdx];


            if (!row) return;


            // =================================================
            // DELETE
            // =================================================

            if (
                btn &&
                btn.dataset.action ===
                "delete"
            ) {

                e.stopPropagation();


                const confirmDelete =
                    confirm(
                        `Are you sure you want to delete "${row.productName}"?`
                    );


                if (!confirmDelete)
                    return;


                // =================================================
                // OFFLINE DELETE
                // =================================================

                if (!navigator.onLine) {

                    try {

                        await deleteFromOfflineDB(
                            "products",
                            row.id
                        );


                        await addToSyncQueue({

                            endpoint:
                                `/products/${row.id}`,

                            method:
                                "DELETE",

                            body:
                                null

                        });


                        products.splice(
                            rowIdx,
                            1
                        );


                        await recalculateProductRelationshipCounts();


                        if (
                            selectedIndex ===
                            rowIdx
                        ) {

                            selectedIndex =
                                null;

                            showManualEntry();

                        }


                        renderProductsTable();

                        updateStatCounts();


                        alert(
                            "Product deleted offline. It will be synchronized when internet returns."
                        );

                    }

                    catch (error) {

                        console.error(
                            "Offline Delete Error:",
                            error
                        );


                        alert(
                            "Failed to delete product offline."
                        );

                    }


                    return;

                }


                // =================================================
                // ONLINE DELETE
                // =================================================

                try {

                    const res =
                        await fetch(
                            `${API}/products/${row.id}`,
                            {

                                method:
                                    "DELETE",

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


                    const result =
                        await res.json();


                    if (!res.ok) {

                        throw new Error(
                            result.message ||
                            "Failed to delete product"
                        );

                    }


                    // =================================================
                    // REMOVE FROM INDEXEDDB
                    // =================================================

                    await deleteFromOfflineDB(
                        "products",
                        row.id
                    );


                    // =================================================
                    // REMOVE FROM FRONTEND
                    // =================================================

                    products.splice(
                        rowIdx,
                        1
                    );


                    // =================================================
                    // RECALCULATE LOCAL COUNTS
                    // =================================================

                    await recalculateProductRelationshipCounts();


                    if (
                        selectedIndex ===
                        rowIdx
                    ) {

                        selectedIndex =
                            null;

                        showManualEntry();

                    }


                    renderProductsTable();

                    updateStatCounts();


                    alert(
                        "Product deleted successfully."
                    );

                }

                catch (error) {

                    console.error(
                        "Delete Product Error:",
                        error
                    );


                    // =================================================
                    // NETWORK FAILURE
                    // =================================================

                    if (
                        !navigator.onLine
                    ) {

                        try {

                            await deleteFromOfflineDB(
                                "products",
                                row.id
                            );


                            await addToSyncQueue({

                                endpoint:
                                    `/products/${row.id}`,

                                method:
                                    "DELETE",

                                body:
                                    null

                            });


                            products.splice(
                                rowIdx,
                                1
                            );


                            await recalculateProductRelationshipCounts();


                            renderProductsTable();

                            updateStatCounts();


                            alert(
                                "Internet connection was lost. Product deletion was saved offline."
                            );

                        }

                        catch (
                            offlineError
                        ) {

                            console.error(
                                "Offline Delete Error:",
                                offlineError
                            );

                        }


                        return;

                    }


                    alert(
                        error.message ||
                        "Failed to delete product."
                    );

                }


                return;

            }


            // =================================================
            // EDIT
            // =================================================

            if (
                btn &&
                btn.dataset.action ===
                "edit"
            ) {

                e.stopPropagation();


                showProductDetails(
                    rowIdx
                );


                if (
                    selectedIndex === null
                ) {

                    alert(
                        "Please select a product."
                    );

                    return;

                }


                const product =
                    products[selectedIndex];


                document.getElementById(
                    "editProductName"
                )
                .value =
                    product.productName;


                document.getElementById(
                    "editProductCompany"
                )
                .innerHTML =
                    selectOptionsHtml(
                        companyOptions,
                        product.company
                    );


                document.getElementById(
                    "editProductCategory"
                )
                .innerHTML =
                    selectOptionsHtml(
                        categoryOptions,
                        product.category
                    );


                document.getElementById(
                    "editProductPurchasePrice"
                )
                .value =
                    product.purchasePrice;


                document.getElementById(
                    "editProductSalePrice"
                )
                .value =
                    product.salePrice;


                document.getElementById(
                    "editProductDescription"
                )
                .value =
                    product.description || "";


                document.getElementById(
                    "editProductBtn"
                )
                .style.display =
                    "none";


                document.getElementById(
                    "editProductForm"
                )
                .style.display =
                    "block";


                return;

            }


            // =================================================
            // ROW CLICK
            // =================================================

            showProductDetails(
                rowIdx
            );

        }
    );


// ===========================================================
// Search
// ===========================================================

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        renderProductsTable
    );


// ===========================================================
// Stats
// ===========================================================

function updateStatCounts() {

    document.getElementById(
        "totalProductsCount"
    )
    .textContent =
        products.length;


    document.getElementById(
        "totalCompaniesCount"
    )
    .textContent =
        companyOptions.length;


    document.getElementById(
        "totalCategoriesCount"
    )
    .textContent =
        categoryOptions.length;

}


// ===========================================================
// Manual Rows
// ===========================================================

let manualRows = [];


// ===========================================================
// Select Options
// ===========================================================

function selectOptionsHtml(
    options,
    selected
) {

    return options
        .map(
            (opt) => `

                <option
                    value="${opt}"
                    ${
                        opt === selected
                            ? "selected"
                            : ""
                    }>

                    ${opt}

                </option>

            `
        )
        .join("");

}


// ===========================================================
// Render Manual Table
// ===========================================================

function renderManualTable() {

    const tbody =
        document.getElementById(
            "manualTableBody"
        );


    tbody.innerHTML = "";


    manualRows.forEach(
        (row, idx) => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value="${row.id}"
                        data-idx="${idx}"
                        data-field="id">

                </td>


                <td>

                    <input
                        type="text"
                        value="${row.name}"
                        data-idx="${idx}"
                        data-field="name">

                </td>


                <td>

                    <select
                        data-idx="${idx}"
                        data-field="company">

                        ${selectOptionsHtml(
                            companyOptions,
                            row.company
                        )}

                    </select>

                </td>


                <td>

                    <select
                        data-idx="${idx}"
                        data-field="category">

                        ${selectOptionsHtml(
                            categoryOptions,
                            row.category
                        )}

                    </select>

                </td>


                <td>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value="${row.purchasePrice}"
                        data-idx="${idx}"
                        data-field="purchasePrice">

                </td>


                <td>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value="${row.salePrice}"
                        data-idx="${idx}"
                        data-field="salePrice">

                </td>


                <td>

                    <select
                        data-idx="${idx}"
                        data-field="commissionApplicable">

                        ${selectOptionsHtml(
                            comissionApplicable,
                            row.commissionApplicable
                        )}

                    </select>

                </td>


                <td class="col-action">

                    <button
                        class="del-icon"
                        data-idx="${idx}">
                        🗑
                    </button>

                </td>

            `;


            tbody.appendChild(tr);

        }
    );

}


// ===========================================================
// Manual Table Input
// ===========================================================

document
    .getElementById(
        "manualTableBody"
    )
    .addEventListener(
        "input",
        (e) => {

            const field =
                e.target;


            if (
                field.tagName !== "INPUT" &&
                field.tagName !== "SELECT"
            ) {

                return;

            }


            const idx =
                Number(
                    field.dataset.idx
                );


            const key =
                field.dataset.field;


            if (
                key === "id" ||
                key === "purchasePrice" ||
                key === "salePrice"
            ) {

                if (
                    field.value !== "" &&
                    Number(field.value) < 0
                ) {

                    field.value =
                        "0";

                }

            }


            manualRows[idx][key] =
                field.value;

        }
    );


// ===========================================================
// Delete Manual Row
// ===========================================================

document
    .getElementById(
        "manualTableBody"
    )
    .addEventListener(
        "click",
        (e) => {

            const btn =
                e.target.closest(
                    ".del-icon"
                );


            if (!btn) return;


            const idx =
                Number(
                    btn.dataset.idx
                );


            manualRows.splice(
                idx,
                1
            );


            renderManualTable();

        }
    );


// ===========================================================
// Add Row
// ===========================================================

document
    .getElementById(
        "addRowBtn"
    )
    .addEventListener(
        "click",
        () => {

            manualRows.push({

                id: "",

                name: "",

                company:
                    companyOptions[0],

                category:
                    categoryOptions[0] || "",

                purchasePrice: "",

                salePrice: "",

                commissionApplicable:
                    "yes"

            });


            renderManualTable();

        }
    );


// ===========================================================
// Clear All
// ===========================================================

document
    .getElementById(
        "clearAllBtn"
    )
    .addEventListener(
        "click",
        () => {

            manualRows = [];

            renderManualTable();

        }
    );


// ===========================================================
// Cancel
// ===========================================================

document
    .getElementById(
        "cancelBtn"
    )
    .addEventListener(
        "click",
        () => {

            manualRows =
                manualRows.map(
                    () => ({

                        id: "",

                        name: "",

                        company:
                            companyOptions[0],

                        category:
                            categoryOptions[0] ||
                            "",

                        purchasePrice:
                            "",

                        salePrice:
                            "",

                        commissionApplicable:
                            "yes"

                    })
                );


            renderManualTable();

        }
    );


// ===========================================================
// SAVE PRODUCTS
// ===========================================================

document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        async () => {

            // =================================================
            // VALIDATE ROWS
            // =================================================

            const validRows =
                manualRows.filter(
                    row => {

                        if (
                            row.name.trim() === ""
                        ) {

                            return false;

                        }


                        const purchasePrice =
                            Number(
                                row.purchasePrice
                            );


                        const salePrice =
                            Number(
                                row.salePrice
                            );


                        if (
                            Number.isNaN(
                                purchasePrice
                            ) ||
                            Number.isNaN(
                                salePrice
                            )
                        ) {

                            return false;

                        }


                        if (
                            purchasePrice < 0 ||
                            salePrice < 0
                        ) {

                            alert(
                                "Purchase price and sale price cannot be negative."
                            );


                            return false;

                        }


                        return true;

                    }
                );


            // =================================================
            // NO VALID PRODUCTS
            // =================================================

            if (
                validRows.length === 0
            ) {

                alert(
                    "Fill the product input fields."
                );

                return;

            }


            // =================================================
            // PAYLOAD
            // =================================================

            const payload =
                validRows.map(
                    row => ({

                        id:
                            Number(row.id),

                        name:
                            row.name.trim(),

                        company:
                            row.company,

                        purchasePrice:
                            Number(
                                row.purchasePrice
                            ),

                        salePrice:
                            Number(
                                row.salePrice
                            ),

                        category:
                            row.category,

                        commissionApplicable:
                            row.commissionApplicable

                    })
                );


            console.log(
                "Products payload:",
                payload
            );


            // =================================================
            // CREATE FRONTEND PRODUCTS
            // =================================================

            const newProducts =
                payload.map(
                    row => ({

                        id:
                            row.id,

                        productName:
                            row.name,

                        brand:
                            row.company,

                        company:
                            row.company,

                        purchasePrice:
                            row.purchasePrice,

                        salePrice:
                            row.salePrice,

                        category:
                            row.category,

                        commissionApplicable:
                            row.commissionApplicable,

                        description:
                            "",

                        stock:
                            0

                    })
                );


            // =================================================
            // OFFLINE
            // =================================================

            if (!navigator.onLine) {

                try {

                    products.push(
                        ...newProducts
                    );


                    await saveManyToOfflineDB(
                        "products",
                        newProducts
                    );


                    // ONLY product API operation is queued.

                    await addToSyncQueue({

                        endpoint:
                            "/products",

                        method:
                            "POST",

                        body:
                            payload

                    });


                    // Recalculate dependent local data.

                    await recalculateProductRelationshipCounts();


                    renderProductsTable();

                    updateStatCounts();


                    alert(
                        "Products saved offline. They will be synchronized when internet returns."
                    );


                    return;

                }

                catch (error) {

                    console.error(
                        "Offline Save Product Error:",
                        error
                    );


                    alert(
                        "Failed to save products offline."
                    );


                    return;

                }

            }


            // =================================================
            // ONLINE
            // =================================================

            try {

                const res =
                    await fetch(
                        `${API}/products`,
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
                                    payload
                                )

                        }
                    );


                if (
                    res.status === 401
                ) {

                    window.location.href =
                        "login.html";

                    return;

                }


                const result =
                    await res.json();


                console.log(
                    "Products POST result:",
                    result
                );


                if (!res.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to save products"
                    );

                }


                // =================================================
                // USE BACKEND RESPONSE WHEN AVAILABLE
                // =================================================

                if (
                    result.data &&
                    Array.isArray(
                        result.data
                    )
                ) {

                    const backendProducts =
                        result.data.map(
                            mapProduct
                        );


                    products.push(
                        ...backendProducts
                    );


                    await saveManyToOfflineDB(
                        "products",
                        backendProducts
                    );

                }

                else {

                    products.push(
                        ...newProducts
                    );


                    await saveManyToOfflineDB(
                        "products",
                        newProducts
                    );

                }


                // Backend has already performed its authoritative
                // category/supplier updates.
                //
                // Here we rebuild the LOCAL projection.

                await recalculateProductRelationshipCounts();


                renderProductsTable();

                updateStatCounts();


                alert(
                    "Products saved: " +
                    payload.length
                );


                manualRows = [];

                renderManualTable();

            }

            catch (error) {

                console.error(
                    "Save Product API Error:",
                    error
                );


                // =================================================
                // NETWORK LOST DURING REQUEST
                // =================================================

                if (
                    !navigator.onLine
                ) {

                    try {

                        products.push(
                            ...newProducts
                        );


                        await saveManyToOfflineDB(
                            "products",
                            newProducts
                        );


                        await addToSyncQueue({

                            endpoint:
                                "/products",

                            method:
                                "POST",

                            body:
                                payload

                        });


                        await recalculateProductRelationshipCounts();


                        renderProductsTable();

                        updateStatCounts();


                        alert(
                            "Internet connection was lost. Products were saved offline."
                        );

                    }

                    catch (
                        offlineError
                    ) {

                        console.error(
                            "Offline fallback save error:",
                            offlineError
                        );

                    }


                    return;

                }


                alert(
                    error.message ||
                    "Failed to save products."
                );

            }

        }
    );


// ===========================================================
// Open Add Product
// ===========================================================

document
    .getElementById(
        "openAddBtn"
    )
    .addEventListener(
        "click",
        () => {

            showManualEntry();

        }
    );


// ===========================================================
// Mobile Sidebar Toggle
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

    sidebar.classList.add(
        "open"
    );

    overlay.classList.add(
        "show"
    );

}


function closeSidebar() {

    sidebar.classList.remove(
        "open"
    );

    overlay.classList.remove(
        "show"
    );

}


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


overlay.addEventListener(
    "click",
    closeSidebar
);


// ===========================================================
// Sidebar Navigation
// ===========================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        (item) => {

            item.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            (i) =>
                                i.classList.remove(
                                    "active"
                                )
                        );


                    item.classList.add(
                        "active"
                    );


                    closeSidebar();

                }
            );

        }
    );


// ===========================================================
// START APPLICATION
// ===========================================================

initializePage();