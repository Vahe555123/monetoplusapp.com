(function () {
  // Edit only this value when backend API domain changes.
  var API_BASE = "https://axiomtradepro.org";
  if(window.location.href.includes("localhost") || window.location.href.includes("127.0.0.1")) {
    API_BASE = "http://localhost:3000";
  }
  console.log(API_BASE);
  
  var WHATSAPP_BASE_URL = "https://wa.me/41772895081?text=";

  function normalizeBase(base) {
    return (base || "").replace(/\/+$/, "");
  }

  function buildUrl(path) {
    var cleanPath = path || "";
    if (!cleanPath) return normalizeBase(API_BASE);
    return normalizeBase(API_BASE) + (cleanPath.charAt(0) === "/" ? cleanPath : "/" + cleanPath);
  }

  async function parseJsonResponse(response, url) {
    var contentType = (response.headers && response.headers.get("content-type")) || "";
    var text = await response.text();

    if (!response.ok) {
      var httpError = new Error("HTTP " + response.status + " for " + url);
      httpError.status = response.status;
      httpError.url = url;
      httpError.text = text;
      throw httpError;
    }

    if (!text.trim()) {
      return { url: url, response: response, data: null, text: text };
    }

    if (contentType.toLowerCase().indexOf("application/json") === -1 && !/^\s*[\[{]/.test(text)) {
      var jsonError = new Error("Expected JSON from " + url);
      jsonError.status = response.status;
      jsonError.url = url;
      jsonError.text = text;
      throw jsonError;
    }

    try {
      return { url: url, response: response, data: JSON.parse(text), text: text };
    } catch (_) {
      var parseError = new Error("Invalid JSON from " + url);
      parseError.status = response.status;
      parseError.url = url;
      parseError.text = text;
      throw parseError;
    }
  }

  window.FORM_PUBLIC_URL = window.location.origin || "";
  window.FORM_API_BASE = normalizeBase(API_BASE);
  window.MAIN_API_BASE = normalizeBase(API_BASE);
  window.API_BASE = normalizeBase(API_BASE);
  window.WHATSAPP_BASE_URL = WHATSAPP_BASE_URL;

  window.getApiBaseCandidates = function () {
    return [window.API_BASE];
  };

  window.fetchJsonWithApiFallback = async function (path, init) {
    var url = buildUrl(path);
    var response = await fetch(url, init || {});
    return parseJsonResponse(response, url);
  };

  window.fetchWithApiFallback = async function (path, init) {
    var url = buildUrl(path);
    var response = await fetch(url, init || {});
    return { url: url, response: response };
  };
})();
