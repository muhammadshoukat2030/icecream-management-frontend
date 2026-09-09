// ===========================================================
// Categories Admin Page Script
// ===========================================================
const API ="https://icecream-management-backend.vercel.app";
let categories = [];
let manualRows = [];


// ================= GET CATEGORIES =================
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
async function getData() {

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

        console.log(data);


        categories = data.data.map(category => ({
            id: category.id,
            category: category.name,
            description: category.Description,
            products: category.totalProducts || 0,
            status: "Active"
        }));


        renderCategoriesTable();
        updateStatCounts();

    }
    catch(error) {

        console.log("API Error:", error);

    }

}


// ================= CATEGORY TABLE =================


function renderCategoriesTable() {

    const tbody = document.getElementById("catTableBody");

    tbody.innerHTML = "";


    categories.forEach((row,index)=>{


        const tr = document.createElement("tr");


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

    const button = e.target.closest("button");

    if (!button) return;

    const index = Number(button.dataset.index);

    const category = categories[index];

    if (!category) return;


    // ================= DELETE =================

    if (button.classList.contains("btn-delete")) {

        const confirmDelete = confirm(
            `Are you sure you want to delete "${category.category}"?`
        );

        if (!confirmDelete) return;


        try {

            const res = await fetch(
                `${API}/categories/${category.id}`,
                {
                    method: "DELETE",
                    credentials: 'include'
                }
              
            );
             if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }
       const data = await res.json();


            if (!res.ok) {
                throw new Error(
                    data.message || "Failed to delete category"
                );
            }


            // Remove from frontend
            categories.splice(index, 1);

            renderCategoriesTable();
            updateStatCounts();


            alert("Category deleted successfully.");

        }
        catch (error) {

            console.error("Delete Error:", error);

            alert(error.message);

        }

    }


    // ================= EDIT =================

    if (button.classList.contains("btn-edit")) {

        const newName = prompt(
            "Enter category name:",
            category.category
        );

        if (newName === null) return;


        const newDescription = prompt(
            "Enter category description:",
            category.description || ""
        );

        if (newDescription === null) return;


        const updatedCategory = {

            name: newName.trim(),

            Description: newDescription.trim(),

            totalProducts: category.products

        };


        if (!updatedCategory.name) {

            alert("Category name cannot be empty.");

            return;

        }


        try {

            const res = await fetch(
                `${API}/categories/${category.id}`,
                {
                    method: "PUT",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(updatedCategory)

                },
                {
        
    }
            );
             if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }

            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.message || "Failed to update category"
                );

            }


            // Update frontend
            categories[index].category =
                updatedCategory.name;

            categories[index].description =
                updatedCategory.Description;


            renderCategoriesTable();
            updateStatCounts();


            alert("Category updated successfully.");

        }
        catch (error) {

            console.error("Edit Error:", error);

            alert(error.message);

        }

    }

});




// ================= COUNTS =================


function updateStatCounts(){


    document.getElementById("allCatCount").textContent =
    categories.length;



    const active =
    categories.filter(c=>c.status==="Active").length;



    document.getElementById("activeCatCount").textContent =
    active;



    document.getElementById("inactiveCatCount").textContent =
    categories.length-active;

}



// ================= MANUAL TABLE =================


manualRows = [];





function renderManualTable(){


    const tbody =
    document.getElementById("manualTableBody");


    tbody.innerHTML="";



    manualRows.forEach((row,index)=>{


        const tr=document.createElement("tr");


        tr.innerHTML=`

        <td>${index+1}</td>


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
.addEventListener("input",(e)=>{


    if(e.target.tagName !== "INPUT")
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
.addEventListener("click",(e)=>{


    const btn =
    e.target.closest(".del-icon");


    if(!btn) return;



    const index =
    Number(btn.dataset.index);



    manualRows.splice(index,1);



    renderManualTable();


});




// ================= ADD ROW =================


document
.getElementById("addRowBtn")
.addEventListener("click",()=>{


    manualRows.push({

        id:"",
        category:"",
        description:""

    });


    renderManualTable();


});




// ================= CLEAR =================


document
.getElementById("clearAllBtn")
.addEventListener("click",()=>{


    manualRows=[];


    renderManualTable();


});




// ================= CANCEL =================


document
.getElementById("cancelBtn")
.addEventListener("click",()=>{


    manualRows =
    manualRows.map(()=>({

        id:"",
        category:"",
        description:""

    }));


    renderManualTable();


});




// ================= SAVE =================


document
.getElementById("saveBtn")
.addEventListener("click",async()=>{


    const newCategories =
    manualRows.filter(
        row=>row.category.trim()!=""
    );



    const payload =
    newCategories.map(row=>({


        id:Number(row.id),

        name:row.category,

        Description:row.description,

        totalProducts:0


    }));



    console.log(payload);



    try{


        const res = await fetch(
            `${API}/categories`,
            {

            method:"POST",
                credentials: 'include',
            headers:{
                "Content-Type":"application/json"
            },

            body:
            JSON.stringify(payload)

            },
            
        
    
        );


         if (res.status === 401) {
        window.location.href = 'login.html'
        return ;
    }



        const data =
        await res.json();



        console.log(data);



        alert(
            "Categories saved: "
            + payload.length
        );



        getData();


    }
    catch(error){


        console.log(error);


    }



});





// ================= OPEN ADD =================


document
.getElementById("openAddBtn")
.addEventListener("click",()=>{


    manualRows.push({

        id:"",
        category:"",
        description:""

    });


    renderManualTable();


});




// ================= START =================


getData();

renderManualTable();