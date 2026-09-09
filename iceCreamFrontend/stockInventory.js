// ===========================================================
//  Stock Inventory Admin Page - Script
// ===========================================================

// ---- Data ----
// unitPrice x availableStock = stock value for that row.
// const inventory = [
//   { id: 1, product: "Cornetto Classic", company: "Walls", category: "Cone", availableStock: 545, lastPurchase: "02 Jul 2026", unitPrice: 700 },
//   { id: 2, product: "Mango Cup", company: "Omore", category: "Cup", availableStock: 320, lastPurchase: "01 Jul 2026", unitPrice: 700 },
//   { id: 3, product: "Kulfi Stick", company: "Hico", category: "Stick", availableStock: 15, lastPurchase: "28 Jun 2026", unitPrice: 700 },
//   { id: 4, product: "Family Pack Vanilla", company: "Walls", category: "Family Pack", availableStock: 0, lastPurchase: "20 Jun 2026", unitPrice: 1200 },
//   { id: 5, product: "Choc Bar", company: "Igloo", category: "Stick", availableStock: 210, lastPurchase: "30 Jun 2026", unitPrice: 500 },
//   { id: 6, product: "Strawberry Cone", company: "Yummy", category: "Cone", availableStock: 8, lastPurchase: "25 Jun 2026", unitPrice: 700 },
//   { id: 7, product: "Butterscotch Cup", company: "Polka", category: "Cup", availableStock: 0, lastPurchase: "15 Jun 2026", unitPrice: 650 },
//   { id: 8, product: "Vanilla Tub", company: "Walls", category: "Family Pack", availableStock: 95, lastPurchase: "29 Jun 2026", unitPrice: 700 }
// ];
const API= "https://ice-cream-management.vercel.app";
let inventory=[];

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
    const res = await fetch(`${API}/products`,  {
        credentials: 'include'
    }
);
                 if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
          
    const data = await res.json();

    inventory = data.products.map((product) => ({
      id: product.id,
      product: product.name,
      company: product.company,
      category: product.category,
      availableStock: product.qunatity,
      lastPurchase: product.lastPurchase
        ? product.lastPurchase.substring(0, 10)
        : "",
      unitPrice: product.purchasePrice
    }));

    // Get unique categories from server data
    const categories = [
      ...new Set(
        data.products
          .map(product => product.category)
          .filter(category => category)
      )
    ];

    populateCategoryDropdown(categories);

    console.log(inventory);

    renderInventoryTable();

  } catch (error) {
    console.error("Failed to load products:", error);
  }
}

getProducts();

// Low Stock / Out of Stock thresholds
const LOW_STOCK_THRESHOLD = 20;

function computeStatus(stock) {
    if (stock <= 0) return "Out of Stock";
    if (stock <= LOW_STOCK_THRESHOLD) return "Low Stock";
    return "In Stock";
}
function statusClass(status) {
  if (status === "Out of Stock") return "out";
  if (status === "Low Stock") return "low";
  return "active";
}

function formatMoney(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
  return n.toLocaleString();
}

// ---- Table rendering ----
function renderInventoryTable() {

    const tbody = document.getElementById("inventoryTableBody");

    const query =
        (document.getElementById("searchInput").value || "")
        .trim()
        .toLowerCase();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const selectedStock =
        document.getElementById("stockFilter").value;

    tbody.innerHTML = "";

    inventory.forEach((row) => {

        // --------------------------------
        // Search by NAME or ID only
        // --------------------------------
        if (query) {

            const productName =
                String(row.product).toLowerCase();

            const productId =
                String(row.id);

            const matchesSearch =
                productName.includes(query) ||
                productId.includes(query);

            if (!matchesSearch) return;
        }


        // --------------------------------
        // Category filter
        // --------------------------------
        if (
            selectedCategory &&
            row.category !== selectedCategory
        ) {
            return;
        }


        // --------------------------------
        // Stock availability filter
        // --------------------------------
        if (selectedStock) {

            const stock = row.availableStock;

            // In Stock
            if (
                selectedStock === "in-stock" &&
                stock <= LOW_STOCK_THRESHOLD
            ) {
                return;
            }

            // Low Stock
            if (
                selectedStock === "low-stock" &&
                (stock <= 0 || stock > LOW_STOCK_THRESHOLD)
            ) {
                return;
            }

            // Out of Stock
            if (
                selectedStock === "out-of-stock" &&
                stock > 0
            ) {
                return;
            }
        }


        // --------------------------------
        // Create row
        // --------------------------------
        const status =
            computeStatus(row.availableStock);

        const stockValue =
            row.unitPrice * row.availableStock;

        const tr =
            document.createElement("tr");

        tr.dataset.id = row.id;

        tr.innerHTML = `
            <td>${row.id}</td>

            <td>${row.product}</td>

            <td>${row.company}</td>

            <td>${row.category}</td>

            <td>${row.availableStock}</td>

            <td>${row.lastPurchase}</td>

            <td>${stockValue.toLocaleString()}</td>

            <td>
                <span class="status-badge-pill ${statusClass(status)}">
                    <span class="dot"></span>
                    ${status}
                </span>
            </td>

            <td>
                <div class="action-cell">

                    <button
                        class="btn btn-edit"
                        data-id="${row.id}"
                        data-action="edit"
                    >
                        &#9998;
                        <span class="btn-label">
                            Edit
                        </span>
                    </button>

                    <button
                        class="btn btn-delete"
                        data-id="${row.id}"
                        data-action="delete"
                    >
                        &#128465;
                        <span class="btn-label">
                            Delete
                        </span>
                    </button>

                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    updateStatCards();
}

document.getElementById("inventoryTableBody").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const row = inventory.find((r) => r.id === id);
  if (!row) return;

  if (btn.dataset.action === "delete") {
    const idx = inventory.findIndex((r) => r.id === id);
    inventory.splice(idx, 1);
    renderInventoryTable();
    return;
  }

  if (btn.dataset.action === "edit") {
    const input = prompt(`Update available stock for "${row.product}":`, row.availableStock);
    if (input === null) return;
    const newStock = Math.max(0, parseInt(input, 10) || 0);
    row.availableStock = newStock;
    renderInventoryTable();
  }
});

document.getElementById("searchInput").addEventListener("input", renderInventoryTable);
document
  .getElementById("categoryFilter")
  .addEventListener("change", renderInventoryTable);
  document
    .getElementById("stockFilter")
    .addEventListener("change", renderInventoryTable);


// ---- Live stat cards, computed from current inventory data ----
function updateStatCards() {
  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((sum, r) => sum + r.availableStock, 0);
  const totalValue = inventory.reduce((sum, r) => sum + r.unitPrice * r.availableStock, 0);
  const lowStockCount = inventory.filter((r) => computeStatus(r.availableStock) === "Low Stock").length;
  const outOfStockCount = inventory.filter((r) => computeStatus(r.availableStock) === "Out of Stock").length;

  document.getElementById("statTotalProducts").textContent = totalProducts;
  document.getElementById("statTotalStock").textContent = totalStock.toLocaleString();
  document.getElementById("statStockValue").textContent = formatMoney(totalValue);
  document.getElementById("statLowStock").textContent = lowStockCount + (lowStockCount === 1 ? " Product" : " Products");
  document.getElementById("statOutOfStock").textContent = outOfStockCount + (outOfStockCount === 1 ? " Product" : " Products");
}

renderInventoryTable();

// ---- Mobile sidebar toggle ----
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
menuToggle.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
});
overlay.addEventListener("click", closeSidebar);

// ---- Sidebar nav ----
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    closeSidebar();
  });
});

function populateCategoryDropdown(categories) {
  const categoryFilter = document.getElementById("categoryFilter");

  // Keep "All Categories"
  categoryFilter.innerHTML = `
    <option value="">All Categories</option>
  `;

  categories.forEach((category) => {
    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    categoryFilter.appendChild(option);
  });
}
const selectedStock =
    document.getElementById("stockFilter").value;