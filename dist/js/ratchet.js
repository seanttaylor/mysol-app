/*!
 * =====================================================
 * Ratchet v2.0.2 (http://goratchet.com)
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 *
 * v2.0.2 designed by @connors.
 * =====================================================
 */
/* ========================================================================
 * Ratchet: modals.js v2.0.2
 * http://goratchet.com/components#modals
 * ========================================================================
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

!(function () {
  const findModals = function (target) {
    let i;
    const modals = document.querySelectorAll('a');

    for (; target && target !== document; target = target.parentNode) {
      for (i = modals.length; i--;) {
        if (modals[i] === target) {
          return target;
        }
      }
    }
  };

  const getModal = function (event) {
    const modalToggle = findModals(event.target);
    if (modalToggle && modalToggle.hash) {
      return document.querySelector(modalToggle.hash);
    }
  };

  window.addEventListener('touchend', (event) => {
    const modal = getModal(event);
    if (modal) {
      if (modal && modal.classList.contains('modal')) {
        modal.classList.toggle('active');
      }
      event.preventDefault(); // prevents rewriting url (apps can still use hash values in url)
    }
  });
}());

/* ========================================================================
 * Ratchet: popovers.js v2.0.2
 * http://goratchet.com/components#popovers
 * ========================================================================
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

!(function () {
  let popover;

  const findPopovers = function (target) {
    let i;
    const popovers = document.querySelectorAll('a');

    for (; target && target !== document; target = target.parentNode) {
      for (i = popovers.length; i--;) {
        if (popovers[i] === target) {
          return target;
        }
      }
    }
  };

  var onPopoverHidden = function () {
    popover.style.display = 'none';
    popover.removeEventListener('webkitTransitionEnd', onPopoverHidden);
  };

  var backdrop = (function () {
    const element = document.createElement('div');

    element.classList.add('backdrop');

    element.addEventListener('touchend', () => {
      popover.addEventListener('webkitTransitionEnd', onPopoverHidden);
      popover.classList.remove('visible');
      popover.parentNode.removeChild(backdrop);
    });

    return element;
  }());

  const getPopover = function (e) {
    const anchor = findPopovers(e.target);

    if (!anchor || !anchor.hash || (anchor.hash.indexOf('/') > 0)) {
      return;
    }

    try {
      popover = document.querySelector(anchor.hash);
    } catch (error) {
      popover = null;
    }

    if (popover === null) {
      return;
    }

    if (!popover || !popover.classList.contains('popover')) {
      return;
    }

    return popover;
  };

  const showHidePopover = function (e) {
    const popover = getPopover(e);

    if (!popover) {
      return;
    }

    popover.style.display = 'block';
    popover.offsetHeight;
    popover.classList.add('visible');

    popover.parentNode.appendChild(backdrop);
  };

  window.addEventListener('touchend', showHidePopover);
}());

/* ========================================================================
 * Ratchet: push.js v2.0.2
 * http://goratchet.com/components#push
 * ========================================================================
 * inspired by @defunkt's jquery.pjax.js
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

/* global _gaq: true */

!(function () {
  const noop = function () {};


  // Pushstate caching
  // ==================

  let isScrolling;
  const maxCacheLength = 20;
  const cacheMapping = sessionStorage;
  const domCache = {};
  const transitionMap = {
    slideIn: 'slide-out',
    slideOut: 'slide-in',
    fade: 'fade',
  };

  const bars = {
    bartab: '.bar-tab',
    barnav: '.bar-nav',
    barfooter: '.bar-footer',
    barheadersecondary: '.bar-header-secondary',
  };

  const cacheReplace = function (data, updates) {
    PUSH.id = data.id;
    if (updates) {
      data = getCached(data.id);
    }
    cacheMapping[data.id] = JSON.stringify(data);
    window.history.replaceState(data.id, data.title, data.url);
    domCache[data.id] = document.body.cloneNode(true);
  };

  const cachePush = function () {
    const { id } = PUSH;

    const cacheForwardStack = JSON.parse(cacheMapping.cacheForwardStack || '[]');
    const cacheBackStack = JSON.parse(cacheMapping.cacheBackStack || '[]');

    cacheBackStack.push(id);

    while (cacheForwardStack.length) {
      delete cacheMapping[cacheForwardStack.shift()];
    }
    while (cacheBackStack.length > maxCacheLength) {
      delete cacheMapping[cacheBackStack.shift()];
    }

    window.history.pushState(null, '', cacheMapping[PUSH.id].url);

    cacheMapping.cacheForwardStack = JSON.stringify(cacheForwardStack);
    cacheMapping.cacheBackStack = JSON.stringify(cacheBackStack);
  };

  const cachePop = function (id, direction) {
    const forward = direction === 'forward';
    const cacheForwardStack = JSON.parse(cacheMapping.cacheForwardStack || '[]');
    const cacheBackStack = JSON.parse(cacheMapping.cacheBackStack || '[]');
    const pushStack = forward ? cacheBackStack : cacheForwardStack;
    const popStack = forward ? cacheForwardStack : cacheBackStack;

    if (PUSH.id) {
      pushStack.push(PUSH.id);
    }
    popStack.pop();

    cacheMapping.cacheForwardStack = JSON.stringify(cacheForwardStack);
    cacheMapping.cacheBackStack = JSON.stringify(cacheBackStack);
  };

  var getCached = function (id) {
    return JSON.parse(cacheMapping[id] || null) || {};
  };

  const getTarget = function (e) {
    const target = findTarget(e.target);

    if (!target
        || e.which > 1
        || e.metaKey
        || e.ctrlKey
        || isScrolling
        || location.protocol !== target.protocol
        || location.host !== target.host
        || !target.hash && /#/.test(target.href)
        || target.hash && target.href.replace(target.hash, '') === location.href.replace(location.hash, '')
        || target.getAttribute('data-ignore') === 'push') { return; }

    return target;
  };


  // Main event handlers (touchend, popstate)
  // ==========================================

  const touchend = function (e) {
    const target = getTarget(e);

    if (!target) {
      return;
    }

    e.preventDefault();

    PUSH({
      url: target.href,
      hash: target.hash,
      timeout: target.getAttribute('data-timeout'),
      transition: target.getAttribute('data-transition'),
    });
  };

  const popstate = function (e) {
    let key;
    let barElement;
    let activeObj;
    let activeDom;
    let direction;
    let transition;
    let transitionFrom;
    let transitionFromObj;
    const id = e.state;

    if (!id || !cacheMapping[id]) {
      return;
    }

    direction = PUSH.id < id ? 'forward' : 'back';

    cachePop(id, direction);

    activeObj = getCached(id);
    activeDom = domCache[id];

    if (activeObj.title) {
      document.title = activeObj.title;
    }

    if (direction === 'back') {
      transitionFrom = JSON.parse(direction === 'back' ? cacheMapping.cacheForwardStack : cacheMapping.cacheBackStack);
      transitionFromObj = getCached(transitionFrom[transitionFrom.length - 1]);
    } else {
      transitionFromObj = activeObj;
    }

    if (direction === 'back' && !transitionFromObj.id) {
      return (PUSH.id = id);
    }

    transition = direction === 'back' ? transitionMap[transitionFromObj.transition] : transitionFromObj.transition;

    if (!activeDom) {
      return PUSH({
        id: activeObj.id,
        url: activeObj.url,
        title: activeObj.title,
        timeout: activeObj.timeout,
        transition,
        ignorePush: true,
      });
    }

    if (transitionFromObj.transition) {
      activeObj = extendWithDom(activeObj, '.content', activeDom.cloneNode(true));
      for (key in bars) {
        if (bars.hasOwnProperty(key)) {
          barElement = document.querySelector(bars[key]);
          if (activeObj[key]) {
            swapContent(activeObj[key], barElement);
          } else if (barElement) {
            barElement.parentNode.removeChild(barElement);
          }
        }
      }
    }

    swapContent(
      (activeObj.contents || activeDom).cloneNode(true),
      document.querySelector('.content'),
      transition,
    );

    PUSH.id = id;

    document.body.offsetHeight; // force reflow to prevent scroll
  };


  // Core PUSH functionality
  // =======================

  var PUSH = function (options) {
    let key;
    let { xhr } = PUSH;

    options.container = options.container || options.transition ? document.querySelector('.content') : document.body;

    for (key in bars) {
      if (bars.hasOwnProperty(key)) {
        options[key] = options[key] || document.querySelector(bars[key]);
      }
    }

    if (xhr && xhr.readyState < 4) {
      xhr.onreadystatechange = noop;
      xhr.abort();
    }

    xhr = new XMLHttpRequest();
    xhr.open('GET', options.url, true);
    xhr.setRequestHeader('X-PUSH', 'true');

    xhr.onreadystatechange = function () {
      if (options._timeout) {
        clearTimeout(options._timeout);
      }
      if (xhr.readyState === 4) {
        xhr.status === 200 ? success(xhr, options) : failure(options.url);
      }
    };

    if (!PUSH.id) {
      cacheReplace({
        id: +new Date(),
        url: window.location.href,
        title: document.title,
        timeout: options.timeout,
        transition: null,
      });
    }

    if (options.timeout) {
      options._timeout = setTimeout(() => { xhr.abort('timeout'); }, options.timeout);
    }

    xhr.send();

    if (xhr.readyState && !options.ignorePush) {
      cachePush();
    }
  };


  // Main XHR handlers
  // =================

  var success = function (xhr, options) {
    let key;
    let barElement;
    const data = parseXHR(xhr, options);

    if (!data.contents) {
      return locationReplace(options.url);
    }

    if (data.title) {
      document.title = data.title;
    }

    if (options.transition) {
      for (key in bars) {
        if (bars.hasOwnProperty(key)) {
          barElement = document.querySelector(bars[key]);
          if (data[key]) {
            swapContent(data[key], barElement);
          } else if (barElement) {
            barElement.parentNode.removeChild(barElement);
          }
        }
      }
    }

    swapContent(data.contents, options.container, options.transition, () => {
      cacheReplace({
        id: options.id || +new Date(),
        url: data.url,
        title: data.title,
        timeout: options.timeout,
        transition: options.transition,
      }, options.id);
      triggerStateChange();
    });

    if (!options.ignorePush && window._gaq) {
      _gaq.push(['_trackPageview']); // google analytics
    }
    if (!options.hash) {

    }
  };

  var failure = function (url) {
    throw new Error(`Could not get: ${url}`);
  };


  // PUSH helpers
  // ============

  var swapContent = function (swap, container, transition, complete) {
    let enter;
    let containerDirection;
    let swapDirection;

    if (!transition) {
      if (container) {
        container.innerHTML = swap.innerHTML;
      } else if (swap.classList.contains('content')) {
        document.body.appendChild(swap);
      } else {
        document.body.insertBefore(swap, document.querySelector('.content'));
      }
    } else {
      enter = /in$/.test(transition);

      if (transition === 'fade') {
        container.classList.add('in');
        container.classList.add('fade');
        swap.classList.add('fade');
      }

      if (/slide/.test(transition)) {
        swap.classList.add('sliding-in', enter ? 'right' : 'left');
        swap.classList.add('sliding');
        container.classList.add('sliding');
      }

      container.parentNode.insertBefore(swap, container);
    }

    if (!transition) {
      complete && complete();
    }

    if (transition === 'fade') {
      container.offsetWidth; // force reflow
      container.classList.remove('in');
      var fadeContainerEnd = function () {
        container.removeEventListener('webkitTransitionEnd', fadeContainerEnd);
        swap.classList.add('in');
        swap.addEventListener('webkitTransitionEnd', fadeSwapEnd);
      };
      var fadeSwapEnd = function () {
        swap.removeEventListener('webkitTransitionEnd', fadeSwapEnd);
        container.parentNode.removeChild(container);
        swap.classList.remove('fade');
        swap.classList.remove('in');
        complete && complete();
      };
      container.addEventListener('webkitTransitionEnd', fadeContainerEnd);
    }

    if (/slide/.test(transition)) {
      var slideEnd = function () {
        swap.removeEventListener('webkitTransitionEnd', slideEnd);
        swap.classList.remove('sliding', 'sliding-in');
        swap.classList.remove(swapDirection);
        container.parentNode.removeChild(container);
        complete && complete();
      };

      container.offsetWidth; // force reflow
      swapDirection = enter ? 'right' : 'left';
      containerDirection = enter ? 'left' : 'right';
      container.classList.add(containerDirection);
      swap.classList.remove(swapDirection);
      swap.addEventListener('webkitTransitionEnd', slideEnd);
    }
  };

  var triggerStateChange = function () {
    const e = new CustomEvent('push', {
      detail: { state: getCached(PUSH.id) },
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(e);
  };

  var findTarget = function (target) {
    let i;
    const toggles = document.querySelectorAll('a');

    for (; target && target !== document; target = target.parentNode) {
      for (i = toggles.length; i--;) {
        if (toggles[i] === target) {
          return target;
        }
      }
    }
  };

  var locationReplace = function (url) {
    window.history.replaceState(null, '', '#');
    window.location.replace(url);
  };

  var extendWithDom = function (obj, fragment, dom) {
    let i;
    const result = {};

    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        result[i] = obj[i];
      }
    }

    Object.keys(bars).forEach((key) => {
      const el = dom.querySelector(bars[key]);
      if (el) {
        el.parentNode.removeChild(el);
      }
      result[key] = el;
    });

    result.contents = dom.querySelector(fragment);

    return result;
  };

  var parseXHR = function (xhr, options) {
    let head;
    let body;
    let data = {};
    const { responseText } = xhr;

    data.url = options.url;

    if (!responseText) {
      return data;
    }

    if (/<html/i.test(responseText)) {
      head = document.createElement('div');
      body = document.createElement('div');
      head.innerHTML = responseText.match(/<head[^>]*>([\s\S.]*)<\/head>/i)[0];
      body.innerHTML = responseText.match(/<body[^>]*>([\s\S.]*)<\/body>/i)[0];
    } else {
      head = body = document.createElement('div');
      head.innerHTML = responseText;
    }

    data.title = head.querySelector('title');
    const text = 'innerText' in data.title ? 'innerText' : 'textContent';
    data.title = data.title && data.title[text].trim();

    if (options.transition) {
      data = extendWithDom(data, '.content', body);
    } else {
      data.contents = body;
    }

    return data;
  };


  // Attach PUSH event handlers
  // ==========================

  window.addEventListener('touchstart', () => { isScrolling = false; });
  window.addEventListener('touchmove', () => { isScrolling = true; });
  window.addEventListener('touchend', touchend);
  window.addEventListener('click', (e) => { if (getTarget(e)) { e.preventDefault(); } });
  window.addEventListener('popstate', popstate);
  window.PUSH = PUSH;
}());

/* ========================================================================
 * Ratchet: segmented-controllers.js v2.0.2
 * http://goratchet.com/components#segmentedControls
 * ========================================================================
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

!(function () {
  const getTarget = function (target) {
    let i;
    const segmentedControls = document.querySelectorAll('.segmented-control .control-item');

    for (; target && target !== document; target = target.parentNode) {
      for (i = segmentedControls.length; i--;) {
        if (segmentedControls[i] === target) {
          return target;
        }
      }
    }
  };

  window.addEventListener('touchend', (e) => {
    let activeTab;
    let activeBodies;
    let targetBody;
    const targetTab = getTarget(e.target);
    const className = 'active';
    const classSelector = `.${className}`;

    if (!targetTab) {
      return;
    }

    activeTab = targetTab.parentNode.querySelector(classSelector);

    if (activeTab) {
      activeTab.classList.remove(className);
    }

    targetTab.classList.add(className);

    if (!targetTab.hash) {
      return;
    }

    targetBody = document.querySelector(targetTab.hash);

    if (!targetBody) {
      return;
    }

    activeBodies = targetBody.parentNode.querySelectorAll(classSelector);

    for (let i = 0; i < activeBodies.length; i++) {
      activeBodies[i].classList.remove(className);
    }

    targetBody.classList.add(className);
  });

  window.addEventListener('click', (e) => { if (getTarget(e.target)) { e.preventDefault(); } });
}());

/* ========================================================================
 * Ratchet: sliders.js v2.0.2
 * http://goratchet.com/components#sliders
 * ========================================================================
   Adapted from Brad Birdsall's swipe
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

!(function () {
  let pageX;
  let pageY;
  let slider;
  let deltaX;
  let deltaY;
  let offsetX;
  let lastSlide;
  let startTime;
  let resistance;
  let sliderWidth;
  let slideNumber;
  let isScrolling;
  let scrollableArea;

  const getSlider = function (target) {
    let i;
    const sliders = document.querySelectorAll('.slider > .slide-group');

    for (; target && target !== document; target = target.parentNode) {
      for (i = sliders.length; i--;) {
        if (sliders[i] === target) {
          return target;
        }
      }
    }
  };

  const getScroll = function () {
    if ('webkitTransform' in slider.style) {
      const translate3d = slider.style.webkitTransform.match(/translate3d\(([^,]*)/);
      const ret = translate3d ? translate3d[1] : 0;
      return parseInt(ret, 10);
    }
  };

  const setSlideNumber = function (offset) {
    const round = offset ? (deltaX < 0 ? 'ceil' : 'floor') : 'round';
    slideNumber = Math[round](getScroll() / (scrollableArea / slider.children.length));
    slideNumber += offset;
    slideNumber = Math.min(slideNumber, 0);
    slideNumber = Math.max(-(slider.children.length - 1), slideNumber);
  };

  const onTouchStart = function (e) {
    slider = getSlider(e.target);

    if (!slider) {
      return;
    }

    const firstItem = slider.querySelector('.slide');

    scrollableArea = firstItem.offsetWidth * slider.children.length;
    isScrolling = undefined;
    sliderWidth = slider.offsetWidth;
    resistance = 1;
    lastSlide = -(slider.children.length - 1);
    startTime = +new Date();
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
    deltaX = 0;
    deltaY = 0;

    setSlideNumber(0);

    slider.style['-webkit-transition-duration'] = 0;
  };

  const onTouchMove = function (e) {
    if (e.touches.length > 1 || !slider) {
      return; // Exit if a pinch || no slider
    }

    deltaX = e.touches[0].pageX - pageX;
    deltaY = e.touches[0].pageY - pageY;
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;

    if (typeof isScrolling === 'undefined') {
      isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
    }

    if (isScrolling) {
      return;
    }

    offsetX = (deltaX / resistance) + getScroll();

    e.preventDefault();

    resistance = slideNumber === 0 && deltaX > 0 ? (pageX / sliderWidth) + 1.25
      : slideNumber === lastSlide && deltaX < 0 ? (Math.abs(pageX) / sliderWidth) + 1.25 : 1;

    slider.style.webkitTransform = `translate3d(${offsetX}px,0,0)`;
  };

  const onTouchEnd = function (e) {
    if (!slider || isScrolling) {
      return;
    }

    setSlideNumber(
      (+new Date()) - startTime < 1000 && Math.abs(deltaX) > 15 ? (deltaX < 0 ? -1 : 1) : 0,
    );

    offsetX = slideNumber * sliderWidth;

    slider.style['-webkit-transition-duration'] = '.2s';
    slider.style.webkitTransform = `translate3d(${offsetX}px,0,0)`;

    e = new CustomEvent('slide', {
      detail: { slideNumber: Math.abs(slideNumber) },
      bubbles: true,
      cancelable: true,
    });

    slider.parentNode.dispatchEvent(e);
  };

  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);
}());

/* ========================================================================
 * Ratchet: toggles.js v2.0.2
 * http://goratchet.com/components#toggles
 * ========================================================================
   Adapted from Brad Birdsall's swipe
 * Copyright 2014 Connor Sears
 * Licensed under MIT (https://github.com/twbs/ratchet/blob/master/LICENSE)
 * ======================================================================== */

!(function () {
  let start = {};
  let touchMove = false;
  let distanceX = false;
  let toggle = false;

  const findToggle = function (target) {
    let i;
    const toggles = document.querySelectorAll('.toggle');

    for (; target && target !== document; target = target.parentNode) {
      for (i = toggles.length; i--;) {
        if (toggles[i] === target) {
          return target;
        }
      }
    }
  };

  window.addEventListener('touchstart', (e) => {
    e = e.originalEvent || e;

    toggle = findToggle(e.target);

    if (!toggle) {
      return;
    }

    const handle = toggle.querySelector('.toggle-handle');
    const toggleWidth = toggle.clientWidth;
    const handleWidth = handle.clientWidth;
    const offset = toggle.classList.contains('active') ? (toggleWidth - handleWidth) : 0;

    start = { pageX: e.touches[0].pageX - offset, pageY: e.touches[0].pageY };
    touchMove = false;
  });

  window.addEventListener('touchmove', (e) => {
    e = e.originalEvent || e;

    if (e.touches.length > 1) {
      return; // Exit if a pinch
    }

    if (!toggle) {
      return;
    }

    const handle = toggle.querySelector('.toggle-handle');
    const current = e.touches[0];
    const toggleWidth = toggle.clientWidth;
    const handleWidth = handle.clientWidth;
    const offset = toggleWidth - handleWidth;

    touchMove = true;
    distanceX = current.pageX - start.pageX;

    if (Math.abs(distanceX) < Math.abs(current.pageY - start.pageY)) {
      return;
    }

    e.preventDefault();

    if (distanceX < 0) {
      return (handle.style.webkitTransform = 'translate3d(0,0,0)');
    }
    if (distanceX > offset) {
      return (handle.style.webkitTransform = `translate3d(${offset}px,0,0)`);
    }

    handle.style.webkitTransform = `translate3d(${distanceX}px,0,0)`;

    toggle.classList[(distanceX > (toggleWidth / 2 - handleWidth / 2)) ? 'add' : 'remove']('active');
  });

  window.addEventListener('touchend', (e) => {
    if (!toggle) {
      return;
    }

    const handle = toggle.querySelector('.toggle-handle');
    const toggleWidth = toggle.clientWidth;
    const handleWidth = handle.clientWidth;
    const offset = (toggleWidth - handleWidth);
    const slideOn = (!touchMove && !toggle.classList.contains('active')) || (touchMove && (distanceX > (toggleWidth / 2 - handleWidth / 2)));

    if (slideOn) {
      handle.style.webkitTransform = `translate3d(${offset}px,0,0)`;
    } else {
      handle.style.webkitTransform = 'translate3d(0,0,0)';
    }

    toggle.classList[slideOn ? 'add' : 'remove']('active');

    e = new CustomEvent('toggle', {
      detail: { isActive: slideOn },
      bubbles: true,
      cancelable: true,
    });

    toggle.dispatchEvent(e);

    touchMove = false;
    toggle = false;
  });
}());
