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

(function deviceInfoApp(router, {m, document}) {
    const URL = "http://localhost:8081/device/status";
    router.on("http://localhost:8080/device-info.html", eventData => {
        fetch(URL, {
            method: "GET"
        })
        .then(response=> response.json())
        .then(onDeviceInfo);
    });

    function onDeviceInfo(deviceInfo) {
        const root = document.querySelector(".card");
        setTimeout(()=> {
            m.render(root, 
                m("ul", {class: "table-view"},  [
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Name"),
                        m("span", {style: {float: "right"}}, deviceInfo.name),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Model"),
                        m("span", {style: {float: "right"}}, deviceInfo.model),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "App Version"),
                        m("span", {style: {float: "right"}}, deviceInfo.applicationVersion),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Status"),
                        m("span", {style: {float: "right"}}, deviceInfo.deviceStatus.toUpperCase()),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Password Expires"),
                        m("span", {style: {float: "right"}}, deviceInfo.timeRemainingOnDevicePassword || "No Password"),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Battery Status"),
                        m("span", {style: {float: "right"}}, deviceInfo.batteryStatus)
                    ])
                ])
            );
        }, 2500);
        
    }

}(router, window));


(function mysolApp({rxjs}, router) {
    window.addEventListener("push", event => {
        event.preventDefault();
        router.exec(event.detail.state.url, event);
    });

    const source = new EventSource("http://localhost:8081/device/sse");
    source.onmessage = function(e) {
        console.log(e.data);
    }

}(window, router));