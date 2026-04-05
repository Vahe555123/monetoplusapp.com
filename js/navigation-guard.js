(function (root) {
  "use strict";

  if (!root || !root.location || !root.history || typeof root.history.pushState !== "function") {
    return;
  }

  var path = String(root.location.pathname || "").toLowerCase();
  var isComprehensivePage = /(?:^|\/)comprehensive\.html$/i.test(path);
  var isFinalPage = /(?:^|\/)final\.html$/i.test(path);

  if (!isComprehensivePage && !isFinalPage) {
    return;
  }

  var COMPLETED_KEY = "comprehensiveFormCompleted";
  var guardMarker = isFinalPage ? "__finalBackGuard" : "__comprehensiveBackGuard";

  function cloneState(state) {
    var nextState = {};
    if (!state || typeof state !== "object") return nextState;

    for (var key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        nextState[key] = state[key];
      }
    }

    return nextState;
  }

  function shouldActivateGuard() {
    if (isComprehensivePage) return true;

    try {
      return localStorage.getItem(COMPLETED_KEY) === "1" || !!localStorage.getItem("lastJobId");
    } catch (_) {
      return true;
    }
  }

  function buildGuardState() {
    var nextState = cloneState(root.history.state);
    nextState[guardMarker] = true;
    return nextState;
  }

  function installGuard() {
    if (!shouldActivateGuard()) return;

    try {
      root.history.replaceState(buildGuardState(), "", root.location.href);
      root.history.pushState(buildGuardState(), "", root.location.href);
    } catch (_) {
      return;
    }

    root.addEventListener("popstate", function () {
      try {
        root.history.pushState(buildGuardState(), "", root.location.href);
      } catch (_) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installGuard, { once: true });
  } else {
    installGuard();
  }
})(typeof window !== "undefined" ? window : null);
