
// ===========================================================
// Categories Admin Page Script
// ===========================================================
// const API ="https://ice-cream-management.vercel.app";

let categories = [];
let manualRows = [];


// ================= GET CATEGORIES =================

let adminUser;

getLocalStorageUser = () => {

    if (!localStorage.getItem('user')) {

        window.location.href = 'login.html';

        return;

    }

    adminUser =
        JSON.parse(localStorage.getItem('user'));

    console.log(adminUser.email);

};

getLocalStorageUser();

document.getElementById('admin').textContent =
    adminUser.email;

const today =
    new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

console.log(today);

document.getElementById('datePill').textContent =
    today;


async function getData() {

    try {

        // ==========================================
        // 1. Get categories from local IndexedDB
        // ==========================================

        const localCategories =
            await getAllFromOfflineDB("categories");


        console.log(
            "Categories from IndexedDB:",
            localCategories
        );


        // ==========================================
        // 2. If local data exists, display it first
        // ==========================================

        if (localCategories.length > 0) {

            categories = localCategories;

            renderCategoriesTable();
            updateStatCounts();

        }


        // ==========================================
        // 3. Try to get latest data from backend
        // ==========================================

        const res = await fetch(
            `${window.APP_CONFIG.API}/categories`,
            {
                credentials: "include"
            }
        );


        // ==========================================
        // 4. Authentication check
        // ==========================================

        if (res.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        // ==========================================
        // 5. Backend response
        // ==========================================

        if (!res.ok) {

            throw new Error(
                "Failed to fetch categories"
            );

        }


        const data =
            await res.json();


        console.log(
            "Categories from backend:",
            data
        );


        // ==========================================
        // 6. Convert backend data to frontend format
        // ==========================================

        categories =
            data.data.map(category => ({

                id: category.id,

                category: category.name,

                description: category.Description,

                products:
                    category.totalProducts || 0,

                status: "Active"

            }));


        // ==========================================
        // 7. Save latest backend data locally
        // ==========================================

        await clearOfflineStore(
            "categories"
        );


        await saveManyToOfflineDB(
            "categories",
            categories
        );


        console.log(
            "Categories synchronized to IndexedDB."
        );


        // ==========================================
        // 8. Render latest backend data
        // ==========================================

        renderCategoriesTable();
        updateStatCounts();

    }

    catch (error) {

        console.error(
            "Category synchronization error:",
            error
        );


        // ==========================================
        // 9. If backend failed, keep using local data
        // ==========================================

        try {

            const localCategories =
                await getAllFromOfflineDB(
                    "categories"
                );


            if (localCategories.length > 0) {

                categories =
                    localCategories;

                renderCategoriesTable();
                updateStatCounts();


                console.log(
                    "Using offline categories."
                );

            }

        }

        catch (localError) {

            console.error(
                "IndexedDB error:",
                localError
            );

        }

    }

}


// ================= CATEGORY TABLE =================


function renderCategoriesTable() {

    const tbody =
        document.getElementById(
            "catTableBody"
        );


    tbody.innerHTML = "";


    categories.forEach((row, index) => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

        <td>${row.id}</td>

        <td>${row.category}</td>

        <td>${row.description}</td>

        <td>${row.products}</td>

        <td>${row.status}</td>


        <td>

        <button 
        class="btn btn-edit"
        data-index="${index}">
        ✎ Edit
        </button>


        <button 
        class="btn btn-delete"
        data-index="${index}">
        🗑 Delete
        </button>


        </td>

        `;


        tbody.appendChild(tr);

    });

}


// ================= EDIT DELETE =================

document
    .getElementById("catTableBody")
    .addEventListener("click", async (e) => {

        const button =
            e.target.closest("button");


        if (!button) return;


        const index =
            Number(button.dataset.index);


        const category =
            categories[index];


        if (!category) return;


        // ================= DELETE =================

        if (
            button.classList.contains(
                "btn-delete"
            )
        ) {

            const confirmDelete =
                confirm(
                    `Are you sure you want to delete "${category.category}"?`
                );


            if (!confirmDelete) return;


            try {

                // =====================================================
                // OFFLINE DELETE
                // =====================================================

                if (!navigator.onLine) {

                    // Remove from IndexedDB
                    await deleteFromOfflineDB(
                        "categories",
                        category.id
                    );


                    // Add DELETE operation to global sync queue
                    await addToSyncQueue(
                        createCategoryDeleteSyncOperation(
                            category.id
                        )
                    );


                    // Remove from frontend
                    categories.splice(
                        index,
                        1
                    );


                    renderCategoriesTable();
                    updateStatCounts();


                    alert(
                        "Category deleted offline. It will be removed from the server when internet returns."
                    );


                    return;

                }


                // =====================================================
                // ONLINE DELETE
                // =====================================================

                const res = await fetch(
                    `${window.APP_CONFIG.API}/categories/${category.id}`,
                    {
                        method: "DELETE",
                        credentials: 'include'
                    }
                );


                // =====================================================
                // JWT EXPIRED
                // =====================================================

                if (res.status === 401) {

                    window.location.href =
                        'login.html';

                    return;

                }


                const data =
                    await res.json();


                if (!res.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to delete category"
                    );

                }


                // =====================================================
                // DELETE FROM LOCAL INDEXEDDB
                // =====================================================

                await deleteFromOfflineDB(
                    "categories",
                    category.id
                );


                // =====================================================
                // REMOVE FROM FRONTEND
                // =====================================================

                categories.splice(
                    index,
                    1
                );


                renderCategoriesTable();
                updateStatCounts();


                alert(
                    "Category deleted successfully."
                );

            }

            catch (error) {

                console.error(
                    "Delete Error:",
                    error
                );

                alert(
                    error.message
                );

            }

        }


        // ================= EDIT =================

        if (
            button.classList.contains(
                "btn-edit"
            )
        ) {

            const newName =
                prompt(
                    "Enter category name:",
                    category.category
                );


            if (newName === null) return;


            const newDescription =
                prompt(
                    "Enter category description:",
                    category.description || ""
                );


            if (newDescription === null) return;


            const updatedCategory = {

                id: category.id,

                category:
                    newName.trim(),

                description:
                    newDescription.trim(),

                products:
                    category.products || 0,

                status: "Active"

            };


            if (!updatedCategory.category) {

                alert(
                    "Category name cannot be empty."
                );

                return;

            }


            try {

                const result =
                    await updateCategory(
                        category.id,
                        updatedCategory
                    );


                // Update frontend
                categories[index] =
                    updatedCategory;


                renderCategoriesTable();
                updateStatCounts();


                if (result.offline) {

                    alert(
                        "Category updated offline. It will sync when internet returns."
                    );

                }
                else {

                    alert(
                        "Category updated successfully."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Edit Error:",
                    error
                );

                alert(
                    error.message
                );

            }

        }

    });


// ================= COUNTS =================


function updateStatCounts() {

    document.getElementById(
        "allCatCount"
    ).textContent =
        categories.length;


    const active =
        categories.filter(
            c => c.status === "Active"
        ).length;


    document.getElementById(
        "activeCatCount"
    ).textContent =
        active;


    document.getElementById(
        "inactiveCatCount"
    ).textContent =
        categories.length - active;

}


// ================= MANUAL TABLE =================


manualRows = [];


function renderManualTable() {

    const tbody =
        document.getElementById(
            "manualTableBody"
        );


    tbody.innerHTML = "";


    manualRows.forEach((row, index) => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

        <td>${index + 1}</td>


        <td>
        <input 
        value="${row.id}"
        data-index="${index}"
        data-field="id">
        </td>


        <td>
        <input 
        value="${row.category}"
        data-index="${index}"
        data-field="category">
        </td>


        <td>
        <input 
        value="${row.description}"
        data-index="${index}"
        data-field="description">
        </td>


        <td>

        <button 
        class="del-icon"
        data-index="${index}">
        🗑
        </button>

        </td>


        `;


        tbody.appendChild(tr);

    });

}


// ================= UPDATE INPUTS =================


document
    .getElementById("manualTableBody")
    .addEventListener("input", (e) => {

        if (
            e.target.tagName !== "INPUT"
        )
            return;


        const index =
            e.target.dataset.index;


        const field =
            e.target.dataset.field;


        manualRows[index][field] =
            e.target.value;

    });


// ================= DELETE MANUAL ROW =================


document
    .getElementById("manualTableBody")
    .addEventListener("click", (e) => {

        const btn =
            e.target.closest(
                ".del-icon"
            );


        if (!btn) return;


        const index =
            Number(btn.dataset.index);


        manualRows.splice(
            index,
            1
        );


        renderManualTable();

    });


// ================= ADD ROW =================


document
    .getElementById("addRowBtn")
    .addEventListener("click", () => {

        manualRows.push({

            id: "",
            category: "",
            description: ""

        });


        renderManualTable();

    });


// ================= CLEAR =================


document
    .getElementById("clearAllBtn")
    .addEventListener("click", () => {

        manualRows = [];


        renderManualTable();

    });


// ================= CANCEL =================


document
    .getElementById("cancelBtn")
    .addEventListener("click", () => {

        manualRows =
            manualRows.map(() => ({

                id: "",
                category: "",
                description: ""

            }));


        renderManualTable();

    });


// ================= SAVE =================


document
    .getElementById("saveBtn")
    .addEventListener("click", async () => {

        const newCategories =
            manualRows.filter(
                row =>
                    row.category.trim() != ""
            );


        const payload =
            newCategories.map(row => ({

                id: Number(row.id),

                name: row.category,

                Description: row.description,

                totalProducts: 0

            }));


        console.log(payload);


        try {

            for (
                const category
                of newCategories
            ) {

                await createCategory({

                    id: Number(category.id),

                    category:
                        category.category,

                    description:
                        category.description,

                    products:
                        category.products || 0

                });

            }


            alert(
                "Categories saved: "
                + newCategories.length
            );


            getData();

        }

        catch (error) {

            console.log(error);

        }

    });


// ================= OPEN ADD =================


document
    .getElementById("openAddBtn")
    .addEventListener("click", () => {

        manualRows.push({

            id: "",
            category: "",
            description: ""

        });


        renderManualTable();

    });


// ================= START =================


getData();

renderManualTable();


// ================= CREATE CATEGORY OFFLINE/ONLINE =================

async function createCategory(category) {

    // ================= OFFLINE =================

    if (!navigator.onLine) {

        await saveToOfflineDB(
            "categories",
            category
        );


        await addToSyncQueue(
            createCategorySyncOperation({

                id: category.id,

                name: category.category,

                Description:
                    category.description,

                totalProducts:
                    category.products || 0

            })
        );


        console.log(
            "Category saved locally and added to sync queue."
        );


        return {

            success: true,

            offline: true

        };

    }


    // ================= ONLINE =================

    const res = await fetch(
        `${window.APP_CONFIG.API}/categories`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            credentials: "include",

            body: JSON.stringify([{

                id: Number(category.id),

                name: category.category,

                Description:
                    category.description,

                totalProducts:
                    category.products || 0

            }])

        }
    );


    if (res.status === 401) {

        window.location.href =
            "login.html";


        return {

            success: false

        };

    }


    if (!res.ok) {

        throw new Error(
            "Failed to create category"
        );

    }


    const data =
        await res.json();


    console.log(
        "Category created on backend:",
        data
    );


    // Save the successfully created category locally

    await saveToOfflineDB(
        "categories",
        category
    );


    return {

        success: true,

        offline: false

    };

}


function createCategorySyncOperation(
    category
) {

    return {

        resource: "categories",

        action: "create",

        method: "POST",

        endpoint: "/categories",

        body: [category]

    };

}


function createCategoryUpdateSyncOperation(
    categoryId,
    category
) {

    return {

        resource: "categories",

        action: "update",

        method: "PUT",

        endpoint:
            `/categories/${categoryId}`,

        body: category

    };

}


function createCategoryDeleteSyncOperation(
    categoryId
) {

    return {

        resource: "categories",

        action: "delete",

        method: "DELETE",

        endpoint:
            `/categories/${categoryId}`,

        body: {
            id: categoryId
        }

    };

}


// ================= UPDATE CATEGORY OFFLINE/ONLINE =================

async function updateCategory(
    categoryId,
    updatedCategory
) {

    // ================= OFFLINE =================

    if (!navigator.onLine) {

        await saveToOfflineDB(
            "categories",
            updatedCategory
        );


        await addToSyncQueue(
            createCategoryUpdateSyncOperation(
                categoryId,
                {
                    name:
                        updatedCategory.category,

                    Description:
                        updatedCategory.description,

                    totalProducts:
                        updatedCategory.products || 0
                }
            )
        );


        console.log(
            "Category updated locally and added to sync queue."
        );


        return {

            success: true,

            offline: true

        };

    }


    // ================= ONLINE =================

    const res = await fetch(
        `${window.APP_CONFIG.API}/categories/${categoryId}`,
        {

            method: "PUT",

            credentials: "include",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                name:
                    updatedCategory.category,

                Description:
                    updatedCategory.description,

                totalProducts:
                    updatedCategory.products || 0

            })

        }
    );


    // ================= JWT EXPIRED =================

    if (res.status === 401) {

        window.location.href =
            "login.html";


        return {

            success: false

        };

    }


    if (!res.ok) {

        const data =
            await res.json();


        throw new Error(
            data.message ||
            "Failed to update category"
        );

    }


    const data =
        await res.json();


    console.log(
        "Category updated on backend:",
        data
    );


    // Save successful update locally

    await saveToOfflineDB(
        "categories",
        updatedCategory
    );


    return {

        success: true,

        offline: false

    };

}

