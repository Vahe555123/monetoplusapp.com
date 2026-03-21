(function () {
  var runtime = window.__FORM_RUNTIME_CONFIG__ || {};
  var formMeta = document.querySelector('meta[name="api-base"]');
  var mainMeta = document.querySelector('meta[name="main-api-base"]');
  var formMetaValue = (formMeta && formMeta.getAttribute("content")) || "";
  var mainMetaValue = (mainMeta && mainMeta.getAttribute("content")) || "";
  var origin =
    (typeof window !== "undefined" && window.location && window.location.origin) || "";
  var runtimeMain = runtime.MAIN_API_BASE || "";

  var FORM =
    runtime.FORM_API_BASE ||
    formMetaValue ||
    runtimeMain ||
    mainMetaValue ||
    origin;
  var MAIN =
    runtimeMain ||
    mainMetaValue ||
    FORM;
  var PUBLIC = runtime.FORM_PUBLIC_URL || FORM || origin;
  var WHATSAPP_BASE = runtime.WHATSAPP_BASE_URL || "";

  window.FORM_PUBLIC_URL = PUBLIC;
  window.FORM_API_BASE = FORM;
  window.MAIN_API_BASE = MAIN;
  window.API_BASE = FORM;
  window.WHATSAPP_BASE_URL = WHATSAPP_BASE;
})();
