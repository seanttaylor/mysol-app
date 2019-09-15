const router = (function routerApp() {
    const routeMap = {};

    function on(URL, routeFn) {
        routeMap[URL] = routeFn;
    }

    function get() {
        return routeMap;
    }

    function exec(URL, eventData) {
        if (Object.keys(routeMap).includes(URL)) {
            routeMap[URL](eventData);
        }
    }
    
    return {
        on,
        get,
        exec
    }
}());

(function deviceInfoApp(router) {
    router.on("http://localhost:8080/device-info.html", (eventData)=> {
        fetch("https://httpbin.org/delay/10", {
            method: "POST"
        })
        .then(response=> response.json())
        .then(data=> console.log("Heres some data:", data))
    });

}(router));

(function mysolApp({rxjs}, router) {
    /*window.addEventListener("push", (event)=> {
        event.preventDefault();
        router.exec(event.detail.state.url, event);
    });*/
}(window, router));