// ===========================================================
// Global App Configuration
// ===========================================================

window.APP_CONFIG = {

    API: "https://icecream-management-backend.vercel.app"

};


// ===========================================================
// FROSTYOPS - GLOBAL ACCESS CONTROL
// ===========================================================

window.FROSTYOPS_ACCESS = {

    // ----------------------------------------
    // GET CURRENT USER
    // ----------------------------------------

    getUser() {

        try {

            return JSON.parse(
                localStorage.getItem("user") || "null"
            );

        }
        catch (error) {

            console.error(
                "Unable to read current user:",
                error
            );

            return null;

        }

    },


    // ----------------------------------------
    // CHECK ADMIN
    // ----------------------------------------

    isAdmin() {

        const user = this.getUser();

        return user?.role === "admin";

    },


    // ----------------------------------------
    // CHECK EMPLOYEE PERMISSION
    // ----------------------------------------

    hasPermission(permission) {

        const user = this.getUser();

        if (!user) return false;

        // Admin automatically has full access.
        if (user.role === "admin") {
            return true;
        }

        if (user.role !== "employee") {
            return false;
        }

        const permissions =
            Array.isArray(user.permissions)
                ? user.permissions
                : [];

        return permissions.includes(permission);

    },


    // ----------------------------------------
    // CHECK ANY PERMISSION
    // ----------------------------------------

    hasAnyPermission(permissions = []) {

        return permissions.some(permission =>
            this.hasPermission(permission)
        );

    },


    // ----------------------------------------
    // CHECK ALL PERMISSIONS
    // ----------------------------------------

    hasAllPermissions(permissions = []) {

        return permissions.every(permission =>
            this.hasPermission(permission)
        );

    },
    // ----------------------------------------
// SHOW ACCESS DENIED MESSAGE
// ----------------------------------------

showAccessDenied(message) {

    if (!document.body) return;

    // Prevent duplicate messages.
    if (
        document.getElementById(
            "frostyopsAccessDenied"
        )
    ) {
        return;
    }

    const overlay = document.createElement("div");

    overlay.id = "frostyopsAccessDenied";

    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: #f5f6f8;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const card = document.createElement("div");

    card.style.cssText = `
        background: white;
        max-width: 420px;
        width: 100%;
        padding: 35px;
        border-radius: 12px;
        text-align: center;
        border: 1px solid #e5e5e5;
    `;

    const heading = document.createElement("h2");

    heading.textContent = "Access Denied";

    heading.style.marginBottom = "12px";

    const description = document.createElement("p");

    description.textContent = message;

    description.style.cssText = `
        color: #777;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 22px;
    `;

    const button = document.createElement("button");

    button.textContent = "Go Back";

    button.style.cssText = `
        background: #222;
        color: white;
        border: none;
        padding: 11px 22px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
    `;

    button.addEventListener("click", () => {
        window.history.back();
    });

    card.appendChild(heading);
    card.appendChild(description);
    card.appendChild(button);

    overlay.appendChild(card);

    document.body.appendChild(overlay);

},


// ----------------------------------------
// REQUIRE PAGE PERMISSION
// ----------------------------------------

requirePagePermission(permission) {

    const user = this.getUser();

    if (!user) {

        this.showAccessDenied(
            "Your account information is unavailable. Please log in again."
        );

        return false;

    }

    // Admin can access every page.
    if (user.role === "admin") {
        return true;
    }

    // Check employee permission.
    if (
        user.role === "employee" &&
        this.hasPermission(permission)
    ) {
        return true;
    }

    this.showAccessDenied(
        "You do not have permission to access this page. Please contact your administrator."
    );

    return false;

}

    

};