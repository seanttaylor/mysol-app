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

function deviceInfoApp({m, document}, router) {
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
                        m("span", {class: "card-list-item"}, deviceInfo.name),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Model"),
                        m("span", {class: "card-list-item"}, deviceInfo.model),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "App Version"),
                        m("span", {class: "card-list-item"}, deviceInfo.applicationVersion),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Status"),
                        m("span", {class: "card-list-item custom-badge-primary"}, deviceInfo.deviceStatus.toUpperCase()),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Password Expires"),
                        m("span", {class: "card-list-item"}, deviceInfo.timeRemainingOnDevicePassword || "N/A"),
                    ]),
                    m("li", {class: "table-view-cell"}, [
                        m("span", "Battery Status"),
                        m("span", {class: "card-list-item"}, deviceInfo.batteryCharging ? "Charging": "Discharging")
                    ])
                ])
            );
        }, 2500);
    }
}

function batteryInfoApp({rxjs, m, document }, router, observable$) {
    const { operators } = rxjs;
    const { filter, map } = operators;
    const $ = document.querySelector.bind(document);

    router.on("http://localhost:8080/battery-info.html", (eventData) => {
        
        observable$
        .pipe(map(event=> JSON.parse(event.data)))
        .pipe(filter(event=> event.header.name.includes("battery") & $("#battery-indicator") !== null))
        .subscribe((batteryData)=> {
            m.render($("#charge-percent-label"), `Charge (${batteryData.payload.batteryLevel*1}%)`);
            $("#battery-indicator").value = `${batteryData.payload.batteryLevel*0.01}`;
            m.render($("#battery-status"), batteryData.batteryCharging ? "Charging" : "Discharging");
        });
    });
}

(function mysolApp(window, router, modules) {
    const { fromEventPattern, ReplaySubject } = window.rxjs;
    const source = new EventSource("http://localhost:8081/device/sse");
    const serverSentEvent$ = fromEventPattern(handlerFn => source.addEventListener("message", handlerFn));
    const rs$ = new ReplaySubject(1);
    serverSentEvent$.subscribe(rs$);

    window.addEventListener("push", event => {
        event.preventDefault();
        router.exec(event.detail.state.url, event);
    });

    //Instantiate peer modules.
    modules.map(m=> m(window, router, rs$));
}(window, router, [batteryInfoApp, deviceInfoApp]));