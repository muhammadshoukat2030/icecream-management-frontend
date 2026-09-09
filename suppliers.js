const addBtn = document.getElementById("openAddSupplierBtn");
const addPanel = document.getElementById("addSupplierPanel");
const supplierPanel = document.getElementById("supplierPanel");
const API= "https://ice-cream-management.vercel.app";
// https://ice-cream-management.vercel.app
let suppliers = [];
let recentInvoices=[];

// ================= LOAD SUPPLIERS =================

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
async function loadSuppliers() {

    try {

        const response = await fetch(`${API}/suppliers`,
            {
        credentials: 'include'
    }
        );
 if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

        if(!response.ok){

            throw new Error("Failed loading suppliers");

        }


        suppliers = await response.json();


        console.log("Suppliers:", suppliers);


        renderSuppliers(suppliers);
        renderStats(suppliers)



        if(suppliers.length > 0){

            renderSupplierDetails(suppliers[0]);

        }


    }
    catch(err){

        console.log(err);

        alert("Unable to load suppliers");

    }

}



document.addEventListener("DOMContentLoaded",()=>{

    loadSuppliers();

});





// ================= FORMAT NUMBER =================


function formatNumber(value){

    return Number(value || 0)
    .toLocaleString("en-PK");

}






// ================= RENDER SUPPLIER TABLE =================



function renderSuppliers(data){


const tbody =
document.getElementById("suppliersTbody");


tbody.innerHTML="";



if(data.length===0){

tbody.innerHTML=`

<tr>
<td colspan="9">
No suppliers found
</td>
</tr>

`;

return;

}



data.forEach((s)=>{


tbody.insertAdjacentHTML(

"beforeend",

`

<tr class="supplier-row" data-id="${s.id}">


<td>${s.id}</td>


<td>${s.companyName}</td>


<td>${s.phone || "-"}</td>


<td>${s.contactPerson || "-"}</td>


<td>${s.totalProducts || 0}</td>


<td>${s.lastPayment.amount|| "-"}</td>


<td>
Rs. ${formatNumber(s.outstandingBalance)}
</td>



<td>

<span class="status-badge ${s.status ? "active":"inactive"}">

<span class="dot"></span>

${s.status ? "Active":"Inactive"}

</span>


</td>



<td>


<button 
class="edit-btn"
data-id="${s.id}">

Edit

</button>



<button 
class="delete-btn"
data-id="${s.id}">

Delete

</button>


</td>



</tr>


`

);


});




// ================= ROW CLICK =================


document
.querySelectorAll(".supplier-row")
.forEach(row=>{


row.addEventListener("click",()=>{


const id =
Number(row.dataset.id);



const supplier =
suppliers.find(
s=>s.id===id
);



if(supplier){

    // hide add form
    addPanel.classList.add("hidden");


    // show details panel
    supplierPanel.classList.remove("hidden");


    renderSupplierDetails(supplier);

}

});


});




// ================= EDIT BUTTON =================


document
.querySelectorAll(".edit-btn")
.forEach(btn=>{


btn.addEventListener("click",(e)=>{


// stop row click

e.stopPropagation();



const id =
Number(btn.dataset.id);



editSupplier(id);



});


});





// ================= DELETE BUTTON =================


document
.querySelectorAll(".delete-btn")
.forEach(btn=>{


btn.addEventListener("click",(e)=>{


// stop row click

e.stopPropagation();



const id =
Number(btn.dataset.id);



deleteSupplier(id);



});


});



}
// ================= ADD SUPPLIER FORM =================


addBtn?.addEventListener("click",()=>{

supplierPanel.classList.add("hidden");
addPanel.classList.remove("hidden");



addPanel.innerHTML = `


<div class="table-head">

<h2>Add Supplier</h2>

</div>



<form id="supplierForm" class="supplier-form">



<input 
id="id"
type="number"
placeholder="Supplier ID"
required>



<input 
id="companyName"
placeholder="Company Name"
required>



<input 
id="contactPerson"
placeholder="Contact Person"
required>



<input 
id="phone"
placeholder="Phone Number"
required>



<input 
id="whatsapp"
placeholder="Whatsapp">



<input 
id="email"
type="email"
placeholder="Email">



<input 
id="city"
placeholder="City">



<textarea
id="address"
placeholder="Address">
</textarea>




<select id="status">


<option value="true">
Active
</option>


<option value="false">
Inactive
</option>


</select>




<input
id="outstandingBalance"
type="number"
placeholder="Outstanding Balance">





<input
id="totalPurchases"
type="number"
placeholder="Total Purchases">





<input
id="productsSupplied"
type="number"
placeholder="Total Products">





<input
id="lastPayment"
type="number"
placeholder="Last Payment">





<button type="submit">

Save Supplier

</button>



</form>


`;




document
.getElementById("supplierForm")
.addEventListener(
"submit",
addSupplier
);



});







// ================= POST SUPPLIER =================



async function addSupplier(e){


e.preventDefault();




const supplier = {


id:
Number(
document.getElementById("id").value
),



companyName:
document.getElementById("companyName").value,



contactPerson:
document.getElementById("contactPerson").value,



phone:
document.getElementById("phone").value,



whatsapp:
document.getElementById("whatsapp").value,



email:
document.getElementById("email").value,



city:
document.getElementById("city").value,



address:
document.getElementById("address").value,



status:
document.getElementById("status").value==="true",



outstandingBalance:
Number(
document.getElementById("outstandingBalance").value
),



totalPurchases:
Number(
document.getElementById("totalPurchases").value
),



monthlyPurchases:0,



totalProducts:
Number(
document.getElementById("productsSupplied").value
),



partnerSince:"",



logo:"",



lastPayment:{


amount:
Number(
document.getElementById("lastPayment").value
),


date:""


},



products:[]


};




try{


const response = await fetch(
`${API}/suppliers`,
{

method:"POST",

 credentials: 'include',
headers:{

"Content-Type":"application/json"

},


body:
JSON.stringify(supplier)


});

 if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

const result =
await response.json();



console.log(result);



alert("Supplier Added");



location.reload();



}

catch(err){


console.log(err);


alert("Failed to add supplier");


}



}









// ================= RIGHT SIDE DETAILS =================



async function renderSupplierDetails(s) {
const res=await fetch(`${API}/suppliers/recent-invoices?id=${s.id}`,
    {
        credentials: 'include'
    }
);
 if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
 recentInvoices=await res.json();

console.log("now checking invoices",recentInvoices.invoices);
console.log("now checking products",recentInvoices.products);

    const panel = document.getElementById("supplierPanel");

    const purchases = recentInvoices.invoices || [];
    const products = recentInvoices.products || [];
    const visibleProducts = products.slice(0, 4);
    const moreCount = products.length - visibleProducts.length;
    console.log('only last payment',s.lastPayment)
    console.log(s.lastPayment.amount)

    panel.innerHTML = `

        <div class="profile-top">
            <div class="supplier-logo" style="background:${s.logo ? "transparent" : "#c9c7e6"}">
                ${s.logo
                    ? `<img src="${s.logo}" alt="${s.companyName}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
                    : ""
                }
            </div>
            <div>
                <div class="profile-name">${s.companyName}</div>
                <span class="status-badge ${s.status ? "active" : "inactive"}">
                    <span class="dot"></span>
                    ${s.status ? "Active" : "Inactive"}
                </span>
            </div>
        </div>

        <div class="section-block">
            <div class="section-title">Contact Information</div>
            <div class="info-grid">
                <div>
                    <div class="info-label">Contact Person</div>
                    <div class="info-value">${s.contactPerson || "-"}</div>
                </div>
                <div>
                    <div class="info-label">Phone</div>
                    <div class="info-value">${s.phone || "-"}</div>
                </div>
                <div>
                    <div class="info-label">Email</div>
                    <div class="info-value">${s.email || "-"}</div>
                </div>
                <div>
                    <div class="info-label">Address</div>
                    <div class="info-value">${s.address || "-"}</div>
                </div>
                <div>
                    <div class="info-label">City</div>
                    <div class="info-value">${s.city || "-"}</div>
                </div>
            </div>
        </div>

        <div class="section-block">
            <div class="section-title">Summary</div>
            <div class="summary-grid">
                <div class="summary-box">
                    <div class="summary-label">Products Supplied</div>
                    <div class="summary-value">${s.totalProducts || 0}</div>
                </div>
                <div class="summary-box">
                    <div class="summary-label">Total Purchases</div>
                    <div class="summary-value">Rs. ${formatNumber(s.totalPurchases)}</div>
                </div>
                <div class="summary-box">
                    <div class="summary-label">Last Purchase</div>
                    <div class="summary-value">${s.lastPayment.amount || "-"}</div>
                </div>
                <div class="summary-box">
                    <div class="summary-label">Outstanding Balance</div>
                    <div class="summary-value red">Rs. ${formatNumber(s.outstandingBalance)}</div>
                </div>
            </div>
        </div>

        <div class="section-block">
            <div class="table-head" style="padding:0;border:none;margin-bottom:12px;">
                <div class="section-title" style="margin:0;">Recent Purchases</div>
                <a href="#" class="view-all">View All</a>
            </div>
            ${
                purchases.length
                ? purchases.slice(0, 3).map(p => `
                    <div class="invoice-row">
                        <span>${p.date.substring(0,10) || "-"}</span>
                        <span>${p.items.length ?? "-"}</span>
                        <span>Rs. ${formatNumber(p.netTotal)}</span>
                    </div>
                `).join("")
                : `<div class="invoice-row"><span>No recent purchases</span></div>`
            }
        </div>

        <div class="section-block">
            <div class="table-head" style="padding:0;border:none;margin-bottom:12px;">
                <div class="section-title" style="margin:0;">Products Supplied</div>
                <a href="#" class="view-all">View All</a>
            </div>
            <div class="chip-row">
                ${visibleProducts.map(p => `<span class="chip">${typeof p === "string" ? p : p.name}</span>`).join("")}
                ${moreCount > 0 ? `<span class="chip more">+${moreCount} more</span>` : ""}
                ${products.length === 0 ? `<span class="chip">No products yet</span>` : ""}
            </div>
        </div>

        <div class="quick-actions">
            <div class="qa-row">
                <button class="btn-outline" id="createPurchaseBtn">Create Purchase</button>
                <button class="btn-outline" id="editSupplierBtn">Edit Supplier</button>
            </div>
            <button class="btn-solid" id="viewFullProfileBtn" >View Full Profile</button>
        </div>

    `;

    addPanel.classList.add("hidden");
    panel.classList.remove("hidden");

    document.getElementById("editSupplierBtn")
        ?.addEventListener("click", () => editSupplier(s.id));

    document.getElementById("viewFullProfileBtn")
        ?.addEventListener("click", () => {
            window.location.href = `./suppliers-details.html?id=${s.id}`;
        });

    document.getElementById("createPurchaseBtn")
        ?.addEventListener("click", () => {
            window.location.href = `purchase-stocks.html?supplierId=${s.id}`;
        });
}

function editSupplier(id) {

    const supplier = suppliers.find(
        s => s.id === id
    );

    if (!supplier) {
        alert("Supplier not found");
        return;
    }


    supplierPanel.classList.add("hidden");
    addPanel.classList.remove("hidden");


    addPanel.innerHTML = `

        <div class="table-head">

            <h2>Edit Supplier</h2>

        </div>


        <form id="editSupplierForm"
              class="supplier-form">


            <input
                id="editCompanyName"
                placeholder="Company Name"
                value="${supplier.companyName || ""}"
                required
            >


            <input
                id="editContactPerson"
                placeholder="Contact Person"
                value="${supplier.contactPerson || ""}"
                required
            >


            <input
                id="editPhone"
                placeholder="Phone Number"
                value="${supplier.phone || ""}"
                required
            >


            <input
                id="editWhatsapp"
                placeholder="Whatsapp"
                value="${supplier.whatsapp || ""}"
            >


            <input
                id="editEmail"
                type="email"
                placeholder="Email"
                value="${supplier.email || ""}"
            >


            <input
                id="editCity"
                placeholder="City"
                value="${supplier.city || ""}"
            >


            <textarea
                id="editAddress"
                placeholder="Address"
            >${supplier.address || ""}</textarea>


            <select id="editStatus">

                <option
                    value="true"
                    ${supplier.status ? "selected" : ""}
                >
                    Active
                </option>

                <option
                    value="false"
                    ${!supplier.status ? "selected" : ""}
                >
                    Inactive
                </option>

            </select>


            <input
                id="editLogo"
                placeholder="Logo URL"
                value="${supplier.logo || ""}"
            >


            <button type="submit">
                Update Supplier
            </button>

        </form>
    `;


    document
        .getElementById("editSupplierForm")
        .addEventListener(
            "submit",
            (e) =>{
                e.preventDefault()
                updateSupplier(supplier.id)} 
        );

}

async function updateSupplier(id) {

    const updateData = {

        companyName:
            document.getElementById("editCompanyName").value.trim(),

        contactPerson:
            document.getElementById("editContactPerson").value.trim(),

        phone:
            document.getElementById("editPhone").value.trim(),

        whatsapp:
            document.getElementById("editWhatsapp").value.trim(),

        email:
            document.getElementById("editEmail").value.trim(),

        city:
            document.getElementById("editCity").value.trim(),

        address:
            document.getElementById("editAddress").value.trim(),

        status:
            document.getElementById("editStatus").value === "true",

        logo:
            document.getElementById("editLogo").value.trim()

    };


    try {

        const response = await fetch(
            `${API}/suppliers/${id}`,
            {
                method: "PATCH",
                 credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(updateData)
            },
            
        );
         if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to update supplier"
            );

        }


        alert("Supplier updated successfully");


        // Reload suppliers
        await loadSuppliers();


        // Find updated supplier
        const updatedSupplier =
            suppliers.find(
                s => s.id === id
            );


        if (updatedSupplier) {

            renderSupplierDetails(
                updatedSupplier
            );

        }


    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

}
async function deleteSupplier(id) {

    const supplier = suppliers.find(s => s.id === id);

    const confirmDelete = confirm(
        `Are you sure you want to delete "${supplier?.companyName || "this supplier"}"?`
    );

    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `${API}/suppliers/${id}`,
            {
                method: "DELETE",
                  credentials: 'include'
            },
          
        );
 if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message || "Failed to delete supplier"
            );

        }


        alert("Supplier deleted successfully");


        // Reload supplier list
        await loadSuppliers();


        // Hide details panel
        supplierPanel.classList.add("hidden");


    }
    catch (err) {

        console.error(err);

        alert(err.message || "Delete failed");

    }

}
// ================= RENDER STATS =================

function renderStats(data) {

    const totalSuppliers = data.length;

    const activeSuppliers = data.filter(s => s.status).length;

    const totalProducts = data.reduce(
        (sum, s) => sum + (Number(s.totalProducts) || 0),
        0
    );

    const monthlyPurchases = data.reduce(
        (sum, s) => sum + (Number(s.monthlyPurchases) || 0),
        0
    );

    document.getElementById("statTotalSuppliers").textContent =
        totalSuppliers;

    document.getElementById("statActiveSuppliers").textContent =
        activeSuppliers;

    document.getElementById("statTotalProducts").textContent =
        formatNumber(totalProducts);

    document.getElementById("statMonthlyPurchases").textContent =
        "Rs. " + formatNumber(monthlyPurchases);

}