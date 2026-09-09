
  // ===========================================================
  //  Products Admin Page - Script
  // ===========================================================
 const API ="https://icecream-management-backend.vercel.app";
  // ---- Product data ----
  let data;
  let products = [];

  const companyOptions = [];
  const categoryOptions = [];
  const comissionApplicable=["yes","no"]


  // ===========================================================
  // GET PRODUCTS
  // ===========================================================
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
const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

console.log(today);
document.getElementById('datePill').textContent=today
  async function getProducts() {

      try {

          const res = await fetch(`${API}/products`,
            {

        credentials: 'include'
    }
          );
         if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
          data = await res.json();

          console.log(data);

          products = data.products.map(product => ({
              id: product.id,
              productName: product.name,
              brand: product.company,
              company: product.company,
              purchasePrice: product.purchasePrice,
              salePrice: product.salePrice,
              category: product.category,
              description: product.description || "",
              stock: product.qunatity,
                commissionApplicable: product.commissionApplicable
          }));

          console.log(products);

          renderProductsTable();
          updateStatCounts();

      } catch (error) {

          console.log("API Error:", error);

      }

  }


  // ===========================================================
  // GET CATEGORIES
  // ===========================================================
  async function getCategories() {

      try {

          const res = await fetch(`${API}/categories`,
            {
        credentials: 'include'
    }
          );
             if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
          const data = await res.json();

          categoryOptions.length = 0;

          data.data.forEach(item => {
              categoryOptions.push(item.name);
          });

          console.log("Categories:", categoryOptions);

      } catch (error) {

          console.log("Category API Error:", error);

      }

  }
  async function getCompanies() {

      try {

          const res = await fetch(`${API}/suppliers`,
            {
        credentials: 'include'
    }
          );
             if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
          const data = await res.json();

          data.forEach(item => {
              companyOptions.push(item.companyName);
          });

          console.log("Companies:",companyOptions);

      } catch (error) {

          console.log("Category API Error:", error);

      }

  }


  // ===========================================================
  // INITIALIZE PAGE
  // ===========================================================
  async function initializePage() {

      // IMPORTANT:
      // Categories must load before manualRows are created
      await getCategories();
      await getCompanies();

      // Now categoryOptions[0] exists
    
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

      const tbody = document.getElementById("productTableBody");

      tbody.innerHTML = "";

      const query = (
          document.getElementById("searchInput").value || ""
      ).trim().toLowerCase();

      products.forEach((row, idx) => {

          if (query) {

              const haystack =
                  row.productName + " " + row.id;

              if (!haystack.toLowerCase().includes(query)) {
                  return;
              }

          }

          const tr = document.createElement("tr");

          tr.dataset.idx = idx;

          if (idx === selectedIndex) {
              tr.classList.add("selected");
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

    const row = products[idx];

    if (!row) return;


    selectedIndex = idx;


    // Hide edit form
    document.getElementById("editProductForm")
        .style.display = "none";


    // Show normal details
    document.getElementById("detailName").textContent =
        row.productName;

    document.getElementById("detailIdShort").textContent =
        "Id:" + row.id;

    document.getElementById("detailFullName").textContent =
        row.productName;

    document.getElementById("detailCompany").textContent =
        row.company;

    document.getElementById("detailCategory").textContent =
        row.category;

    document.getElementById("detailId").textContent =
        row.id;

    document.getElementById("detailDescription").textContent =
        row.description;

    document.getElementById("detailPurchasePrice").textContent =
        "Rs. " + row.purchasePrice;

    document.getElementById("detailSalePrice").textContent =
        "Rs. " + row.salePrice;

    document.getElementById("detailProfit").textContent =
        "Rs. " +
        (row.salePrice - row.purchasePrice);

    document.getElementById("detailStock").innerHTML =
        row.stock +
        '<span class="units">units</span>';


    document.getElementById("manualPanel")
        .style.display = "none";

    document.getElementById("detailsPanel")
        .style.display = "block";

    document.getElementById("searchWrap")
        .classList.add("show");


    renderProductsTable();

}

// ===========================================================
// OPEN EDIT PRODUCT
// ===========================================================

document
    .getElementById("editProductBtn")
    .addEventListener("click", () => {

        if (selectedIndex === null) {

            alert("Please select a product.");

            return;

        }


        const product = products[selectedIndex];


        // Product name
        document.getElementById("editProductName").value =
            product.productName;


        // Company
        document.getElementById("editProductCompany").innerHTML =
            selectOptionsHtml(
                companyOptions,
                product.company
            );


        // Category
        document.getElementById("editProductCategory").innerHTML =
            selectOptionsHtml(
                categoryOptions,
                product.category
            );


        // Prices
        document.getElementById("editProductPurchasePrice").value =
            product.purchasePrice;

        document.getElementById("editProductSalePrice").value =
            product.salePrice;


        // Description
        document.getElementById("editProductDescription").value =
            product.description || "";


        // Hide normal details
        document.querySelectorAll(
            "#detailsPanel > :not(#editProductForm):not(#editProductBtn)"
        );


        // Hide Edit button
        document.getElementById("editProductBtn")
            .style.display = "none";


        // Show edit form
        document.getElementById("editProductForm")
            .style.display = "block";

});


// ===========================================================
// SAVE EDITED PRODUCT
// ===========================================================

document
    .getElementById("saveEditProductBtn")
    .addEventListener("click", async () => {

        if (selectedIndex === null) {

            alert("No product selected.");

            return;

        }


        const product = products[selectedIndex];


        const name =
            document
                .getElementById("editProductName")
                .value
                .trim();


        const company =
            document
                .getElementById("editProductCompany")
                .value;


        const category =
            document
                .getElementById("editProductCategory")
                .value;


        const purchasePrice =
            Number(
                document
                    .getElementById("editProductPurchasePrice")
                    .value
            );


        const salePrice =
            Number(
                document
                    .getElementById("editProductSalePrice")
                    .value
            );


        const description =
            document
                .getElementById("editProductDescription")
                .value
                .trim();


        // ================= VALIDATION =================

        if (!name) {

            alert("Product name is required.");

            return;

        }


        if (
            Number.isNaN(purchasePrice) ||
            Number.isNaN(salePrice)
        ) {

            alert("Please enter valid prices.");

            return;

        }


        if (purchasePrice < 0 || salePrice < 0) {

            alert("Prices cannot be negative.");

            return;

        }


        try {

            const res = await fetch(
                `${API}/products/${product.id}`,
                {

                    method: "PUT",
                     credentials: 'include',
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        company: company,

                        category: category,

                        purchasePrice: purchasePrice,

                        salePrice: salePrice,

                        description: description

                    })

                },
              
            );
 if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

            const result = await res.json();


            console.log("Update result:", result);


            if (!res.ok) {

                throw new Error(
                    result.message ||
                    "Failed to update product"
                );

            }


            // ================= UPDATE FRONTEND =================

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
                    result.data.description || ""

            };


            // ================= REFRESH UI =================

            document.getElementById("editProductForm")
                .style.display = "none";


            document.getElementById("editProductBtn")
                .style.display = "inline-block";


            showProductDetails(selectedIndex);


            alert("Product updated successfully.");

        }
        catch (error) {

            console.error(
                "Update Product Error:",
                error
            );


            alert(
                error.message ||
                "Failed to update product."
            );

        }

});


// ===========================================================
// CANCEL EDIT
// ===========================================================

document
    .getElementById("cancelEditProductBtn")
    .addEventListener("click", () => {

        document.getElementById("editProductForm")
            .style.display = "none";


        document.getElementById("editProductBtn")
            .style.display = "inline-block";


        if (selectedIndex !== null) {

            showProductDetails(selectedIndex);

        }

});





  // ===========================================================
  // Manual Entry
  // ===========================================================
  function showManualEntry() {

      selectedIndex = null;

      document.getElementById("detailsPanel").style.display = "none";

      document.getElementById("manualPanel").style.display = "block";

      document.getElementById("searchWrap").classList.remove("show");

      renderProductsTable();

  }


  
// ===========================================================
// Product table click
// ===========================================================

document
    .getElementById("productTableBody")
    .addEventListener("click", async (e) => {

        const btn = e.target.closest("button");

        const tr = e.target.closest("tr");

        if (!tr) return;


        const rowIdx = Number(tr.dataset.idx);

        const row = products[rowIdx];

        if (!row) return;



        // ===================================================
        // DELETE
        // ===================================================

        if (btn && btn.dataset.action === "delete") {

            e.stopPropagation();


            const confirmDelete = confirm(
                `Are you sure you want to delete "${row.productName}"?`
            );


            if (!confirmDelete) return;


            try {

                const res = await fetch(
                    `${API}/products/${row.id}`,
                    {
                        method: "DELETE",
                             credentials: 'include'
                    }
                    
                );
                 if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

                const result = await res.json();


                if (!res.ok) {

                    throw new Error(
                        result.message || "Failed to delete product"
                    );

                }


                // Remove from frontend
                products.splice(rowIdx, 1);


                // Reset selected product
                if (selectedIndex === rowIdx) {

                    selectedIndex = null;

                    showManualEntry();

                }


                renderProductsTable();

                updateStatCounts();


                alert("Product deleted successfully.");

            }
            catch (error) {

                console.error(
                    "Delete Product Error:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to delete product."
                );

            }


            return;
        }



        // ===================================================
        // EDIT
        // ===================================================

        if (btn && btn.dataset.action === "edit") {

            e.stopPropagation();

            showProductDetails(rowIdx);
             if (selectedIndex === null) {

            alert("Please select a product.");

            return;

        }


        const product = products[selectedIndex];


        // Product name
        document.getElementById("editProductName").value =
            product.productName;


        // Company
        document.getElementById("editProductCompany").innerHTML =
            selectOptionsHtml(
                companyOptions,
                product.company
            );


        // Category
        document.getElementById("editProductCategory").innerHTML =
            selectOptionsHtml(
                categoryOptions,
                product.category
            );


        // Prices
        document.getElementById("editProductPurchasePrice").value =
            product.purchasePrice;

        document.getElementById("editProductSalePrice").value =
            product.salePrice;


        // Description
        document.getElementById("editProductDescription").value =
            product.description || "";


        // Hide normal details
        document.querySelectorAll(
            "#detailsPanel > :not(#editProductForm):not(#editProductBtn)"
        );


        // Hide Edit button
        document.getElementById("editProductBtn")
            .style.display = "none";


        // Show edit form
        document.getElementById("editProductForm")
            .style.display = "block";



            return;

        }



        // ===================================================
        // ROW CLICK
        // ===================================================

        showProductDetails(rowIdx);

    });




  // ===========================================================
  // Search
  // ===========================================================
  document
      .getElementById("searchInput")
      .addEventListener("input", renderProductsTable);


  // ===========================================================
  // Stats
  // ===========================================================
  function updateStatCounts() {

      document.getElementById("totalProductsCount").textContent =
          products.length;
           document.getElementById("totalCompaniesCount").textContent=companyOptions.length;
           document.getElementById("totalCategoriesCount").textContent=categoryOptions.length;

  }


  // ===========================================================
  // Manual Rows
  // ===========================================================

  // IMPORTANT:
  // Do NOT initialize this before getCategories()
  // because categoryOptions is initially empty.

  let manualRows = [];


  // ===========================================================
  // Select Options
  // ===========================================================
  function selectOptionsHtml(options, selected) {

      return options
          .map((opt) => `
              <option
                  value="${opt}"
                  ${opt === selected ? "selected" : ""}>
                  ${opt}
              </option>
          `)
          .join("");

  }


  // ===========================================================
  // Render Manual Table
  // ===========================================================
  function renderManualTable() {

      const tbody =
          document.getElementById("manualTableBody");

      tbody.innerHTML = "";

      manualRows.forEach((row, idx) => {

          const tr = document.createElement("tr");

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

      });

  }


  // ===========================================================
  // Manual Table Input
  // ===========================================================

    document
      .getElementById("manualTableBody")
      .addEventListener("input", (e) => {

          const field = e.target;

          if (
              field.tagName !== "INPUT" &&
              field.tagName !== "SELECT"
          ) {
              return;
          }

          const idx = Number(field.dataset.idx);
          const key = field.dataset.field;

          // Prevent negative ID and prices
          if (
              key === "id" ||
              key === "purchasePrice" ||
              key === "salePrice"
          ) {

              if (field.value !== "" && Number(field.value) < 0) {
                  field.value = "0";
              }
          }

          manualRows[idx][key] = field.value;

      });


  // ===========================================================
  // Delete Manual Row
  // ===========================================================
  document
      .getElementById("manualTableBody")
      .addEventListener("click", (e) => {

          const btn = e.target.closest(".del-icon");

          if (!btn) return;

          const idx = Number(btn.dataset.idx);

          manualRows.splice(idx, 1);

          renderManualTable();

      });


  // ===========================================================
  // Add Row
  // ===========================================================
  document
      .getElementById("addRowBtn")
      .addEventListener("click", () => {

        manualRows.push({
    id: "",
    name: "",
    company: companyOptions[0],
    category: categoryOptions[0] || "",
    purchasePrice: "",
    salePrice: "",
    commissionApplicable: "yes"
});

          renderManualTable();

      });


  // ===========================================================
  // Clear All
  // ===========================================================
  document
      .getElementById("clearAllBtn")
      .addEventListener("click", () => {

          manualRows = [];

          renderManualTable();

      });


  // ===========================================================
  // Cancel
  // ===========================================================
  document
      .getElementById("cancelBtn")
      .addEventListener("click", () => {

       manualRows = manualRows.map(() => ({
    id: "",
    name: "",
    company: companyOptions[0],
    category: categoryOptions[0] || "",
    purchasePrice: "",
    salePrice: "",
    commissionApplicable: "yes"
}));

          renderManualTable();

      });


  // ===========================================================
  // SAVE PRODUCTS
  // ===========================================================
  document
      .getElementById("saveBtn")
      .addEventListener("click", async () => {

        const validRows = manualRows.filter(row => {

      if (row.name.trim() === "") {
          return false;
      }

      const purchasePrice = Number(row.purchasePrice);
      const salePrice = Number(row.salePrice);

      if (purchasePrice < 0 || salePrice < 0) {
          alert("Purchase price and sale price cannot be negative.");
          return false;
      }

      return true;
  });

         const payload = validRows.map(row => ({
    id: Number(row.id),
    name: row.name,
    company: row.company,
    purchasePrice: Number(row.purchasePrice),
    salePrice: Number(row.salePrice),
    category: row.category,
    commissionApplicable: row.commissionApplicable
}));


          payload.forEach(row => {

              products.push({

                  id: row.id,

                  productName: row.name,

                  brand: row.company,

                  company: row.company,

                  purchasePrice: row.purchasePrice,

                  salePrice: row.salePrice,

                  category: row.category,
                  commissionApplicable: row.commissionApplicable,

                  description: "",

                  stock: 0

              });

          });


          renderProductsTable();

          updateStatCounts();

          console.log(payload);

          
          try {
            let a;
            for(let i=0; i<payload.length;i++) {
              a= payload[i].id && payload[i].name && payload[i].purchasePrice && payload[i].salePrice
            
            }
              console.log(typeof(a));
              if(a){

              
              const res = await fetch(
                  `${API}/products`,
                  {
                      method: "POST",
                    credentials: 'include',
                      headers: {
                          "Content-Type": "application/json"
                      },

                      body: JSON.stringify(payload)
                  },
                  
              );

               if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
              const result = await res.json();

              console.log(result);

              alert(
                  "Products saved: " +
                  payload.length
              );
            }
            else{
              alert("fill the input field")
            }
          } catch (error) {

              console.error(
                  "Save Product API Error:",
                  error
              );

          }

      });


  // ===========================================================
  // Open Add Product
  // ===========================================================
  document
      .getElementById("openAddBtn")
      .addEventListener("click", () => {

          showManualEntry();

      });


  // ===========================================================
  // Mobile Sidebar Toggle
  // ===========================================================
  const sidebar =
      document.getElementById("sidebar");

  const overlay =
      document.getElementById("sidebarOverlay");

  const menuToggle =
      document.getElementById("menuToggle");


  function openSidebar() {

      sidebar.classList.add("open");

      overlay.classList.add("show");

  }


  function closeSidebar() {

      sidebar.classList.remove("open");

      overlay.classList.remove("show");

  }


  menuToggle.addEventListener("click", () => {

      if (sidebar.classList.contains("open")) {

          closeSidebar();

      } else {

          openSidebar();

      }

  });


  overlay.addEventListener(
      "click",
      closeSidebar
  );


  // ===========================================================
  // Sidebar Navigation
  // ===========================================================
  document
      .querySelectorAll(".nav-item")
      .forEach((item) => {

          item.addEventListener("click", () => {

              document
                  .querySelectorAll(".nav-item")
                  .forEach((i) =>
                      i.classList.remove("active")
                  );

              item.classList.add("active");

              closeSidebar();

          });

      });


  // ===========================================================
  // START APPLICATION
  // ===========================================================
  initializePage();

