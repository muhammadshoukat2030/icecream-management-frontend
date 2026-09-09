const tbody = document.getElementById("salesmenTbody");
const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDeliveries=document.getElementById("todayDeliveries")
const addPanel = document.getElementById("addPanel");
const profilePanel = document.getElementById("profilePanel");
const openAddBtn = document.getElementById("openAddBtn");



const API = "https://ice-cream-management.vercel.app";
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
async function loadSalesmen() {
    try {
        const response = await fetch(`${API}/allSalesmen`,
            {
        credentials: 'include'
    }
        );
 if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        if (!response.ok) {
            throw new Error("Failed to fetch salesmen");
        }

        const data = await response.json();
        console.log(data)
        // If your API returns:
        // { status: "success", data: { salesmen: [...] } }

        const salesmen = data.data;
        const todayDeliveries=data.todayDeliveries
        renderSalesmen(salesmen,todayDeliveries);

    } catch (err) {
        console.error(err);
    }
}

function renderSalesmen(salesmen,todayDeliveries) {

    tbody.innerHTML = "";

    let activeCount = 0;

    salesmen.forEach((salesman) => {

        if (salesman.status) activeCount++;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${salesman.id}</td>
            <td>${salesman.name}</td>
            <td>${salesman.phone}</td>
            <td>${salesman.address}</td>
            <td>${salesman.status ? "Active" : "Inactive"}</td>
          
            <td>Rs ${salesman.outstandingBalance}</td>
            <td>
                <button onclick="editSalesman('${salesman.id}')">
                    Edit  
                </button>

                <button onclick="deleteSalesman('${salesman.id}')">
                    Delete
                </button>
            </td>
        `;

      row.addEventListener("click",async()=>{
    
    showSalesmanProfile(salesman);


});

tbody.appendChild(row);
    });

    statTotal.textContent = salesmen.length;
    statActive.textContent = activeCount;
    statDeliveries.textContent=todayDeliveries;
    
}

async function editSalesman(id) {

    try {

        // Get salesman information
        const response = await fetch(
            `${API}/oneSalesman?id=${id}`,
            {
        credentials: 'include'
    }
        );
         if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message || "Failed to get salesman"
            );

            return;
        }

        const salesman = data.salesman;

        console.log("Editing salesman:", salesman);


        // Hide profile
        profilePanel.classList.add("hidden");

        // Show edit panel
        addPanel.classList.remove("hidden");


        // Create edit form
        addPanel.innerHTML = `

            <div class="add-panel">

                <h3>Edit Salesman</h3>

                <p class="hint">
                    Update salesman information
                </p>


                <form id="editSalesmanForm">


                    <div class="field">

                        <label>ID</label>

                        <input
                            type="number"
                            value="${salesman.id}"
                            disabled
                        >

                    </div>


                    <div class="field">

                        <label>Name</label>

                        <input
                            id="editName"
                            type="text"
                            value="${salesman.name || ""}"
                            required
                        >

                    </div>


                    <div class="field">

                        <label>Phone</label>

                        <input
                            id="editPhone"
                            type="text"
                            value="${salesman.phone || ""}"
                            required
                        >

                    </div>


                    <div class="field">

                        <label>Address</label>

                        <input
                            id="editAddress"
                            type="text"
                            value="${salesman.address || ""}"
                            required
                        >

                    </div>


                    <div class="field">

                        <label>Outstanding Balance</label>

                        <input
                            id="editBalance"
                            type="number"
                            value="${salesman.outstandingBalance || 0}"
                        >

                    </div>


                    <div class="field">

                        <label>CNIC</label>

                        <input
                            id="editCNIC"
                            type="text"
                            value="${salesman.CNIC || ""}"
                        >

                    </div>


                    <div class="field">

                        <label>Email</label>

                        <input
                            id="editEmail"
                            type="email"
                            value="${salesman.email || ""}"
                        >

                    </div>


                    <div class="field">

                        <label>Status</label>

                        <select id="editStatus">

                            <option
                                value="true"
                                ${salesman.status ? "selected" : ""}
                            >
                                Active
                            </option>

                            <option
                                value="false"
                                ${!salesman.status ? "selected" : ""}
                            >
                                Inactive
                            </option>

                        </select>

                    </div>


                    <div class="add-actions">

                        <button
                            type="button"
                            class="btn-ghost"
                            id="cancelEdit"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="btn-save"
                        >
                            Update
                        </button>

                    </div>


                </form>

            </div>

        `;


        // Cancel button

        document
            .getElementById("cancelEdit")
            .onclick = () => {

                addPanel.classList.add("hidden");

                profilePanel.classList.remove("hidden");

            };


        // Submit edit form

        document
            .getElementById("editSalesmanForm")
            .addEventListener("submit", async (e) => {

                e.preventDefault();


               const updatedSalesman = {
    name: document.getElementById("editName").value,
    phone: document.getElementById("editPhone").value,

  Adress: document.getElementById("editAddress").value,

    outstandingBalance:
        Number(document.getElementById("editBalance").value),

    cnic: document.getElementById("editCNIC").value,

    email: document.getElementById("editEmail").value,

    status:
        document.getElementById("editStatus").value === "true"
};


                console.log(
                    "Sending update:",
                    updatedSalesman
                );


                    try {
                    const updateResponse = await fetch(
                        `${API}/salesmen/${id}`,
                        {
                            method: "PUT",
                             credentials: 'include',
                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(updatedSalesman)
                        }
                    );

                     if (updateResponse.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
                    const result =
                        await updateResponse.json();


                    if (!updateResponse.ok) {

                        alert(
                            result.message ||
                            "Failed to update salesman"
                        );

                        return;
                    }


                    alert(
                        "Salesman updated successfully"
                    );


                    // Hide edit form
                    addPanel.classList.add("hidden");

                    // Show profile
                    profilePanel.classList.remove("hidden");


                    // Refresh table
                    await loadSalesmen();


                } catch (error) {

                    console.error(error);

                    alert(
                        "Server error while updating salesman"
                    );

                }

            });


    } catch (error) {

        console.error(error);

        alert(
            "Server error while loading salesman"
        );

    }
}

async function deleteSalesman(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this salesman?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/salesmen/${id}`,
            {
                method: "DELETE",
                 credentials: 'include'
            }
        );
         if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to delete salesman");
            return;
        }

        alert("Salesman deleted successfully");

        // Refresh salesman table
        await loadSalesmen();

        // Hide profile if it was open
        profilePanel.classList.add("hidden");

    } catch (error) {

        console.error(error);

        alert("Server error while deleting salesman");

    }
}

loadSalesmen();

/* ============================================================
   ADD SALESMAN PANEL
   NOTE: the input ids below (salesmanId, salesmanName, ...) match
   the ids read inside the submit handler further down. The form's
   id is "addSalesmanForm" so it matches the listener that's
   attached to it — these were mismatched before, which silently
   broke the Add Salesman flow.
============================================================ */
addPanel.innerHTML = `

<div class="add-panel">

<h3>Add Salesman</h3>

<p class="hint">
Create a new salesman profile
</p>


<form id="addSalesmanForm">


<div class="field">
<label>ID</label>
<input id="salesmanId" type="number" required>
</div>


<div class="field">
<label>Name</label>
<input id="salesmanName" type="text" required>
</div>


<div class="field">
<label>Phone</label>
<input id="salesmanPhone" type="text" required>
</div>


<div class="field">
<label>Address</label>
<input id="salesmanAddress" type="text" required>
</div>


<div class="field">
<label>Outstanding Balance</label>
<input id="salesmanBalance" type="number" value="0">
</div>


<div class="field">
<label>CNIC</label>
<input id="CNIC" type="text" value="">
</div>

<div class="field">
<label>Email</label>
<input id="email" type="email" value="">
</div>


<div class="field">
<label>Status</label>

<select id="salesmanStatus">
<option value="true">Active</option>
<option value="false">Inactive</option>
</select>

</div>



<div class="add-actions">

<button type="button" 
class="btn-ghost"
id="cancelAdd">

Cancel

</button>


<button class="btn-save">

Save

</button>

</div>


</form>

</div>

`;


// Open Add Panel
openAddBtn.onclick = ()=>{

    profilePanel.classList.add("hidden");

    addPanel.classList.remove("hidden");

};


// Close Add Panel
document.getElementById("cancelAdd").onclick=()=>{

    addPanel.classList.add("hidden");

    profilePanel.classList.remove("hidden");

};


// Submit Form
document
.getElementById("addSalesmanForm")
.addEventListener("submit", async(e)=>{

    e.preventDefault();


    const salesman = {

        id:Number(
            document.getElementById("salesmanId").value
        ),

        name:
            document.getElementById("salesmanName").value,

        phone:
            document.getElementById("salesmanPhone").value,

        address:
            document.getElementById("salesmanAddress").value,

        status:
            document.getElementById("salesmanStatus").value==="true",

        outstandingBalance:
            Number(
                document.getElementById("salesmanBalance").value
            ),

            cnic:document.getElementById("CNIC").value,
            email:document.getElementById("email").value


    };


    try{

        const response = await fetch(
            `${API}/salesmen`,
            {
                method:"POST",
                credentials: 'include',
                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(salesman)
            }
        );

         if (response.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
        if(response.ok){

            alert("Salesman Added Successfully");

            e.target.reset();

            addPanel.classList.add("hidden");
            profilePanel.classList.remove("hidden");

            loadSalesmen();

        }
        else{

            alert("Failed to add salesman");

        }


    }
    catch(error){

        console.log(error);
        alert("Server Error");

    }

});

/* ============================================================
   RIGHT-SIDE PROFILE PREVIEW PANEL
   Matches the reference screenshot: avatar + name/status, phone
   and route line, a Personal information card, a Summary grid,
   a Recent Invoices list, and Quick Actions.

   Your API's salesman objects currently only carry id, name,
   phone, Adress, status and outStandingBalance — so fields the
   screenshot shows that aren't in your schema yet (cnic, email,
   whatsapp, route, todaysIssued, totalTodayPurchases, lastPayment,
   recentInvoices) fall back to "N/A" / 0 / an empty state until
   your backend starts sending them. Add those fields to your
   salesman documents whenever you're ready and they'll show up
   automatically — no changes needed here.
============================================================ */
async function showSalesmanProfile(salesman){

      const res=await fetch(`${API}/summary?id=${salesman.id}`,
        {
        credentials: 'include'
    }
      );
       if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
    const salesman_summary=await res.json();
    console.log("salesman_summary:", salesman_summary);
    console.log('todayInvoices',salesman_summary.todayInvoices)
    
  
 
    profilePanel.classList.remove("hidden");
    addPanel.classList.add("hidden");
    const statusClass = salesman.status ? "active" : "inactive";
    const statusText = salesman.status ? "Active" : "Inactive";
      profilePanel.innerHTML = `

      <div class="profile-top">

        <div class="profile-photo"></div>

        <div>
          <div class="profile-name">
            ${salesman.name}
            <span class="status-badge ${statusClass}">
              <span class="dot"></span>${statusText}
            </span>
          </div>

          <div class="profile-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 011.9 2.2z"/></svg>
            ${salesman.phone || "N/A"}
          </div>

          <div class="profile-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${salesman.route || salesman.address || "N/A"}
          </div>
        </div>

      </div>

      <div class="section-block">
        <div class="section-title">Personal information</div>
        <div class="info-grid">
          <div>
            <div class="info-label">CNIC</div>
            <div class="info-value">${salesman.cnic || "N/A"}</div>
          </div>
          <div>
            <div class="info-label">Phone</div>
            <div class="info-value">${salesman.phone || "N/A"}</div>
          </div>
          <div>
            <div class="info-label">Email</div>
            <div class="info-value">${salesman.email || "N/A"}</div>
          </div>
          <div>
            <div class="info-label">Address</div>
            <div class="info-value">${salesman.address || "N/A"}</div>
          </div>
          <div>
            <div class="info-label">Whatsapp</div>
            <div class="info-value">${salesman.whatsapp || salesman.phone || "N/A"}</div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <div class="section-title" style="margin-bottom:14px;">Summary</div>
        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-label">Todays Issued</div>
            <div class="summary-value">${salesman_summary.todayInvoiceLength ?? 0}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Total today Purchases</div>
            <div class="summary-value">Rs. ${Number(salesman_summary.todayIssued ?? 0).toLocaleString()}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Last Payment</div>
            <div class="summary-value" style="font-size:14px;">${(salesman_summary.todayInvoices.length>0)?salesman_summary.todayInvoices[0].cash : "—"}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Outstanding Balance</div>
            <div class="summary-value red">Rs. ${Number(salesman.outstandingBalance ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div class="section-block" style="border-bottom:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div class="section-title" style="margin-bottom:0;">Recent Invoices</div>
          <span class="view-all">View All</span>
        </div>
        ${renderRecentInvoices(salesman_summary.todayInvoices)}
      </div>

      <div class="quick-actions">
        <div class="section-title" style="margin-bottom:2px;">Quick Actions</div>
        <div class="qa-row">
          <button class="btn-outline" id="issueStockBtn">Issue Stock</button>
                 </div>
        <button class="btn-solid" id="viewFullProfileBtn">View Full Profile</button>
      </div>

    `;

    document.getElementById("issueStockBtn").onclick = () => {
        alert(`Issue stock flow for ${salesman.name} isn't wired up to the API yet.`);
    };
    // document.getElementById("receivePayBtn").onclick = () => {
    //     alert(`Receive payment flow for ${salesman.name} isn't wired up to the API yet.`);
    // };
    document.getElementById("viewFullProfileBtn").onclick = () => {
           window.location.href=`./salesman-details.html?id=${salesman.id}`
    };
}

function renderRecentInvoices(invoices){
    if(!invoices || !invoices.length){
        return `<div class="invoice-row"><span style="color:var(--muted);">No recent invoices</span></div>`;
    }
    return invoices.slice(0,3).map(inv => `
        <div class="invoice-row">
          <span>${inv.date.substring(0,10) || "-"}</span>
          <span>${"INV-"+inv.id ?? "-"}</span>
          <span>Rs. ${Number(inv.balance ?? 0).toLocaleString()}</span>
        </div>
    `).join("");
}

