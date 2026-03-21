(function () {
  var STATIC_API_BASE = "https://axiomtradepro.org";
  var runtime = window.__FORM_RUNTIME_CONFIG__ || {};
  var formMeta = document.querySelector('meta[name="api-base"]');
  var mainMeta = document.querySelector('meta[name="main-api-base"]');
  var formMetaValue = (formMeta && formMeta.getAttribute("content")) || "";
  var mainMetaValue = (mainMeta && mainMeta.getAttribute("content")) || "";
  var origin =
    (typeof window !== "undefined" && window.location && window.location.origin) || "";
  var publicUrl = runtime.FORM_PUBLIC_URL || "";
  var FORM = STATIC_API_BASE;
  var MAIN = STATIC_API_BASE;
  var PUBLIC = publicUrl || FORM || origin;
  var WHATSAPP_BASE = runtime.WHATSAPP_BASE_URL || "";

  window.FORM_PUBLIC_URL = PUBLIC;
  window.FORM_API_BASE = FORM;
  window.MAIN_API_BASE = MAIN;
  window.API_BASE = FORM;
  window.WHATSAPP_BASE_URL = WHATSAPP_BASE;

  function normalizeBase(base) {
    return (base || "").replace(/\/+$/, "");
  }

  function pushUnique(list, base) {
    var normalized = normalizeBase(base);
    if (!normalized) return;
    if (list.indexOf(normalized) === -1) list.push(normalized);
  }

  function buildUrl(base, path) {
    var cleanBase = normalizeBase(base);
    var cleanPath = path || "";
    if (!cleanPath) return cleanBase;
    return cleanBase + (cleanPath.charAt(0) === "/" ? cleanPath : "/" + cleanPath);
  }

  function parseJsonPayload(text, contentType) {
    var raw = typeof text === "string" ? text : "";
    var type = (contentType || "").toLowerCase();
    if (!raw.trim()) return { ok: true, value: null };
    if (type.indexOf("application/json") === -1 && !/^\s*[\[{]/.test(raw)) {
      return { ok: false, value: null };
    }
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch (_) {
      return { ok: false, value: null };
    }
  }

  function getApiBaseCandidates(preferredBase) {
    var candidates = [];
    pushUnique(candidates, STATIC_API_BASE);
    return candidates;
  }

  async function fetchJsonWithApiFallback(path, init, preferredBase) {
    var candidates = getApiBaseCandidates(preferredBase);
    var lastError = null;

    for (var i = 0; i < candidates.length; i++) {
      var url = buildUrl(candidates[i], path);
      try {
        var response = await fetch(url, init || {});
        var contentType = (response.headers && response.headers.get("content-type")) || "";
        var text = await response.text();
        var parsed = parseJsonPayload(text, contentType);
        var looksLikeHtml = contentType.toLowerCase().indexOf("text/html") >= 0 || /^\s*</.test(text || "");
        var shouldFallback = !parsed.ok && (looksLikeHtml || response.status === 404 || response.status === 405);

        if (parsed.ok) {
          return { url: url, response: response, data: parsed.value, text: text };
        }

        lastError = new Error("Non-JSON response from " + url + " (status " + response.status + ")");
        lastError.status = response.status;
        lastError.url = url;
        lastError.text = text;

        if (!shouldFallback || i === candidates.length - 1) {
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        if (i === candidates.length - 1) throw err;
      }
    }

    throw lastError || new Error("API request failed");
  }

  async function fetchWithApiFallback(path, init, preferredBase) {
    var candidates = getApiBaseCandidates(preferredBase);
    var lastError = null;

    for (var i = 0; i < candidates.length; i++) {
      var url = buildUrl(candidates[i], path);
      try {
        var response = await fetch(url, init || {});
        var contentType = (response.headers && response.headers.get("content-type")) || "";
        var shouldFallback =
          !response.ok &&
          (response.status === 404 ||
            response.status === 405 ||
            contentType.toLowerCase().indexOf("text/html") >= 0);

        if (!shouldFallback || i === candidates.length - 1) {
          return { url: url, response: response };
        }
      } catch (err) {
        lastError = err;
        if (i === candidates.length - 1) throw err;
      }
    }

    throw lastError || new Error("API request failed");
  }

  window.getApiBaseCandidates = getApiBaseCandidates;
  window.fetchJsonWithApiFallback = fetchJsonWithApiFallback;
  window.fetchWithApiFallback = fetchWithApiFallback;
})();
