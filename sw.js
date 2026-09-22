const CACHE_NAME = "frostyops-v18";

const APP_FILES = [
"/",


// ============================================================
// HTML PAGES - CLEAN URLS
// ============================================================

"/login",

"/Categories",
"/Products",
"/Salesmen",
"/suppliers",

"/purchase-stocks",
"/issueStocks",
"/stockInventory",
"/settings",

"/salesman-details",
"/suppliers-details",

"/expenses",

// ============================================================
// HTML PAGES - ACTUAL FILES
// ============================================================

"/login.html",

"/index.html",

"/Categories.html",
"/Products.html",
"/Salesmen.html",
"/suppliers.html",

"/purchase-stocks.html",
"/issueStocks.html",
"/stockInventory.html",
"/settings.html",

"/salesman-details.html",
"/suppliers-details.html",

"/expenses.html",

// ============================================================
// SHARED
// ============================================================

"/shared-layout.css",
"/shared-layout.js",
"/offline-db.js",
"/config.js",

// ============================================================
// DASHBOARD
// ============================================================

"/index.css",
"/index.js",

// ============================================================
// CATEGORIES
// ============================================================

"/Categories.js",
"/Categories.css",

// ============================================================
// PRODUCTS
// ============================================================

"/products.js",
"/Products.css",

// ============================================================
// SALESMEN
// ============================================================

"/salesmen.js",
"/Salesmen.css",

// ============================================================
// SUPPLIERS
// ============================================================

"/suppliers.js",
"/suppliers.css",

// ============================================================
// PURCHASE STOCKS
// ============================================================

"/Purchase-stocks.js",
"/Purchase-stocks.css",

// ============================================================
// ISSUE STOCKS
// ============================================================

"/issueStocks.js",
"/issueStocks.css",

// ============================================================
// STOCK INVENTORY
// ============================================================

"/stockInventory.js",
"/stockInventory.css",

// ============================================================
// DETAIL PAGES
// ============================================================

"/salesmanDetails.js",
"/suppliers-details.js",
"/salesman-details.css",
"/suppliers-details.css",

// ============================================================
// EXPENSES
// ============================================================

"/expenses.js",
"/expenses.css",

// ============================================================
// DASHBOARD ASSETS
// ============================================================

"/assets/Group%20(1).png",
"/assets/Vector%20(5).png",
"/assets/money%201.png",
"/assets/2875986%201.png",
"/assets/Group%20(2).png"


];

// ============================================================
// INSTALL
// ============================================================

self.addEventListener(
"install",
event => {


    event.waitUntil(

        caches.open(
            CACHE_NAME
        )
        .then(
            async cache => {

                // =================================================
                // CACHE APPLICATION FILES
                // =================================================

                for (
                    const file of APP_FILES
                ) {

                    try {

                        await cache.add(
                            file
                        );

                        console.log(
                            "FrostyOps cached:",
                            file
                        );

                    }
                    catch (error) {

                        console.error(
                            "FrostyOps failed to cache:",
                            file,
                            error
                        );

                    }

                }


                // =================================================
                // CACHE DASHBOARD ROOT AS A NORMAL 200 RESPONSE
                // =================================================

                try {

                    const response =
                        await fetch(
                            "/index.html",
                            {
                                redirect:
                                    "follow"
                            }
                        );

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            `Dashboard request failed: ${response.status}`
                        );

                    }

                    const body =
                        await response.arrayBuffer();

                    const headers =
                        new Headers(
                            response.headers
                        );

                    headers.set(
                        "Content-Type",
                        "text/html; charset=UTF-8"
                    );

                    const dashboardResponse =
                        new Response(
                            body,
                            {
                                status:
                                    200,

                                statusText:
                                    "OK",

                                headers
                            }
                        );


                    // ------------------------------------------------
                    // Cache root
                    // ------------------------------------------------

                    await cache.put(
                        "/",
                        dashboardResponse.clone()
                    );


                    // ------------------------------------------------
                    // Cache index.html
                    // ------------------------------------------------

                    await cache.put(
                        "/index.html",
                        dashboardResponse.clone()
                    );


                    console.log(
                        "FrostyOps Dashboard cached successfully."
                    );

                }
                catch (error) {

                    console.error(
                        "FrostyOps Dashboard cache failed:",
                        error
                    );

                }

            }
        )

    );

    self.skipWaiting();

}


);

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener(
"activate",
event => {


    event.waitUntil(

        caches.keys()
            .then(
                cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName !==
                                    CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                }
            )

    );

    self.clients.claim();

}


);

// ============================================================
// FETCH
// ============================================================

self.addEventListener(
"fetch",
event => {


    if (
        event.request.method !==
        "GET"
    ) {

        return;

    }


    const request =
        event.request;

    const url =
        new URL(
            request.url
        );


    // ========================================================
    // DASHBOARD
    // ========================================================

    if (
        request.mode ===
            "navigate" &&
        (
            url.pathname ===
                "/" ||
            url.pathname ===
                "/index.html"
        )
    ) {

        event.respondWith(

            (async () => {

                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                // ----------------------------------------------
                // Cached dashboard root
                // ----------------------------------------------

                const cachedDashboard =
                    await cache.match(
                        "/"
                    );


                if (
                    cachedDashboard
                ) {

                    return cachedDashboard;

                }


                // ----------------------------------------------
                // Cached index.html
                // ----------------------------------------------

                const cachedIndex =
                    await cache.match(
                        "/index.html"
                    );


                if (
                    cachedIndex
                ) {

                    return cachedIndex;

                }


                // ----------------------------------------------
                // Online fallback
                // ----------------------------------------------

                try {

                    return await fetch(
                        request
                    );

                }
                catch (error) {

                    return new Response(
                        "FrostyOps Dashboard is unavailable offline.",
                        {
                            status:
                                503,

                            headers: {
                                "Content-Type":
                                    "text/plain"
                            }
                        }
                    );

                }

            })()

        );

        return;

    }


    // ========================================================
    // OTHER HTML NAVIGATION
    // ========================================================

    if (
        request.mode ===
        "navigate"
    ) {

        event.respondWith(

            (async () => {

                const pagePath =
                    url.pathname
                        .replace(
                            /\/+$/,
                            ""
                        ) ||
                    "/";


                const cleanPagePath =
                    pagePath.replace(
                        /\.html$/i,
                        ""
                    );


                const htmlPagePath =
                    cleanPagePath === "/"
                        ? "/index.html"
                        : `${cleanPagePath}.html`;


                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                // ----------------------------------------------
                // Clean URL
                // ----------------------------------------------

                const cachedPage =
                    await cache.match(
                        cleanPagePath
                    );


                if (
                    cachedPage
                ) {

                    return cachedPage;

                }


                // ----------------------------------------------
                // Actual .html file
                // ----------------------------------------------

                const cachedHTMLPage =
                    await cache.match(
                        htmlPagePath
                    );


                if (
                    cachedHTMLPage
                ) {

                    return cachedHTMLPage;

                }


                // ----------------------------------------------
                // Exact browser request
                // ----------------------------------------------

                const exactPage =
                    await cache.match(
                        request
                    );


                if (
                    exactPage
                ) {

                    return exactPage;

                }


                // ----------------------------------------------
                // Online fallback
                // ----------------------------------------------

                try {

                    return await fetch(
                        request
                    );

                }
                catch (error) {

                    return new Response(
                        "FrostyOps is unavailable offline.",
                        {
                            status:
                                503,

                            headers: {
                                "Content-Type":
                                    "text/plain"
                            }
                        }
                    );

                }

            })()

        );

        return;

    }


    // ========================================================
    // STATIC FILES
    // ========================================================

    event.respondWith(

        (async () => {

            const cache =
                await caches.open(
                    CACHE_NAME
                );


            // ----------------------------------------------
            // Cache first
            // ----------------------------------------------

            const cachedResponse =
                await cache.match(
                    request
                );


            if (
                cachedResponse
            ) {

                return cachedResponse;

            }


            // ----------------------------------------------
            // Network
            // ----------------------------------------------

            try {

                const networkResponse =
                    await fetch(
                        request
                    );


                if (
                    networkResponse.ok &&
                    url.origin ===
                        self.location.origin
                ) {

                    await cache.put(
                        request,
                        networkResponse.clone()
                    );

                }


                return networkResponse;

            }
            catch (error) {

                return new Response(
                    "",
                    {
                        status:
                            503
                    }
                );

            }

        })()

    );

}


);
