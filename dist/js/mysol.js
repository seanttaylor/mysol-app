/**
 * Module for managing the application view router.
 * @returns void
 */

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
    exec,
  };
}());

/**
 * Module for managing the Device Info view.
 * @param {Object} window - The browser window object.
 * @param {Object} window.m - The Mithril library.
 * @param {Object} router - The application view router.
 * @returns void
 */

function deviceInfoApp({ m, document }, router) {
  const URL = 'http://localhost:8081/device/status';
  router.on('http://localhost:8080/device-info.html', (eventData) => {
    fetch(URL, {
      method: 'GET',
    })
      .then((response) => response.json())
      .then(onDeviceInfo)
      .catch((e) => console.error(e));
  });

  /**
     * Fetches device metadata from the mySōl.
     * @param {Object} deviceInfo - Information fetched form the mySōl device API.
     * @returns void
     */

  function onDeviceInfo(deviceInfo) {
    const root = document.querySelector('.card');
    setTimeout(() => {
      m.render(root,
        m('ul', { class: 'table-view' }, [
          m('li', { class: 'table-view-cell' }, [
            m('span', 'Name'),
            m('span', { class: 'card-list-item' }, deviceInfo.name),
          ]),
          m('li', { class: 'table-view-cell' }, [
            m('span', 'Model'),
            m('span', { class: 'card-list-item' }, deviceInfo.model),
          ]),
          m('li', { class: 'table-view-cell' }, [
            m('span', 'App Version'),
            m('span', { class: 'card-list-item' }, deviceInfo.applicationVersion),
          ]),
          m('li', { class: 'table-view-cell' }, [
            m('span', 'Status'),
            m('span', { class: 'card-list-item custom-badge-primary' }, deviceInfo.deviceStatus.toUpperCase()),
          ]),
          m('li', { class: 'table-view-cell' }, [
            m('span', 'Password Expires'),
            m('span', { class: 'card-list-item' }, deviceInfo.timeRemainingOnDevicePassword || 'N/A'),
          ]),
          m('li', { class: 'table-view-cell' }, [
            m('span', 'Battery Status'),
            m('span', { class: 'card-list-item' }, deviceInfo.batteryCharging ? 'Charging' : 'Discharging'),
          ]),
        ]));
    }, 2500);
  }
}

/**
 * Module for managing the Battery Info view.
 * @param {Object} window - The browser window object.
 * @param {Object} window.rxjs - The RxJs library.
 * @param {Object} window.m - The Mithril library.
 * @param {Object} router - The application view router.
 * @param {Object} observable$ - An observable for receiving subscribed events.
 * @returns void
 */

function telemetryInfoApp({ m, rxjs }, router, observable$) {
  const { operators } = rxjs;
  const { filter } = operators;

  router.on('http://localhost:8080/telemetry.html', (eventData) => {
    observable$
      .pipe(filter((event) => event.header.name.includes('telemetry')))
      .subscribe((x) => console.log(x));
  });

  function onTelemetryData(data) {

  }
}

/**
 * Module for managing the Battery Info view.
 * @param {Object} window - The browser window object.
 * @param {Object} window.rxjs - The RxJs library.
 * @param {Object} window.m - The Mithril library.
 * @param {Object} router - The application view router.
 * @param {Object} observable$ - An observable for receiving subscribed events.
 */

function batteryInfoApp({ rxjs, m, document }, router, observable$) {
  const { operators } = rxjs;
  const { filter, map } = operators;
  const $ = document.querySelector.bind(document);

  router.on('http://localhost:8080/battery-info.html', (eventData) => {
    observable$
      .pipe(filter((event) => event.header.name.includes('battery') && $('#battery-indicator') !== null))
      .subscribe((batteryData) => {
        m.render($('#charge-percent-label'), `Charge (${batteryData.payload.batteryLevel * 1}%)`);
        $('#battery-indicator').value = `${batteryData.payload.batteryLevel * 0.01}`;
        m.render($('#battery-status'), batteryData.batteryCharging ? 'Charging' : 'Discharging');
      });
  });
}

/**
 * Bootstraps the appliaction.
 * @param {Object} window - The browser window object.
 * @param {Object} router - The application view router.
 * @param {Array} modules - List of application modules.
 * @returns void
*/

(function mysolApp(window, router, modules) {
  const { fromEventPattern, ReplaySubject, operators } = window.rxjs;
  const { map } = operators;
  const source = new EventSource('http://localhost:8081/device/sse');
  const serverSentEvent$ = fromEventPattern((handlerFn) => source.addEventListener('message', handlerFn));
  const rs$ = new ReplaySubject(1);
  serverSentEvent$
    .pipe(map((event) => JSON.parse(event.data)))
    .subscribe(rs$);

  window.addEventListener('push', (event) => {
    event.preventDefault();
    router.exec(event.detail.state.url, event);
  });

  // Instantiate peer modules.
  modules.map((m) => m(window, router, rs$));
}(window, router, [batteryInfoApp, deviceInfoApp, telemetryInfoApp]));
