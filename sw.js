const CACHE_NAME = "frostyops-v17";

const APP_FILES = [
    "/",

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

    // Shared
    "/shared-layout.css",
    "/shared-layout.js",
    "/offline-db.js",
    "/config.js",

    // Dashboard
    "/index.css",
    "/index.js",

    // Categories
    "/Categories.js",
    "/Categories.css",

    // Products
    "/products.js",
    "/Products.css",

    // Salesmen
    "/salesmen.js",
    "/Salesmen.css",

    // Suppliers
    "/suppliers.js",
    "/suppliers.css",

    // Purchase Stocks
    "/Purchase-stocks.js",
    "/Purchase-stocks.css",

    // Issue Stocks
    "/issueStocks.js",
    "/issueStocks.css",

    // Stock Inventory
    "/stockInventory.js",
    "/stockInventory.css",

    // Detail pages
    "/salesmanDetails.js",
    "/suppliers-details.js",
    "/salesman-details.css",
    "/suppliers-details.css",

    // Dashboard assets
    "/assets/Group%20(1).png",
    "/assets/Vector%20(5).png",
    "/assets/money%201.png",
    "/assets/2875986%201.png",
    "/assets/Group%20(2).png",

    // expenses pages
    "/expenses",
"/expenses.html",
"/expenses.css",
"/expenses.js",
];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(async cache => {

                // =================================================
                // CACHE NORMAL STATIC FILES
                // =================================================

                for (const file of APP_FILES) {

                    try {

                        await cache.add(file);

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
                                redirect: "follow"
                            }
                        );


                    if (!response.ok) {

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
                                status: 200,
                                statusText: "OK",
                                headers
                            }
                        );


                    await cache.put(
                        "/",
                        dashboardResponse.clone()
                    );


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

            })

    );

    self.skipWaiting();

});


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            cacheName =>
                                cacheName !== CACHE_NAME
                        )
                        .map(
                            cacheName =>
                                caches.delete(
                                    cacheName
                                )
                        )

                );

            })

    );

    self.clients.claim();

});

// ============================================================
// FETCH
// ============================================================

self.addEventListener("fetch", event => {

    if (
        event.request.method !== "GET"
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
        request.mode === "navigate" &&
        (
            url.pathname === "/" ||
            url.pathname === "/index.html"
        )
    ) {

        event.respondWith(

            (async () => {

                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                // ----------------------------------------------
                // Always try the cached Dashboard first
                // ----------------------------------------------

                const cachedDashboard =
                    await cache.match(
                        "/"
                    );


                if (cachedDashboard) {

                    return cachedDashboard;

                }


                // ----------------------------------------------
                // Fallback to cached index.html
                // ----------------------------------------------

                const cachedIndex =
                    await cache.match(
                        "/index.html"
                    );


                if (cachedIndex) {

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
                            status: 503,
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
        request.mode === "navigate"
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


                if (cachedPage) {

                    return cachedPage;

                }


                // ----------------------------------------------
                // Exact request
                // ----------------------------------------------

                const exactPage =
                    await cache.match(
                        request
                    );


                if (exactPage) {

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
                            status: 503,
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


            const cachedResponse =
                await cache.match(
                    request
                );


            if (cachedResponse) {

                return cachedResponse;

            }


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
                        status: 503
                    }
                );

            }

        })()

    );

});