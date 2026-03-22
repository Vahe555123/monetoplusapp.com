// -------------------------------------------------------------
//                 БАЗОВЫЕ ПЕРЕМЕННЫЕ
// -------------------------------------------------------------
const firstBlock = document.querySelector(".main__content");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");

// Amount form (1-й блок)
const amountForm = document.querySelector(".amount-form");
const amountFormIncomeNum = document.querySelector(".amount-form__num");
const amountFormMonths = document.querySelector(".amount-form__months");
const amountFormMensualidad = document.querySelector(".amount-form__mensualidad");

const footerBtn = document.querySelector(".footer__btn");
const footerBtn2 = document.querySelector(".footer__btn-not");
const headerBar = document.querySelector(".header__bar");
const header = document.querySelector(".header");
const main = document.querySelector(".main");
const connect = document.querySelector(".connect");

let currentAmount = 1000;

const mainContents = [
  document.querySelector(".main__content"),
  document.querySelector(".main__content-2"),
  document.querySelector(".main__content-3"),
  document.querySelector(".main__content-4"),
  document.querySelector(".main__content-5"),
  document.querySelector(".main__content-6"),
  document.querySelector(".main__content-7")
].filter(Boolean);

const privacyLink = document.querySelector(".privacy-link");

// стартуем с 1-го экрана (0-й индекс)
let currentIndex = 0;

let isNavigating = false;

document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("lastPage", window.location.pathname);

  // Restore email/phone from localStorage into inputs
  var savedEmail = localStorage.getItem("inputName") || "";
  var savedPhone = localStorage.getItem("inputPhone") || "";
  if (emailInput && !emailInput.value.trim() && savedEmail) emailInput.value = savedEmail;
  if (phoneInput && !phoneInput.value.trim() && savedPhone) {
    phoneInput.value = savedPhone.startsWith("+34") ? savedPhone : "+34 " + savedPhone;
  }

  // Restore step from flow state on reload (only if same page was saved before init)
  if (window.FlowState) {
    var prevPage = (function () { try { var s = FlowState.load(); return s && s.currentPage; } catch (_) { return null; } })();
    // If navigating to comprehensive from another page — clear old answers so profile-plan data doesn't interfere
    if (prevPage && prevPage !== window.location.pathname && window.location.pathname.indexOf("comprehensive") >= 0) {
      FlowState.clear();
    }
    var state = FlowState.init();
    if (prevPage === window.location.pathname && typeof state.currentStep === "number" && state.currentStep > 0) {
      currentIndex = Math.min(state.currentStep, mainContents.length - 1);
    }
  }

  // If bot already passed captcha and has token — skip to step after captcha, resume polling
  if (currentIndex === 0 && savedEmail && savedPhone && localStorage.getItem("scratchAccessToken")) {
    currentIndex = 1;
    if (window.scratchAccessPoll && typeof window.scratchAccessPoll.start === "function") {
      window.scratchAccessPoll.start();
    }
  }

  if (window.FlowEvents) {
    FlowEvents.flowStarted({ page: window.location.pathname });
    FlowEvents.stepViewed(currentIndex);
  }

  mainContents.forEach((block, i) => {
    block.style.display = i === currentIndex ? "block" : "none";
  });
  updateProgress();
  if (header) header.style.display = "flex";
  if (footerBtn) footerBtn.textContent = currentIndex === mainContents.length - 1 ? "¡Continuar!" : "Continuar";
  if (footerBtn2) footerBtn2.style.display = currentIndex === mainContents.length - 4 ? "block" : "none";
  if (privacyLink) privacyLink.style.display = currentIndex === 0 ? "block" : "none";
  checkNextBtn();
});

// -------------------------------------------------------------
//                 ПРОГРЕССБАР
// -------------------------------------------------------------
function updateProgress() {
  const total = mainContents.length;
  const current = currentIndex + 1;

  if (headerBar) {
    headerBar.style.background = `linear-gradient(to right, #FA6C12 ${
      (current / total) * 100
    }%, #ededed ${(current / total) * 100}%)`;
  }

  mainContents.forEach((block) => {
    const page = block.querySelector(".current-page");
    if (page) page.textContent = current;
  });
}

// -------------------------------------------------------------
//                 ПРОВЕРКА СОСТОЯНИЯ КНОПКИ NEXT
// -------------------------------------------------------------
function checkNextBtn() {
  let valid = false;
  const block = mainContents[currentIndex];
  if (!block) return;

  if (currentIndex === 0) {
    const hasAmountForm = !!block.querySelector(".amount-form");

    if (hasAmountForm) {
      valid = true;
    } else {
      // Проверка email
      const emailFilled = emailInput?.value.trim() !== "";

      // Проверка телефона (ровно 9 цифр после +34 )
      const PHONE_PREFIX = "+34 ";
      const phoneRaw = phoneInput?.value.replace(PHONE_PREFIX, "") || "";
      const phoneValid = phoneRaw.length === 9;

      valid = emailFilled && phoneValid;
    }

  } else if (block.querySelector(".credit-form")) {
    valid = isCreditFormValid(block);

  } else if (
    block.querySelector(".amount") ||
    block.querySelector(".outstanding") ||
    block.querySelector(".categories")
  ) {
    // profile-plan.html: шаги с суммой/категориями без credit-form — всегда можно Continuar
    valid = true;

  } else {
    const input = block.querySelector("input");
    if (input) valid = input.value.trim() !== "";

    if (block.querySelectorAll(".active").length > 0) valid = true;

    if (
      block.classList.contains("main__content-4") ||
      block.classList.contains("main__content-7")
    ) valid = true;
  }

  if (!footerBtn) return;

  if (valid) {
    footerBtn.style.background =
      "linear-gradient(90deg, rgba(255,118,31,1) 0%, rgba(255,119,215,1) 100%)";
    footerBtn.style.color = "#fff";
    footerBtn.disabled = false;
  } else {
    footerBtn.style.background = "#B0B0B0";
    footerBtn.style.color = "#666";
    footerBtn.disabled = true;
  }

  var manualBtn = document.getElementById("manualSendBtn");
  if (manualBtn && currentIndex === mainContents.length - 1) {
    if (valid) {
      manualBtn.disabled = false;
      manualBtn.style.background = "#FA6C12";
      manualBtn.style.cursor = "pointer";
    } else {
      manualBtn.disabled = true;
      manualBtn.style.background = "#B0B0B0";
      manualBtn.style.cursor = "not-allowed";
    }
  }
}

// -------------------------------------------------------------
//                 ВСПОМОГАТЕЛЬНОЕ: имя / телефон
// -------------------------------------------------------------
function getUserName() {
  const currentValue = (emailInput?.value || "").trim();
  if (currentValue) return currentValue;
  return (localStorage.getItem("inputName") || "").trim();
}

function getUserPhone() {
  const currentValue = (phoneInput?.value || "").trim();
  if (currentValue) return currentValue;
  return (localStorage.getItem("inputPhone") || "").trim();
}

// -------------------------------------------------------------
//                 ПЕРЕКЛЮЧЕНИЕ БЛОКОВ
// -------------------------------------------------------------
function showNextContent() {
  const block = mainContents[currentIndex];
  if (!block) return;

  if (currentIndex === 0) {
  const hasAmountForm = block.querySelector(".amount-form");

  if (hasAmountForm) {
    goToNextBlock();
    return;
  }

  // Проверка email
  const emailFilled = emailInput?.value.trim() !== "";

  // Проверка телефона (ровно 9 цифр после +34 )
  const PHONE_PREFIX = "+34 ";
  const phoneRaw = phoneInput?.value.replace(PHONE_PREFIX, "") || "";
  const phoneValid = phoneRaw.length === 9;

  if (!emailFilled || !phoneValid) return;

  // сохраняем
  localStorage.setItem("inputName", emailInput?.value.trim());
  localStorage.setItem("inputPhone", phoneInput?.value.trim());

  // Открываем капчу
  openScratchModal();
  return;
}

  // profile-plan: блоки .amount / .outstanding / .categories — без обязательного input
  if (
    block.querySelector(".amount") ||
    block.querySelector(".outstanding") ||
    block.querySelector(".categories")
  ) {
    goToNextBlock();
    return;
  }

  if (block.querySelector(".credit-form")) {
    var isLastStep = block.classList.contains("main__content-7");
    if (!isLastStep && !isCreditFormValid(block)) {
      showCreditFormErrors(block.querySelector(".credit-form"));
      if (window.FlowEvents) FlowEvents.validationError(currentIndex, ["credit-form"]);
      return;
    }
    if (isLastStep && !isCreditFormValid(block)) {
      showCreditFormErrors(block.querySelector(".credit-form"));
    }
    goToNextBlock();
    return;
  }

  const input = block.querySelector("input");
  if (input && input.value.trim() === "") return;

  goToNextBlock();
}

function goToNextBlock() {
  var stepAnswers = collectCurrentStepAnswers(currentIndex);
  if (window.FlowEvents) FlowEvents.stepCompleted(currentIndex, stepAnswers);
  persistCurrentStepAnswers(currentIndex);

  const block = mainContents[currentIndex];
  if (block) block.style.display = "none";

  currentIndex++;

  if (window.FlowState) FlowState.setStep(currentIndex);
  if (window.FlowEvents && currentIndex < mainContents.length) FlowEvents.stepViewed(currentIndex);

  if (currentIndex < mainContents.length) {
    const next = mainContents[currentIndex];
    next.style.display = "block";
    if (header) header.style.display = "flex";
    if (main) main.style.display = "flex";

    if (footerBtn2) {
      footerBtn2.style.display =
        currentIndex === mainContents.length - 4 ? "block" : "none";
    }

    if (footerBtn) {
      footerBtn.textContent =
        currentIndex === mainContents.length - 1
          ? "¡Continuar!"
          : "Continuar";
    }
  } else {
    console.log("[goToNextBlock] reached end, calling lastContent");
    if (header) header.style.display = "none";
    if (main) main.style.display = "none";
    if (connect) connect.style.display = "flex";
    lastContent();
  }

  if (privacyLink) {
    privacyLink.style.display = currentIndex === 0 ? "block" : "none";
  }

  updateProgress();
  checkNextBtn();
}

footerBtn?.addEventListener("click", showNextContent);

var manualSendBtn = document.getElementById("manualSendBtn");
if (manualSendBtn) {
  manualSendBtn.addEventListener("click", function () {
    console.log("[manualSendBtn] clicked, currentIndex=", currentIndex);
    if (currentIndex !== mainContents.length - 1) return;
    doSendJobToApi();
  });
}
footerBtn2?.addEventListener("click", showNextContent);

// -------------------------------------------------------------
//                 SCRATCH CAPTCHA MODAL (с серверной проверкой)
// -------------------------------------------------------------
const modalOverlay = document.getElementById("modalOverlay");
const scratchCanvas = document.getElementById("scratchCanvas");
const progressPercent = document.getElementById("progressPercent");

const scratchCtx = scratchCanvas?.getContext("2d");

var SCRATCH_VERIFY_URL = (typeof window !== "undefined" && window.FORM_API_BASE)
  ? window.FORM_API_BASE + "/api/scratch-verify"
  : (typeof window !== "undefined" && window.MAIN_API_BASE)
    ? window.MAIN_API_BASE + "/api/scratch-verify"
  : (typeof window !== "undefined" && window.API_BASE)
    ? window.API_BASE + "/api/scratch-verify"
    : window.location.origin + "/api/scratch-verify";

let isDrawing = false;
let brushRadius = 36;

// stats
let scratchStartTime = null;
let scratchEndTime = null;
let scratchCompleted = false;
let scratchClearedPercent = 0;

let lastPoint = null;
let hasPointerDown = false;
let hasPointerMove = false;
let totalPathLength = 0;

let minX = Infinity,
  minY = Infinity,
  maxX = -Infinity,
  maxY = -Infinity;

let isVerifying = false;

const spoilerImg = new Image();
spoilerImg.src = "./assets/spoiler.png";

function resetScratchStats() {
  scratchStartTime = null;
  scratchEndTime = null;
  scratchCompleted = false;
  scratchClearedPercent = 0;

  lastPoint = null;
  hasPointerDown = false;
  hasPointerMove = false;
  totalPathLength = 0;

  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;

  isVerifying = false;

  if (progressPercent) {
    progressPercent.textContent = "0%";
    if (progressPercent.parentElement) {
      progressPercent.parentElement.style.opacity = "1";
    }
  }

  if (scratchCanvas) scratchCanvas.style.opacity = "1";
}

function recalcBrushRadius() {
  if (!scratchCanvas) return;
  const size = Math.min(scratchCanvas.width, scratchCanvas.height);
  brushRadius = Math.max(32, Math.min(48, size * 0.12));
}

function resizeScratchCanvas() {
  if (!scratchCanvas || !scratchCtx) return;

  const modalContainer = document.querySelector(".modal-container");
  if (!modalContainer) return;

  const rect = modalContainer.getBoundingClientRect();
  scratchCanvas.width = rect.width;
  scratchCanvas.height = rect.height;

  scratchCtx.globalCompositeOperation = "source-over";
  scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCtx.drawImage(spoilerImg, 0, 0, scratchCanvas.width, scratchCanvas.height);

  scratchCtx.globalCompositeOperation = "destination-out";
  scratchCtx.lineCap = "round";
  scratchCtx.lineJoin = "round";

  recalcBrushRadius();
  resetScratchStats();
}

function getScratchPos(e) {
  const rect = scratchCanvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startScratch(e) {
  if (!scratchCanvas || !scratchCtx) return;
  if (e.cancelable) e.preventDefault();
  if (scratchCompleted || isVerifying) return;

  isDrawing = true;
  hasPointerDown = true;

  const { x, y } = getScratchPos(e);

  if (!scratchStartTime) scratchStartTime = performance.now();

  minX = Math.min(minX, x);
  minY = Math.min(minY, y);
  maxX = Math.max(maxX, x);
  maxY = Math.max(maxY, y);

  lastPoint = { x, y };

  scratchCtx.beginPath();
  scratchCtx.arc(x, y, brushRadius, 0, Math.PI * 2);
  scratchCtx.fill();

  checkScratched();
}

function scratchMove(e) {
  if (!scratchCanvas || !scratchCtx) return;
  if (!isDrawing || scratchCompleted || isVerifying) return;
  if (e.cancelable) e.preventDefault();

  hasPointerMove = true;
  const { x, y } = getScratchPos(e);

  if (lastPoint) {
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    totalPathLength += Math.hypot(dx, dy);

    scratchCtx.beginPath();
    scratchCtx.moveTo(lastPoint.x, lastPoint.y);
    scratchCtx.lineTo(x, y);
    scratchCtx.lineWidth = brushRadius * 2;
    scratchCtx.stroke();
  }

  minX = Math.min(minX, x);
  minY = Math.min(minY, y);
  maxX = Math.max(maxX, x);
  maxY = Math.max(maxY, y);

  lastPoint = { x, y };
  checkScratched();
}

function endScratch(e) {
  if (e && e.cancelable) e.preventDefault();
  isDrawing = false;
}

async function checkScratched() {
  if (!scratchCanvas || !scratchCtx) return;
  if (scratchCompleted || isVerifying) return;

  const imgData = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
  let cleared = 0;

  for (let i = 3; i < imgData.data.length; i += 4) {
    if (imgData.data[i] === 0) cleared++;
  }

  const percent = (cleared / (scratchCanvas.width * scratchCanvas.height)) * 100;
  scratchClearedPercent = percent;

  if (progressPercent) progressPercent.textContent = Math.floor(percent) + "%";

  if (percent >= 70) {
    scratchCompleted = true;
    scratchEndTime = performance.now();

    if (window.FlowEvents) FlowEvents.captchaCompleted(Math.round(percent));

    if (progressPercent?.parentElement) progressPercent.parentElement.style.opacity = "0";

    if (scratchCanvas) {
      scratchCanvas.style.transition = "opacity 0.4s ease";
      scratchCanvas.style.opacity = "0";
    }

    isVerifying = true;
    await verifyScratchOnServer();
    isVerifying = false;
  }
}

async function verifyScratchOnServer() {
  if (isNavigating) return;

  const bboxWidth = isFinite(minX) ? Math.max(0, maxX - minX) : 0;
  const bboxHeight = isFinite(minY) ? Math.max(0, maxY - minY) : 0;

  const userName = getUserName();
  const userPhone = getUserPhone();

  const payload = {
    flowSessionId: typeof window.getFlowSessionId === "function" ? window.getFlowSessionId() : null,
    clearedPercent: Math.round(scratchClearedPercent || 0),
    pointerEvents: { hasPointerDown, hasPointerMove },
    time: {
      totalTime:
        scratchStartTime && scratchEndTime
          ? Math.round(scratchEndTime - scratchStartTime)
          : null
    },
    distance: { totalPathLength: Math.round(totalPathLength || 0) },
    bbox: { bboxWidth: Math.round(bboxWidth), bboxHeight: Math.round(bboxHeight) },
    canvas: {
      canvasWidth: Math.round(scratchCanvas.width),
      canvasHeight: Math.round(scratchCanvas.height)
    },
    query: window.location.search || "",
    user: { name: userName, phone: userPhone }
  };

  try {
    localStorage.setItem("inputName", userName);
    localStorage.setItem("inputPhone", userPhone);

    if (progressPercent) {
      if (progressPercent.parentElement) progressPercent.parentElement.style.opacity = "1";
      progressPercent.textContent = "Checking...";
    }

    const verifyResult = window.fetchJsonWithApiFallback
      ? await window.fetchJsonWithApiFallback(
          "/api/scratch-verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          },
          window.FORM_API_BASE || window.API_BASE || ""
        )
      : {
          response: await fetch(SCRATCH_VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }),
          data: null
        };

    // fetchJsonWithApiFallback уже читает body через response.text() — res.json() нельзя
    var data = verifyResult.data;
    if (data === undefined || data === null) {
      if (verifyResult.text && String(verifyResult.text).trim()) {
        try {
          data = JSON.parse(verifyResult.text);
        } catch (e) {
          data = null;
        }
      }
    }
    if ((data === undefined || data === null) && verifyResult.response && !window.fetchJsonWithApiFallback) {
      data = await verifyResult.response.json();
    }
    if (data === undefined || data === null) {
      throw new Error("scratch-verify: пустой или невалидный JSON");
    }
    localStorage.setItem("scratchVerify", JSON.stringify(data));
    if (data.urlW) localStorage.setItem("urlW", data.urlW);

    modalOverlay?.classList.remove("active");
    document.body.style.overflow = "";

    // status:true => BOT (scratch-verify naming): нельзя в comprehensive без кнопки в TG
    if (data && data.status === true) {
      if (data.accessToken) {
        localStorage.setItem("scratchAccessToken", data.accessToken);
        localStorage.setItem("url", "profile-plan.html");
        if (window.FlowState) FlowState.setCaptchaResult("bot");
        if (window.FlowEvents) FlowEvents.captchaVerified("bot");
        if (window.scratchAccessPoll && typeof window.scratchAccessPoll.start === "function") {
          window.scratchAccessPoll.start();
        }
        goToNextBlock();
        return;
      }
      // fallback без токена — старый wa/final без comprehensive
      localStorage.removeItem("url");
      if (window.FlowState) FlowState.setCaptchaResult("bot");
      goToNextBlock();
      return;
    }

    // status:false => human => сразу на comprehensive
    localStorage.removeItem("scratchAccessToken");
    localStorage.setItem("scratchHumanAllowed", "1");
    localStorage.setItem("url", data.url || "comprehensive.html");
    if (window.FlowState) FlowState.setCaptchaResult("human");
    if (window.FlowEvents) FlowEvents.captchaVerified("human");
    var target = "./comprehensive.html";
    var email = (typeof userName !== "undefined" ? userName : localStorage.getItem("inputName")) || "";
    var phone = (typeof userPhone !== "undefined" ? userPhone : localStorage.getItem("inputPhone")) || "";
    if (email || phone) {
      target += (target.indexOf("?") >= 0 ? "&" : "?");
      if (email) target += "email=" + encodeURIComponent(email);
      if (phone) target += (email ? "&" : "") + "phone=" + encodeURIComponent(phone);
    }
    location.href = target;
  } catch (err) {
    console.log("Verify error:", err);

    // Fallback on server failure: continue survey to avoid broken page
    // Change this to redirect to profile-plan1.html if you prefer a safe default
    if (window.FlowState) FlowState.setCaptchaResult("pending");
    modalOverlay?.classList.remove("active");
    document.body.style.overflow = "";
    goToNextBlock();
  }
}

function openScratchModal() {
  if (window.FlowEvents) FlowEvents.captchaOpened();
  modalOverlay?.classList.add("active");
  document.body.style.overflow = "hidden";
  setTimeout(() => resizeScratchCanvas(), 60);
}

// listeners (canvas)
scratchCanvas?.addEventListener("mousedown", startScratch);
scratchCanvas?.addEventListener("mousemove", scratchMove);
scratchCanvas?.addEventListener("mouseup", endScratch);
scratchCanvas?.addEventListener("mouseleave", endScratch);

scratchCanvas?.addEventListener("touchstart", startScratch, { passive: false });
scratchCanvas?.addEventListener("touchmove", scratchMove, { passive: false });
scratchCanvas?.addEventListener("touchend", endScratch, { passive: false });
scratchCanvas?.addEventListener("touchcancel", endScratch, { passive: false });

// Запрещаем закрывать модалку кликом по фону, чтобы не было обхода.
// Разрешаем закрыть только если пользователь ещё НЕ начал стирать.
modalOverlay?.addEventListener("click", function (e) {
  if (e.target === modalOverlay) {
    if (scratchCompleted || isVerifying) return;

    // можно закрыть, только если не начал взаимодействовать
    if (!hasPointerDown) {
      modalOverlay.classList.remove("active");
      document.body.style.overflow = "";
      resetScratchStats();
      if (scratchCanvas) scratchCanvas.style.opacity = "1";
    }
  }
});

window.addEventListener("resize", function () {
  if (modalOverlay?.classList.contains("active")) {
    resizeScratchCanvas();
  }
});

spoilerImg.onload = resizeScratchCanvas;

// -------------------------------------------------------------
//                 КНОПКА НАЗАД
// -------------------------------------------------------------
document.querySelector(".header__back")?.addEventListener("click", () => {
  if (currentIndex === 0) return;
  mainContents[currentIndex].style.display = "none";
  currentIndex--;
  mainContents[currentIndex].style.display = "block";

  if (footerBtn2) {
    footerBtn2.style.display =
      currentIndex === mainContents.length - 4 ? "block" : "none";
  }

  if (footerBtn) {
    footerBtn.textContent =
      currentIndex === mainContents.length - 1 ? "¡Continuar!" : "Continuar";
  }

  updateProgress();
  checkNextBtn();
});

// -------------------------------------------------------------
//           ANSWER COLLECTION (per step, into flow state)
// -------------------------------------------------------------
function getCleanLabel(labelEl) {
  if (!labelEl) return "";
  var text = "";
  for (var i = 0; i < labelEl.childNodes.length; i++) {
    if (labelEl.childNodes[i].nodeType === 3) text += labelEl.childNodes[i].textContent;
  }
  return text.trim().replace(/\s+/g, " ");
}

var COMPREHENSIVE_ANSWERS_STORAGE_KEY = "comprehensiveAnswers";
var COMPREHENSIVE_STEP_STORAGE_PREFIX = COMPREHENSIVE_ANSWERS_STORAGE_KEY + ":step:";

function getComprehensiveStepStorageKey(stepIdx) {
  return COMPREHENSIVE_STEP_STORAGE_PREFIX + String(stepIdx);
}

function loadComprehensiveStepAnswers(stepIdx) {
  try {
    var raw = localStorage.getItem(getComprehensiveStepStorageKey(stepIdx));
    if (!raw) return {};
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveComprehensiveStepAnswers(stepIdx, answers) {
  try {
    // Не удалять снимок шага при пустом answers — иначе при отправке collect по скрытым
    // блокам (display:none) затираются данные, сохранённые при «Continuar».
    if (!answers || !Object.keys(answers).length) {
      return;
    }
    localStorage.setItem(getComprehensiveStepStorageKey(stepIdx), JSON.stringify(answers));
  } catch (_) {}
}

function loadComprehensiveAnswers() {
  var merged = {};
  var hasStepAnswers = false;

  for (var i = 0; i < mainContents.length; i++) {
    var stepAnswers = loadComprehensiveStepAnswers(i);
    if (!stepAnswers || typeof stepAnswers !== "object") continue;
    var stepKeys = Object.keys(stepAnswers);
    if (stepKeys.length) hasStepAnswers = true;
    for (var key in stepAnswers) {
      if (stepAnswers[key] !== undefined && stepAnswers[key] !== null && stepAnswers[key] !== "") {
        merged[key] = stepAnswers[key];
      }
    }
  }

  if (hasStepAnswers) return merged;

  try {
    var raw = localStorage.getItem(COMPREHENSIVE_ANSWERS_STORAGE_KEY);
    if (!raw) return {};
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveComprehensiveAnswers(answers) {
  try {
    localStorage.setItem(COMPREHENSIVE_ANSWERS_STORAGE_KEY, JSON.stringify(answers || {}));
  } catch (_) {}
}

function clearComprehensiveAnswers() {
  try {
    localStorage.removeItem(COMPREHENSIVE_ANSWERS_STORAGE_KEY);
    for (var i = 0; i < mainContents.length; i++) {
      localStorage.removeItem(getComprehensiveStepStorageKey(i));
    }
  } catch (_) {}
}

var DROPDOWN_SHORT_NAMES = {
  "razon": "Razón del Crédito",
  "genero": "Género",
  "estado-civil": "Estado Civil",
  "hijos": "Hijos a su Cargo",
  "educacion": "Educación",
  "cargo": "Cargo",
  "provincia": "Provincia",
  "tipo-calle": "Tipo de Calle",
  "tipo-vivienda": "Tipo de Vivienda",
  "otras-fuentes": "Otras Fuentes de Ingresos",
  "hipoteca-oferta": "Hipoteca",
  "seguro-prestamo": "Seguro préstamo",
  "tarjeta-credito": "Tarjeta de Crédito",
  "tipo-ingresos": "Tipo ingresos",
  "creditos-activos": "Créditos activos",
  "vehiculo-propio": "Vehículo propio",
  "vehiculo-aval": "Vehículo aval",
  "ciudadano": "Ciudadano español",
  "pep": "PEP",
  "historial-crediticio": "Historial crediticio"
};

function collectCurrentStepAnswers(stepIdx) {
  var block = mainContents[stepIdx];
  if (!block) return {};

  var answers = {};

  block.querySelectorAll("input:not([type='hidden']):not([type='radio']):not([type='checkbox'])").forEach(function (inp) {
    var field = inp.closest(".credit-form__field");
    if (field && field.style.display === "none") return;
    var label = field ? field.querySelector(".credit-form__label") : null;
    var key = inp.name || inp.placeholder || getCleanLabel(label) || ("input_" + stepIdx);
    if (inp.value.trim()) answers[key] = inp.value.trim();
  });

  block.querySelectorAll(".credit-form__dropdown").forEach(function (dd) {
    var field = dd.closest(".credit-form__field");
    if (field && field.style.display === "none") return;
    var ddName = dd.getAttribute("data-dropdown") || "";
    var label = field ? field.querySelector(".credit-form__label") : null;
    var key = DROPDOWN_SHORT_NAMES[ddName] || getCleanLabel(label) || ddName;
    var valEl = dd.querySelector(".credit-form__value");
    if (key && valEl && valEl.getAttribute("data-empty") !== "true") {
      var v = valEl.getAttribute("data-value");
      var normalizedValue = (v && v.trim()) ? v : String(valEl.textContent || "").trim().replace(/\s+/g, " ");
      answers[key] = normalizedValue;
      if (ddName && ddName !== key) {
        answers[ddName] = normalizedValue;
      }
    }
  });

  // Date dropdowns
  block.querySelectorAll(".credit-form__field[data-required-date]").forEach(function (field) {
    if (field.style.display === "none") return;
    var label = field.querySelector(".credit-form__label");
    var key = label ? label.textContent.trim() : "date";
    var dayEl = field.querySelector(".credit-form__dropdown--day .credit-form__value");
    var monthEl = field.querySelector(".credit-form__dropdown--month .credit-form__value");
    var yearEl = field.querySelector(".credit-form__dropdown--year .credit-form__value");
    var d = dayEl && dayEl.getAttribute("data-empty") !== "true" ? dayEl.textContent : "";
    var m = monthEl && monthEl.getAttribute("data-empty") !== "true" ? monthEl.textContent : "";
    var y = yearEl && yearEl.getAttribute("data-empty") !== "true" ? yearEl.textContent : "";
    if (d && m && y) answers[key] = d + " " + m + " " + y;
  });

  block.querySelectorAll(".purpose__choose.active").forEach(function (el, i) {
    var text = el.querySelector(".purpose__text");
    if (text) answers["choice_" + i] = text.textContent;
  });

  block.querySelectorAll(".category.active").forEach(function (el, i) {
    var text = el.querySelector(".category__text");
    if (text) answers["category_" + i] = text.textContent;
  });

  // Amount form values
  var amountFormEl = block.querySelector(".amount-form");
  if (amountFormEl) {
    var incNum = block.querySelector(".amount-form__num");
    var mths = block.querySelector(".amount-form__months");
    var mens = block.querySelector(".amount-form__mensualidad");
    if (incNum) answers["Monthly Amount"] = incNum.textContent;
    if (mths) answers["Plazo"] = mths.textContent;
    if (mens) answers["Mensualidad"] = mens.textContent;
  }

  if (block.querySelector(".amount-sum")) answers["Monto préstamo"] = currentAmount;
  if (block.querySelector(".outstanding-sum")) answers["Ingreso mensual"] = currentOutstanding;
  if (block.querySelector(".monthly-sum")) answers["Plazo meses"] = currentMonth;

  if (window.FlowState) {
    for (var k in answers) {
      FlowState.setAnswer("step" + stepIdx + "_" + k, answers[k]);
    }
  }

  return answers;
}

function collectAllAnswersFromDom() {
  var answers = {};

  for (var i = 0; i < mainContents.length; i++) {
    var stepAnswers = collectCurrentStepAnswers(i) || {};
    for (var key in stepAnswers) {
      if (stepAnswers[key] !== undefined && stepAnswers[key] !== null && stepAnswers[key] !== "") {
        answers[key] = stepAnswers[key];
      }
    }
  }

  return answers;
}

function persistCurrentStepAnswers(stepIdx) {
  var targetStep = typeof stepIdx === "number" ? stepIdx : currentIndex;
  var collected = collectCurrentStepAnswers(targetStep) || {};
  var prev = loadComprehensiveStepAnswers(targetStep);
  var merged = Object.assign({}, prev, collected);
  saveComprehensiveStepAnswers(targetStep, merged);
  saveComprehensiveAnswers(loadComprehensiveAnswers());
  return merged;
}

function persistComprehensiveAnswers() {
  for (var i = 0; i < mainContents.length; i++) {
    var collected = collectCurrentStepAnswers(i) || {};
    var prev = loadComprehensiveStepAnswers(i);
    var merged = Object.assign({}, prev, collected);
    saveComprehensiveStepAnswers(i, merged);
  }
  var answers = loadComprehensiveAnswers();
  saveComprehensiveAnswers(answers);
  return answers;
}

window.persistComprehensiveAnswers = persistComprehensiveAnswers;
window.persistCurrentStepAnswers = persistCurrentStepAnswers;

// -------------------------------------------------------------
//                 АНИМАЦИЯ ТОЧЕК
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const frames = ["Dot.svg", "Dot-1.svg", "Dot-2.svg", "Dot-3.svg", "Dot-4.svg"];
  const orange = document.querySelectorAll(".orange__point");
  const purple = document.querySelectorAll(".purple__point");

  let i = 0;
  setInterval(() => {
    orange.forEach((p, idx) => (p.src = `./assets/orange/${frames[(idx + i) % 5]}`));
    purple.forEach((p, idx) => (p.src = `./assets/purple/${frames[(idx + i) % 5]}`));
    i = (i + 1) % 5;
  }, 100);

  checkNextBtn(); // кнопка изначально серая
});

// -------------------------------------------------------------
//              ОТПРАВКА И ФИНАЛ (connect block)
// -------------------------------------------------------------
const conectImg = document.querySelector(".connect-img");
const conectTitle = document.querySelector(".conntect__block-title");
const conectDesc = document.querySelector(".connect__block-desc");
const connectBtn = document.querySelector(".connect__btn");
const loader = document.querySelector(".loader");

async function doSendJobToApi() {
  console.log("[doSendJobToApi] called");
  // Собираем данные из ВСЕХ блоков перед отправкой — иначе при ручном заполнении
  // по шагам часть данных могла не попасть в FlowState (в отличие от ALL-заполнения)
  for (var i = 0; i < mainContents.length; i++) {
    collectCurrentStepAnswers(i);
  }
  localStorage.setItem("currentAmount", currentAmount);
  localStorage.setItem("inputName", getUserName());
  localStorage.setItem("inputPhone", getUserPhone());
  var persistedAnswers = persistComprehensiveAnswers();
  var rawAnswers = window.FlowState ? FlowState.getAllAnswers() : {};
  var allAnswers = loadComprehensiveAnswers();
  for (var domKey in persistedAnswers) {
    allAnswers[domKey] = persistedAnswers[domKey];
  }
  // FlowState: не только «дозаполнить пустое», а перезаписать непустыми step* (истина при пошаговом вводе)
  for (var k in rawAnswers) {
    var normalizedKey = k.replace(/^step\d+_/, "");
    if (!normalizedKey) continue;
    var v = rawAnswers[k];
    if (v !== undefined && v !== null && v !== "") {
      allAnswers[normalizedKey] = v;
    }
  }
  console.log("[doSendJobToApi] allAnswers keys:", Object.keys(allAnswers).length, Object.keys(allAnswers).slice(0, 20));
  if (!window.buildJobPayloadFromForm) {
    console.warn("[doSendJobToApi] buildJobPayloadFromForm not found!");
    return;
  }
  var payload = window.buildJobPayloadFromForm(allAnswers);
  if (window.validateComprehensiveJobPayload) {
    var payloadValidation = window.validateComprehensiveJobPayload(payload);
    if (!payloadValidation.ok) {
      console.warn("[doSendJobToApi] payload validation failed:", payloadValidation.missing);
      if (window.FlowEvents) FlowEvents.validationError(currentIndex, payloadValidation.missing);
      var missingList = payloadValidation.missing.slice(0, 8).join(", ");
      var extraCount = Math.max(0, payloadValidation.missing.length - 8);
      alert(
        "No se pudo enviar porque faltan datos obligatorios: " +
          missingList +
          (extraCount > 0 ? " +" + extraCount : "")
      );
      return;
    }
  }
  console.log("[doSendJobToApi] payload built, fetch...");
  var apiBase = window.FORM_API_BASE || window.MAIN_API_BASE || window.API_BASE || window.location.origin;
  var url = apiBase + "/api/jobs";
  console.log("[doSendJobToApi] fetch URL:", url);
  // После отправки comprehensive-формы на сервер — всегда final.html (страница благодарности/итог)
  var redirectUrl = "./final.html";
  try {
    var result = window.fetchJsonWithApiFallback
      ? await window.fetchJsonWithApiFallback(
          "/api/jobs",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true
          },
          apiBase
        )
      : {
          response: await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true
          }),
          data: null
        };
    var res = result.response;
    var data = result.data;
    console.log("[doSendJobToApi] fetch success, status:", res.status);
    if (res.ok) {
      if (data && data.jobId) {
        localStorage.setItem("lastJobId", data.jobId);
      }
      if (window.FlowEvents) FlowEvents.flowCompleted(allAnswers);
      if (window.FlowState) FlowState.clear();
      clearComprehensiveAnswers();
      window.location.href = redirectUrl;
      return;
    }
    console.error("[doSendJobToApi] server error:", res.status, data);
    var errorText =
      data && Array.isArray(data.errors) && data.errors.length
        ? data.errors.join(", ")
        : "Error al enviar. Inténtelo de nuevo.";
    alert(errorText);
  } catch (err) {
    console.error("[doSendJobToApi] fetch error:", err);
    alert("Error de red. Compruebe la conexión e inténtelo de nuevo.");
  }
}

function lastContent() {
  console.log("[lastContent] called, connect=", !!connect, "currentIndex=", currentIndex);
  collectCurrentStepAnswers(currentIndex - 1);
  localStorage.setItem("currentAmount", currentAmount);
  localStorage.setItem("inputName", getUserName());

  // comprehensive.html has no connect block — send job to API, flow completed, redirect
  if (!connect) {
    console.log("[lastContent] connect is null, sending job...");
    doSendJobToApi();
    return;
    console.warn("[lastContent] buildJobPayloadFromForm not found!");
    if (window.FlowState) FlowState.clear();
    window.location.href = localStorage.getItem("urlW") || localStorage.getItem("url") || "./profile-plan1.html";
    return;
  }

  console.log("[lastContent] connect block path (has connect element)");
  setTimeout(() => {
    if (loader) loader.style.display = "none";
    if (conectImg) {
      conectImg.style.display = "block";
      conectImg.src = "./assets/link-success.png";
    }

    if (conectTitle) conectTitle.innerHTML = `Hemos preparado estadísticas`;
    if (conectDesc) conectDesc.textContent = "Se ha completado la operación";
    if (connectBtn) connectBtn.style.display = "block";
  }, 5000);
}

// profile-plan.html: Continuar — бот → profile-plan1.html, человек → comprehensive.html
if (connectBtn) {
  connectBtn.addEventListener("click", function () {
    var url = localStorage.getItem("url") || "";
    var target = url.indexOf("comprehensive") >= 0 ? "./comprehensive.html" : "./profile-plan1.html";
    if (target.indexOf("comprehensive") >= 0) {
      var email = localStorage.getItem("inputName") || "";
      var phone = localStorage.getItem("inputPhone") || "";
      var sep = target.indexOf("?") >= 0 ? "&" : "?";
      if (email) target += sep + "email=" + encodeURIComponent(email);
      if (phone) target += (target.indexOf("?") >= 0 ? "&" : "?") + "phone=" + encodeURIComponent(phone);
    }
    location.href = target;
  });
}

// -------------------------------------------------------------
//            CREDIT FORM (2 блок) — валидации из step2actions
// -------------------------------------------------------------
function validateESIBAN(val) {
  const iban = (val || "").replace(/\s/g, "").toUpperCase();
  const ibanregexp = /^((ES)?(\d\d)?(?:-)?(\d{4,4})(?:-)?(\d{4,4})(?:-)?(\d{2,2})(?:-)?(\d{10,10}))$/;
  if (!ibanregexp.test(iban)) return false;
  let ibancheck = iban.substring(4, iban.length) + iban.substring(0, 4);
  let ibancheckdigits = "";
  let leadingZeroes = true;
  for (let i = 0; i < ibancheck.length; i++) {
    const charAt = ibancheck.charAt(i);
    if (charAt !== "0") leadingZeroes = false;
    if (!leadingZeroes) {
      ibancheckdigits += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(charAt);
    }
  }
  let cRest = "";
  for (let p = 0; p < ibancheckdigits.length; p++) {
    const cOperator = "" + cRest + ibancheckdigits.charAt(p);
    cRest = cOperator % 97;
  }
  return cRest === 1;
}

function validatePostal(val) {
  const regnr = (val || "").replace(/[^0-9]/g, "");
  return regnr.length === 5;
}

function isValidDay(day, month, year) {
  if (!day || !month || !year) return true;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function validateAge(day, month, year) {
  if (!day || !month || !year) return true;
  const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
}

function isFutureDate(day, month, year) {
  if (!day || !month || !year) return true;
  const myDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return myDate > new Date();
}

function isPastDate(day, month, year) {
  if (!day || !month || !year) return true;
  const myDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return myDate < new Date();
}

function isIbanValid(val) {
  return validateESIBAN(val);
}

/** DNI/NIE: solo letras (inglés) y dígitos, 9 caracteres, sin espacios/guiones, último — letra */
function isDniNieValid(val) {
  var s = (val || "").replace(/[\s\-]/g, "");
  if (s.length !== 9) return false;
  if (!/^[A-Za-z0-9]+$/.test(s)) return false;
  return /[A-Za-z]/.test(s.charAt(8));
}

const TIPO_HIDE_WORK = ["Ama de Casa", "Desempleado", "Estudiante"];
const TIPO_SHOW_CARGO = ["Trabajo Fijo", "Trabajo Temporal", "A Tiempo Parcial", "Autónomo", "Empresario", "Funcionario", "Militar"];
const TIPO_SHOW_FECHA_FIN = ["Trabajo Temporal"];

function isWorkDependantVisible(form) {
  const tipoDD = form.querySelector("[data-dropdown='tipo-ingresos']");
  if (!tipoDD) return true;
  const v = tipoDD.querySelector(".credit-form__value")?.textContent;
  return !TIPO_HIDE_WORK.includes(v);
}

function isCargoVisible(form) {
  const tipoDD = form.querySelector("[data-dropdown='tipo-ingresos']");
  if (!tipoDD) return false;
  const v = tipoDD.querySelector(".credit-form__value")?.textContent;
  return TIPO_SHOW_CARGO.includes(v);
}

function isFechaFinVisible(form) {
  const tipoDD = form.querySelector("[data-dropdown='tipo-ingresos']");
  if (!tipoDD) return false;
  const v = tipoDD.querySelector(".credit-form__value")?.textContent;
  return TIPO_SHOW_FECHA_FIN.includes(v);
}

function isOtrasFuentesRazonVisible(form) {
  const dd = form.querySelector("[data-dropdown='otras-fuentes']");
  if (!dd) return false;
  const valueEl = dd.querySelector(".credit-form__value");
  return valueEl?.getAttribute("data-value") === "Ninguna de las anteriores";
}

function isCreditFormValid(block) {
  const form = block.querySelector(".credit-form");
  if (!form) return false;
  const workVisible = isWorkDependantVisible(form);
  const cargoVisible = isCargoVisible(form);
  const fechaFinVisible = isFechaFinVisible(form);
  const creditosDependantVisible = form.querySelector("[data-dropdown='creditos-activos']") ? isCreditosActivosDependantVisible(form) : false;
  const vehiculoDependantVisible = form.querySelector("[data-dropdown='vehiculo-propio']") ? isVehiculoAvalDependantVisible(form) : false;
  const vehiculoAvalSiVisible = form.querySelector("[data-dropdown='vehiculo-aval']") ? isVehiculoAvalSiDependantVisible(form) : false;
  const otrasFuentesRazonVisible = form.querySelector("[data-dropdown='otras-fuentes']") ? isOtrasFuentesRazonVisible(form) : false;
  const inputs = form.querySelectorAll("input[type='text']");
  const allInputsFilled = Array.from(inputs).every((inp) => {
    const field = inp.closest(".credit-form__field");
    if (field?.classList.contains("credit-form__field--otras-fuentes-razon") && !otrasFuentesRazonVisible) return true;
    if (field?.classList.contains("credit-form__field--otras-fuentes-razon") && otrasFuentesRazonVisible) return inp.value.trim() !== "";
    if (field?.classList.contains("credit-form__field--work-dependant") && !workVisible) return true;
    if (field?.classList.contains("credit-form__field--cargo") && !cargoVisible) return true;
    if (field?.closest(".credit-form__field--fecha-fin") && !fechaFinVisible) return true;
    if (field?.classList.contains("credit-form__field--creditos-dependant") && !creditosDependantVisible) return true;
    if (field?.classList.contains("credit-form__field--vehiculo-dependant") && !vehiculoDependantVisible) return true;
    if (field?.classList.contains("credit-form__field--vehiculo-aval-si-dependant") && !vehiculoAvalSiVisible) return true;
    const val = inp.value.trim();
    if (inp.hasAttribute("data-iban-input")) return isIbanValid(inp.value);
    if (inp.hasAttribute("data-postal-input")) return validatePostal(inp.value);
    if (inp.hasAttribute("data-dni-input") || inp.name === "dni-nie") return isDniNieValid(inp.value);
    return val !== "";
  });
  const dropdowns = form.querySelectorAll(".credit-form__dropdown:not([data-dropdown^='date-']):not([data-dropdown='nacionalidad'])");
  const allDropdownsSelected = Array.from(dropdowns).every((dd) => {
    if (dd.closest(".credit-form__field--work-dependant") && !workVisible) return true;
    if (dd.closest(".credit-form__field--cargo") && !cargoVisible) return true;
    if (dd.closest(".credit-form__field--fecha-fin") && !fechaFinVisible) return true;
    if (dd.closest(".credit-form__field--creditos-dependant") && !creditosDependantVisible) return true;
    if (dd.closest(".credit-form__field--vehiculo-dependant") && !vehiculoDependantVisible) return true;
    if (dd.closest(".credit-form__field--vehiculo-aval-si-dependant") && !vehiculoAvalSiVisible) return true;
    return dd.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
  });
  const dateFields = form.querySelectorAll(".credit-form__field[data-required-date]");
  const isIncomeForm = form.classList.contains("credit-form--income");
  const allDateValid = isIncomeForm
    ? true
    : Array.from(dateFields).every((field) => {
        if (field.classList.contains("credit-form__field--work-dependant") && !workVisible) return true;
        if (field.classList.contains("credit-form__field--fecha-fin") && !fechaFinVisible) return true;
        const dayEl = field.querySelector(".credit-form__dropdown--day .credit-form__value");
        const monthEl = field.querySelector(".credit-form__dropdown--month .credit-form__value");
        const yearEl = field.querySelector(".credit-form__dropdown--year .credit-form__value");
        const day = dayEl?.getAttribute("data-empty") !== "true" ? dayEl?.textContent : "";
        const month = monthEl?.getAttribute("data-empty") !== "true" ? (monthEl?.getAttribute("data-value") || monthEl?.textContent) : "";
        const year = yearEl?.getAttribute("data-empty") !== "true" ? yearEl?.textContent : "";
        if (!day || !month || !year) return false;
        if (!isValidDay(day, month, year)) return false;
        if (field.querySelector("[data-dropdown='contrato-day']")) return isPastDate(day, month, year);
        if (field.querySelector("[data-dropdown='nomina-day']")) return isFutureDate(day, month, year);
        if (field.querySelector("[data-dropdown='fin-day']")) return isFutureDate(day, month, year);
        if (field.querySelector("[data-dropdown='date-day']")) {
          if (field.hasAttribute("data-date-future")) return isFutureDate(day, month, year);
          return validateAge(day, month, year);
        }
        return true;
      });
  const dateDropdowns = form.querySelectorAll(".credit-form__dropdown[data-dropdown^='date-']");
  const allDateFilled = Array.from(dateDropdowns).every(
    (dd) => dd.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true"
  );
  const contratoNominaFilled = Array.from(form.querySelectorAll(".credit-form__field[data-required-date]")).every((field) => {
    if (field.classList.contains("credit-form__field--work-dependant") && !workVisible) return true;
    if (field.classList.contains("credit-form__field--fecha-fin") && !fechaFinVisible) return true;
    const dayV = field.querySelector(".credit-form__dropdown--day .credit-form__value")?.getAttribute("data-empty");
    const monthV = field.querySelector(".credit-form__dropdown--month .credit-form__value")?.getAttribute("data-empty");
    const yearV = field.querySelector(".credit-form__dropdown--year .credit-form__value")?.getAttribute("data-empty");
    return dayV !== "true" && monthV !== "true" && yearV !== "true";
  });
  const ciudadanoDD = form.querySelector("[data-dropdown='ciudadano']");
  const nacionalidadField = form.querySelector(".credit-form__field--nacionalidad");
  const ciudadanoNo = ciudadanoDD?.querySelector(".credit-form__value")?.textContent === "No";
  const nacionalidadFilled = !ciudadanoNo || (nacionalidadField?.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true");
  return allInputsFilled && allDropdownsSelected && allDateValid && contratoNominaFilled && nacionalidadFilled && (dateDropdowns.length === 0 || allDateFilled);
}

function showCreditFormErrors(form) {
  if (!form) return;
  clearCreditFormErrors(form);

  const ciudadanoVal = form.querySelector("[data-dropdown='ciudadano'] .credit-form__value")?.textContent;
  const nacionalidadField = form.querySelector(".credit-form__field--nacionalidad");
  const nacionalidadVisible = ciudadanoVal === "No";

  const workVisible = form.querySelector("[data-dropdown='tipo-ingresos']") ? isWorkDependantVisible(form) : true;
  const cargoVisible = form.querySelector("[data-dropdown='tipo-ingresos']") ? isCargoVisible(form) : false;
  const fechaFinVisible = form.querySelector("[data-dropdown='tipo-ingresos']") ? isFechaFinVisible(form) : false;
  const creditosDependantVisible = form.querySelector("[data-dropdown='creditos-activos']") ? isCreditosActivosDependantVisible(form) : false;
  const vehiculoDependantVisible = form.querySelector("[data-dropdown='vehiculo-propio']") ? isVehiculoAvalDependantVisible(form) : false;
  const vehiculoAvalSiVisible = form.querySelector("[data-dropdown='vehiculo-aval']") ? isVehiculoAvalSiDependantVisible(form) : false;
  const otrasFuentesRazonVisible = form.querySelector("[data-dropdown='otras-fuentes']") ? isOtrasFuentesRazonVisible(form) : false;

  function addErrorToField(field) {
    if (!field) return;
    const wrap = field.querySelector(".credit-form__input-wrap");
    if (wrap) wrap.classList.add("credit-form__input-wrap--error");
    const err = field.querySelector(".credit-form__error");
    if (err) {
      err.style.display = "block";
      err.textContent = err.textContent || "Campo obligatorio";
    }
  }

  form.querySelectorAll(".credit-form__field").forEach((field) => {
    if (field.classList.contains("credit-form__field--work-dependant") && !workVisible) return;
    if (field.classList.contains("credit-form__field--cargo") && !cargoVisible) return;
    if (field.classList.contains("credit-form__field--creditos-dependant") && !creditosDependantVisible) return;
    if (field.classList.contains("credit-form__field--vehiculo-dependant") && !vehiculoDependantVisible) return;
    if (field.classList.contains("credit-form__field--vehiculo-aval-si-dependant") && !vehiculoAvalSiVisible) return;
    if (field.classList.contains("credit-form__field--otras-fuentes-razon") && !otrasFuentesRazonVisible) return;
    if (field.classList.contains("credit-form__field--otras-fuentes-razon") && otrasFuentesRazonVisible) {
      const inp = field.querySelector("input");
      if (inp && !inp.value.trim()) addErrorToField(field);
      return;
    }
    if (field.hasAttribute("data-required-date")) return;
    if (field.classList.contains("credit-form__field--nacionalidad")) {
      if (nacionalidadVisible) {
        const wrap = field.querySelector(".credit-form__input-wrap");
        const filled = field.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
        if (!filled) {
          wrap?.classList.add("credit-form__input-wrap--error");
          const err = field.querySelector(".credit-form__error");
          if (err) err.style.display = "block";
        }
      }
      return;
    }
    const wrap = field.querySelector(".credit-form__input-wrap[data-required]");
    if (!wrap) return;
    let filled = false;
    const input = field.querySelector("input");
    const valueEl = field.querySelector(".credit-form__value");
    if (input) {
      if (input.hasAttribute("data-iban-input")) {
        filled = isIbanValid(input.value);
      } else if (input.hasAttribute("data-postal-input")) {
        filled = validatePostal(input.value);
      } else if (input.hasAttribute("data-dni-input") || input.name === "dni-nie") {
        filled = isDniNieValid(input.value);
      } else {
        filled = input.value.trim() !== "";
      }
    } else if (valueEl) filled = valueEl.getAttribute("data-empty") !== "true";
    if (!filled) {
      wrap.classList.add("credit-form__input-wrap--error");
      const err = field.querySelector(".credit-form__error");
      if (err) {
        err.style.display = "block";
        if (input?.hasAttribute("data-postal-input")) err.textContent = "El código postal es incorrecto (5 dígitos)";
        else if (input?.hasAttribute("data-dni-input") || input?.name === "dni-nie") err.textContent = "8 dígitos + 1 letra, sin espacios ni guiones";
        else err.textContent = "Campo obligatorio";
      }
    }
  });

  form.querySelectorAll(".credit-form__field[data-required-date]").forEach((field) => {
    if (field.classList.contains("credit-form__field--work-dependant") && !workVisible) return;
    if (field.classList.contains("credit-form__field--fecha-fin") && !fechaFinVisible) return;
    const dayEl = field.querySelector(".credit-form__dropdown--day .credit-form__value");
    const monthEl = field.querySelector(".credit-form__dropdown--month .credit-form__value");
    const yearEl = field.querySelector(".credit-form__dropdown--year .credit-form__value");
    const dayVal = dayEl?.getAttribute("data-empty");
    const monthVal = monthEl?.getAttribute("data-empty");
    const yearVal = yearEl?.getAttribute("data-empty");
    const filled = dayVal !== "true" && monthVal !== "true" && yearVal !== "true";
    if (!filled) {
      field
        .querySelectorAll(".credit-form__input-wrap")
        .forEach((w) => w.classList.add("credit-form__input-wrap--error"));
      const err = field.querySelector(".credit-form__error");
      if (err) {
        err.style.display = "block";
        err.textContent = "Campo obligatorio";
      }
      return;
    }
    if (form.classList.contains("credit-form--income")) return;
    const day = dayEl?.textContent || "";
    const month = monthEl?.getAttribute("data-value") || monthEl?.textContent || "";
    const year = yearEl?.textContent || "";
    let valid = isValidDay(day, month, year);
    if (valid && field.querySelector("[data-dropdown='contrato-day']")) valid = isPastDate(day, month, year);
    if (valid && field.querySelector("[data-dropdown='nomina-day']")) valid = isFutureDate(day, month, year);
    if (valid && field.querySelector("[data-dropdown='fin-day']")) valid = isFutureDate(day, month, year);
    if (valid && field.querySelector("[data-dropdown='date-day']")) valid = validateAge(day, month, year);
    if (!valid) {
      field.querySelectorAll(".credit-form__input-wrap").forEach((w) => w.classList.add("credit-form__input-wrap--error"));
      const err = field.querySelector(".credit-form__error");
      if (err) {
        err.textContent = field.querySelector("[data-dropdown='date-day']") ? "Solo mayores de 18 años." : (field.querySelector("[data-dropdown='nomina-day']") || field.querySelector("[data-dropdown='fin-day']")) ? "La fecha no puede ser en pasado." : field.querySelector("[data-dropdown='contrato-day']") ? "La fecha no puede ser en futuro." : "No válido.";
        err.style.display = "block";
      }
    }
  });

  if (form.classList.contains("credit-form--income")) {
    const dropdowns = form.querySelectorAll(".credit-form__dropdown:not([data-dropdown^='date-']):not([data-dropdown='nacionalidad'])");
    dropdowns.forEach((dd) => {
      if (dd.closest(".credit-form__field--work-dependant") && !workVisible) return;
      if (dd.closest(".credit-form__field--cargo") && !cargoVisible) return;
      if (dd.closest(".credit-form__field--fecha-fin") && !fechaFinVisible) return;
      const empty = dd.querySelector(".credit-form__value")?.getAttribute("data-empty") === "true";
      if (empty) addErrorToField(dd.closest(".credit-form__field"));
    });
    form.querySelectorAll("input[type='text']").forEach((inp) => {
      const field = inp.closest(".credit-form__field");
      if (field?.classList.contains("credit-form__field--work-dependant") && !workVisible) return;
      if (field?.classList.contains("credit-form__field--cargo") && !cargoVisible) return;
      if (field?.closest(".credit-form__field--fecha-fin") && !fechaFinVisible) return;
      let ok = inp.value.trim() !== "";
      if (inp.hasAttribute("data-iban-input")) ok = isIbanValid(inp.value);
      if (inp.hasAttribute("data-postal-input")) ok = validatePostal(inp.value);
      if (inp.hasAttribute("data-dni-input") || inp.name === "dni-nie") ok = isDniNieValid(inp.value);
      if (!ok) addErrorToField(field);
    });
    form.querySelectorAll(".credit-form__field[data-required-date]").forEach((field) => {
      if (field.classList.contains("credit-form__field--work-dependant") && !workVisible) return;
      if (field.classList.contains("credit-form__field--fecha-fin") && !fechaFinVisible) return;
      const dayV = field.querySelector(".credit-form__dropdown--day .credit-form__value")?.getAttribute("data-empty");
      const monthV = field.querySelector(".credit-form__dropdown--month .credit-form__value")?.getAttribute("data-empty");
      const yearV = field.querySelector(".credit-form__dropdown--year .credit-form__value")?.getAttribute("data-empty");
      const allFilled = dayV !== "true" && monthV !== "true" && yearV !== "true";
      if (!allFilled) {
        field
          .querySelectorAll(".credit-form__input-wrap")
          .forEach((w) => w.classList.add("credit-form__input-wrap--error"));
        const err = field.querySelector(".credit-form__error");
        if (err) {
          err.style.display = "block";
          err.textContent = "Campo obligatorio";
        }
      }
    });
  }

  const firstError = form.querySelector(".credit-form__input-wrap--error");
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function clearCreditFormErrors(form) {
  if (!form) return;
  form.querySelectorAll(".credit-form__input-wrap--error").forEach((w) => w.classList.remove("credit-form__input-wrap--error"));
  form.querySelectorAll(".credit-form__error").forEach((e) => {
    e.style.display = "none";
    e.textContent = "Campo obligatorio";
  });
}

function clearFieldAndErrors(field) {
  const wrap = field.querySelector(".credit-form__input-wrap");
  wrap?.classList.remove("credit-form__input-wrap--error");
  const err = field.querySelector(".credit-form__error");
  if (err) err.style.display = "none";
  const inp = field.querySelector("input");
  if (inp) inp.value = "";
  field.querySelectorAll(".credit-form__value").forEach((valEl) => {
    const dd = valEl.closest("[data-dropdown]");
    const d = dd?.getAttribute("data-dropdown") || "";
    const ph = valEl.closest(".credit-form__dropdown--day") ? (d.includes("nomina") ? "Día" : "DD") : valEl.closest(".credit-form__dropdown--month") ? (d.includes("nomina") ? "Mes" : "MM") : valEl.closest(".credit-form__dropdown--year") ? (d.includes("nomina") ? "Año" : "AAAA") : "Seleccionar";
    valEl.textContent = ph;
    valEl.setAttribute("data-empty", "true");
  });
}

function isCreditosActivosDependantVisible(form) {
  const dd = form.querySelector("[data-dropdown='creditos-activos']");
  if (!dd) return false;
  const v = dd.querySelector(".credit-form__value")?.textContent;
  return v && v !== "Seleccionar" && v !== "Ninguno" && dd.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
}

function displayCreditosActivos(form) {
  if (!form) return;
  const dd = form.querySelector("[data-dropdown='creditos-activos']");
  if (!dd) return;
  const visible = isCreditosActivosDependantVisible(form);
  form.querySelectorAll(".credit-form__field--creditos-dependant").forEach((field) => {
    field.style.display = visible ? "" : "none";
    if (!visible) clearFieldAndErrors(field);
  });
}

function isVehiculoAvalDependantVisible(form) {
  const dd = form.querySelector("[data-dropdown='vehiculo-propio']");
  if (!dd) return false;
  const v = dd.querySelector(".credit-form__value")?.textContent;
  return v && v !== "Seleccionar" && v !== "No" && dd.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
}

function isVehiculoAvalSiDependantVisible(form) {
  const vehiculoAvalDD = form.querySelector("[data-dropdown='vehiculo-aval']");
  if (!vehiculoAvalDD) return false;
  const v = vehiculoAvalDD.querySelector(".credit-form__value")?.textContent;
  return v === "Sí" && vehiculoAvalDD.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
}

function displayVehiculoAval(form) {
  if (!form) return;
  const dd = form.querySelector("[data-dropdown='vehiculo-propio']");
  if (!dd) return;
  const visible = isVehiculoAvalDependantVisible(form);
  form.querySelectorAll(".credit-form__field--vehiculo-dependant").forEach((field) => {
    field.style.display = visible ? "" : "none";
    if (!visible) clearFieldAndErrors(field);
  });
  displayVehiculoAvalSi(form);
}

function displayVehiculoAvalSi(form) {
  if (!form) return;
  const visible = isVehiculoAvalDependantVisible(form) && isVehiculoAvalSiDependantVisible(form);
  form.querySelectorAll(".credit-form__field--vehiculo-aval-si-dependant").forEach((field) => {
    field.style.display = visible ? "" : "none";
    if (!visible) clearFieldAndErrors(field);
  });
}

function displayEmploymentType(form) {
  if (!form) return;
  const tipoDD = form.querySelector("[data-dropdown='tipo-ingresos']");
  if (!tipoDD) return;
  const v = tipoDD.querySelector(".credit-form__value")?.textContent;
  const hasSelection = v && v !== "Seleccionar" && tipoDD.querySelector(".credit-form__value")?.getAttribute("data-empty") !== "true";
  const workVisible = hasSelection && !TIPO_HIDE_WORK.includes(v);
  const cargoVisible = hasSelection && TIPO_SHOW_CARGO.includes(v);
  const fechaFinVisible = hasSelection && TIPO_SHOW_FECHA_FIN.includes(v);

  form.querySelectorAll(".credit-form__field--work-dependant").forEach((field) => {
    field.style.display = workVisible ? "" : "none";
    if (!workVisible) clearFieldAndErrors(field);
  });
  form.querySelectorAll(".credit-form__field--cargo").forEach((field) => {
    field.style.display = cargoVisible ? "" : "none";
    if (!cargoVisible) clearFieldAndErrors(field);
  });
  form.querySelectorAll(".credit-form__field--fecha-fin").forEach((field) => {
    field.style.display = fechaFinVisible ? "" : "none";
    if (!fechaFinVisible) clearFieldAndErrors(field);
  });
}

/** Дни: если текущий месяц — от сегодня до конца; иначе 1..последний день (для date и nomina) */
function getRestrictedFutureDays(monthNum, year) {
  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth() + 1;
  var today = now.getDate();
  var m = parseInt(monthNum, 10) || currentMonth;
  var y = parseInt(year, 10) || currentYear;
  var lastDay = new Date(y, m, 0).getDate();
  var startDay = (y === currentYear && m === currentMonth) ? today : 1;
  var out = [];
  for (var d = startDay; d <= lastDay; d++) {
    out.push(String(d).padStart(2, "0"));
  }
  return out;
}

/** 4 месяца начиная с текущего */
function getRestrictedFutureMonths() {
  var now = new Date();
  var start = now.getMonth();
  var names = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return Array.from({ length: 4 }, function (_, i) {
    var idx = (start + i) % 12;
    return { name: names[idx], value: String(idx + 1).padStart(2, "0") };
  });
}

/** prefix: "date" или "nomina" */
function populateRestrictedFutureDays(dayListEl, dateField, prefix) {
  if (!dayListEl || !dateField || !prefix) return;
  var monthVal = dateField.querySelector("[data-dropdown='" + prefix + "-month'] .credit-form__value")?.getAttribute("data-value");
  var yearVal = dateField.querySelector("[data-dropdown='" + prefix + "-year'] .credit-form__value")?.getAttribute("data-value") || String(new Date().getFullYear());
  var days = getRestrictedFutureDays(monthVal, yearVal);
  dayListEl.innerHTML = "";
  days.forEach(function (v) {
    var opt = document.createElement("div");
    opt.className = "credit-form__dropdown-option";
    opt.setAttribute("data-value", v);
    opt.textContent = v;
    dayListEl.appendChild(opt);
  });
}

function getNominaDays(m, y) { return getRestrictedFutureDays(m, y); }
function getNominaMonths() { return getRestrictedFutureMonths(); }
function populateNominaDays(el, f) { return populateRestrictedFutureDays(el, f, "nomina"); }

function initCreditForm() {
  const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  /* Списки даты теперь в .credit-form__field-row--lists по data-date-list */
  const dayLists = document.querySelectorAll(".credit-form__date-list-wrap[data-date-list$='-day'] .credit-form__dropdown-list");
  const monthLists = document.querySelectorAll(".credit-form__date-list-wrap[data-date-list$='-month'] .credit-form__dropdown-list");
  const yearLists = document.querySelectorAll(".credit-form__date-list-wrap[data-date-list$='-year'] .credit-form__dropdown-list");

  dayLists.forEach((dayList) => {
    const wrap = dayList.closest(".credit-form__date-list-wrap");
    const listId = wrap?.getAttribute("data-date-list") || "";
    if (listId === "nomina-day") {
      var dateField = wrap?.closest("[data-required-date]");
      populateRestrictedFutureDays(dayList, dateField, "nomina");
      return;
    }
    for (let i = 1; i <= 31; i++) {
      const v = String(i).padStart(2, "0");
      const opt = document.createElement("div");
      opt.className = "credit-form__dropdown-option";
      opt.setAttribute("data-value", v);
      opt.textContent = v;
      dayList.appendChild(opt);
    }
  });
  monthLists.forEach((monthList) => {
    const wrap = monthList.closest(".credit-form__date-list-wrap");
    const listId = wrap?.getAttribute("data-date-list") || "";
    var restrictedMonths = (listId === "nomina-month");
    const months = restrictedMonths
      ? getRestrictedFutureMonths().map(function (m) { return { v: m.value, t: m.name }; })
      : MONTHS_ES.map(function (m, i) { return { v: String(i + 1).padStart(2, "0"), t: m }; });
    months.forEach((item) => {
      const opt = document.createElement("div");
      opt.className = "credit-form__dropdown-option";
      opt.setAttribute("data-value", item.v);
      opt.textContent = item.t;
      monthList.appendChild(opt);
    });
  });
yearLists.forEach((yearList) => {
  const currentYear = new Date().getFullYear();
  const maxYear = 2026;     // максимум
  const minYear = 1940;     // минимум (как было логически раньше)

  const wrapId = yearList
    .closest(".credit-form__date-list-wrap")
    ?.getAttribute("data-date-list") || "";

  const isRestrictedYear = wrapId === "nomina-year";
  const isFinYear = wrapId === "fin-year";

  const years = isRestrictedYear
    ? [currentYear]
    : (isFinYear ? [currentYear, currentYear + 1] : Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => maxYear - i
      ));

  years.forEach((y) => {
    const opt = document.createElement("div");
    opt.className = "credit-form__dropdown-option";
    opt.setAttribute("data-value", String(y));
    opt.textContent = String(y);
    yearList.appendChild(opt);
  });
});

  const NACIONALIDAD_COUNTRIES = ["Afganistán","Albania","Alemania","Andorra","Angola","Anguilla","Antártida","Antigua y Barbuda","Antillas Holandesas","Arabia Saudí","Argelia","Argentina","Armenia","Aruba","Australia","Austria","Azerbaiyán","Bahamas","Bahrein","Bangladesh","Barbados","Bélgica","Belice","Benin","Bermudas","Bielorrusia","Birmania","Bolivia","Bosnia y Herzegovina","Botswana","Brasil","Brunei","Bulgaria","Burkina Faso","Burundi","Bután","Cabo Verde","Camboya","Camerún","Canadá","Chad","Chile","China","Chipre","Ciudad del Vaticano","Colombia","Comores","Congo","Congo, República Democrática del","Corea del Sur","Corea del Norte","Costa de Marfíl","Costa Rica","Croacia (Hrvatska)","Cuba","Dinamarca","Djibouti","Dominica","Ecuador","Egipto","El Salvador","Emiratos Árabes Unidos","Eritrea","Eslovenia","Estados Unidos","Estonia","Etiopía","Fiji","Filipinas","Finlandia","Francia","Gabón","Gambia","Georgia","Ghana","Gibraltar","Granada","Grecia","Groenlandia","Guadalupe","Guam","Guatemala","Guayana","Guayana Francesa","Guinea","Guinea Ecuatorial","Guinea-Bissau","Haití","Honduras","Hungría","India","Indonesia","Irak","Irán","Irlanda","Isla Bouvet","Isla de Christmas","Islandia","Islas Caimán","Islas Cook","Islas de Cocos o Keeling","Islas Faroe","Islas Heard y McDonald","Islas Malvinas","Islas Marianas del Norte","Islas Marshall","Islas menores de Estados Unidos","Islas Palau","Islas Salomón","Islas Svalbard y Jan Mayen","Islas Tokelau","Islas Turks y Caicos","Islas Vírgenes (EEUU)","Islas Vírgenes (Reino Unido)","Islas Wallis y Futuna","Israel","Italia","Jamaica","Japón","Jordania","Kazajistán","Kenia","Kirguizistán","Kiribati","Kuwait","Laos","Lesotho","Letonia","Líbano","Liberia","Libia","Liechtenstein","Lituania","Luxemburgo","Macedonia","Madagascar","Malasia","Malawi","Maldivas","Malí","Malta","Marruecos","Martinica","Mauricio","Mauritania","Mayotte","México","Micronesia","Moldavia","Mónaco","Mongolia","Montserrat","Mozambique","Namibia","Nauru","Nepal","Nicaragua","Níger","Nigeria","Niue","Norfolk","Noruega","Nueva Caledonia","Nueva Zelanda","Omán","Países Bajos","Panamá","Papúa Nueva Guinea","Paquistán","Paraguay","Perú","Pitcairn","Polinesia Francesa","Polonia","Portugal","Puerto Rico","Qatar","Reino Unido","República Centroafricana","República Checa","República de Sudáfrica","República Dominicana","República Eslovaca","Reunión","Ruanda","Rumania","Rusia","Sahara Occidental","Saint Kitts y Nevis","Samoa","Samoa Americana","San Marino","San Vicente y Granadinas","Santa Helena","Santa Lucía","Santo Tomé y Príncipe","Senegal","Seychelles","Sierra Leona","Singapur","Siria","Somalia","Sri Lanka","St Pierre y Miquelon","Suazilandia","Sudán","Suecia","Suiza","Surinam","Tailandia","Taiwán","Tanzania","Tayikistán","Territorios franceses del Sur","Timor Oriental","Togo","Tonga","Trinidad y Tobago","Túnez","Turkmenistán","Turquía","Tuvalu","Ucrania","Uganda","Uruguay","Uzbekistán","Vanuatu","Venezuela","Vietnam","Yemen","Yugoslavia","Zambia","Zimbabue"];
  const nacionalidadList = document.querySelector("[data-dropdown='nacionalidad'] .credit-form__dropdown-list");
  if (nacionalidadList) {
    NACIONALIDAD_COUNTRIES.forEach((c) => {
      const opt = document.createElement("div");
      opt.className = "credit-form__dropdown-option";
      opt.setAttribute("data-value", c);
      opt.textContent = c;
      nacionalidadList.appendChild(opt);
    });
  }

  document.querySelectorAll(".credit-form--income").forEach((form) => {
    displayEmploymentType(form);
    const dd = form.querySelector("[data-dropdown='otras-fuentes']");
    const razonField = form.querySelector(".credit-form__field--otras-fuentes-razon");
    if (dd && razonField && dd.querySelector(".credit-form__value")?.getAttribute("data-value") === "Ninguna de las anteriores") {
      razonField.style.display = "";
    }
  });
  if (typeof window !== "undefined") {
    window.displayEmploymentType = displayEmploymentType;
    window.displayCreditosActivos = displayCreditosActivos;
    window.displayVehiculoAval = displayVehiculoAval;
    window.displayVehiculoAvalSi = displayVehiculoAvalSi;
    window.checkNextBtn = checkNextBtn;
    Object.defineProperty(window, "currentAmount", {
      get: function () { return currentAmount; },
      set: function (v) { currentAmount = v; }
    });
  }
  document.querySelectorAll(".credit-form--block5").forEach((form) => {
    displayCreditosActivos(form);
    displayVehiculoAval(form);
  });

  document.querySelectorAll(".credit-form__dropdown").forEach((dd) => {
    const wrap = dd.querySelector(".credit-form__input-wrap");
    const valueEl = dd.querySelector(".credit-form__value");
    const dateField = dd.closest("[data-required-date]");
    const listWrap = dateField ? dateField.querySelector(".credit-form__date-list-wrap[data-date-list='" + dd.getAttribute("data-dropdown") + "']") : null;
    const options = listWrap ? listWrap.querySelectorAll(".credit-form__dropdown-option") : dd.querySelectorAll(".credit-form__dropdown-option");
    const list = dd.querySelector(".credit-form__dropdown-list");

    wrap?.addEventListener("click", (e) => {
      e.stopPropagation();
      const err = dd.querySelector(".credit-form__error");
      wrap.classList.remove("credit-form__input-wrap--error");
      if (err) err.style.display = "none";
      const wasOpen = dd.classList.contains("is-open");
      const dateField = dd.closest("[data-required-date]");
      document.querySelectorAll(".credit-form__dropdown.is-open").forEach((o) => o.classList.remove("is-open"));
      document.querySelectorAll(".credit-form__date-list-wrap.is-open").forEach((w) => w.classList.remove("is-open"));
      if (!wasOpen) {
        var dayDropdown = dd.getAttribute("data-dropdown");
        if (dayDropdown === "nomina-day" && dateField) {
          var dayListEl = dateField.querySelector(".credit-form__date-list-wrap[data-date-list='nomina-day'] .credit-form__dropdown-list");
          if (dayListEl) populateRestrictedFutureDays(dayListEl, dateField, "nomina");
        }
        dd.classList.add("is-open");
        if (dateField) {
          const wrapToOpen = dateField.querySelector(".credit-form__date-list-wrap[data-date-list='" + dd.getAttribute("data-dropdown") + "']");
          if (wrapToOpen) wrapToOpen.classList.add("is-open");
        }
        const currentVal = valueEl.textContent;
        const listEl = dateField ? dateField.querySelector(".credit-form__date-list-wrap[data-date-list='" + dd.getAttribute("data-dropdown") + "'] .credit-form__dropdown-list") : dd.querySelector(".credit-form__dropdown-list");
        const opts = listEl ? listEl.querySelectorAll(".credit-form__dropdown-option") : options;
        opts.forEach((o) => o.classList.toggle("is-selected", o.getAttribute("data-value") === currentVal || o.textContent === currentVal));
        requestAnimationFrame(() => {
          if (listEl) listEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
    });

    if (dd.getAttribute("data-dropdown") === "date-day" || dd.getAttribute("data-dropdown") === "nomina-day") {
      var dayListWrap = listWrap;
      if (dayListWrap) {
        dayListWrap.addEventListener("click", function (ev) {
          var opt = ev.target.closest(".credit-form__dropdown-option");
          if (!opt) return;
          ev.stopPropagation();
          var v = opt.getAttribute("data-value");
          valueEl.textContent = opt.textContent || v;
          valueEl.setAttribute("data-value", v || "");
          valueEl.setAttribute("data-empty", "false");
          dd.classList.remove("is-open");
          listWrap?.classList.remove("is-open");
          var df = dd.closest("[data-required-date]");
          if (df) {
            df.querySelectorAll(".credit-form__input-wrap").forEach(function (w) { w.classList.remove("credit-form__input-wrap--error"); });
            var errEl = df.querySelector(".credit-form__error");
            if (errEl) { errEl.style.display = "none"; errEl.textContent = "Campo obligatorio"; }
          }
          checkNextBtn();
          persistCurrentStepAnswers(currentIndex);
        });
      }
    }
    options.forEach((opt) => {
      if (dd.getAttribute("data-dropdown") === "date-day" || dd.getAttribute("data-dropdown") === "nomina-day") return;
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = opt.getAttribute("data-value");
        valueEl.textContent = opt.textContent || v;
        valueEl.setAttribute("data-value", v || "");
        valueEl.setAttribute("data-empty", "false");
        options.forEach((o) => o.classList.remove("is-selected"));
        opt.classList.add("is-selected");
        dd.classList.remove("is-open");
        listWrap?.classList.remove("is-open");
        const wrap = dd.querySelector(".credit-form__input-wrap");
        wrap?.classList.remove("credit-form__input-wrap--error");
        const dateField = dd.closest("[data-required-date]");
        if (dateField) {
          // Сначала убираем прежнюю ошибку для любого поля с датой
          dateField.querySelectorAll(".credit-form__input-wrap").forEach((w) =>
            w.classList.remove("credit-form__input-wrap--error")
          );
          const err = dateField.querySelector(".credit-form__error");
          if (err) {
            err.style.display = "none";
            err.textContent = "Campo obligatorio";
          }

          // ЖИВАЯ валидация возраста (date-day без data-date-future): если младше 18 лет — ошибка.
          const isEdadField = !!dateField.querySelector("[data-dropdown='date-day']") && !dateField.hasAttribute("data-date-future");
          if (isEdadField) {
            const dayValEl = dateField.querySelector(".credit-form__dropdown--day .credit-form__value");
            const monthValEl = dateField.querySelector(".credit-form__dropdown--month .credit-form__value");
            const yearValEl = dateField.querySelector(".credit-form__dropdown--year .credit-form__value");

            const dayFilled = dayValEl?.getAttribute("data-empty") !== "true";
            const monthFilled = monthValEl?.getAttribute("data-empty") !== "true";
            const yearFilled = yearValEl?.getAttribute("data-empty") !== "true";
            const allFilled = dayFilled && monthFilled && yearFilled;

            if (allFilled) {
              const day = dayValEl?.textContent || "";
              const month = monthValEl?.getAttribute("data-value") || monthValEl?.textContent || "";
              const year = yearValEl?.textContent || "";

              let valid = isValidDay(day, month, year);
              if (valid) {
                // для возраста дополнительно проверяем 18+
                valid = validateAge(day, month, year);
              }

              if (!valid) {
                // Подсвечиваем только год, как при сабмите
                const yearWrap = dateField.querySelector(".credit-form__dropdown--year .credit-form__input-wrap");
                if (yearWrap) yearWrap.classList.add("credit-form__input-wrap--error");
                if (err) {
                  err.textContent = "Solo mayores de 18 años.";
                  err.style.display = "block";
                }
              }
            }
          }
        } else {
          const err = dd.querySelector(".credit-form__error");
          if (err) err.style.display = "none";
        }
        if (dd.getAttribute("data-dropdown") === "otras-fuentes") {
          const razonField = dd.closest(".credit-form")?.querySelector(".credit-form__field--otras-fuentes-razon");
          if (razonField) {
            if (v === "Ninguna de las anteriores") {
              razonField.style.display = "";
            } else {
              razonField.style.display = "none";
              const razonInp = razonField.querySelector("input[name='razon-otras-fuentes']");
              if (razonInp) razonInp.value = "";
              razonField.querySelector(".credit-form__input-wrap")?.classList.remove("credit-form__input-wrap--error");
              const errR = razonField.querySelector(".credit-form__error");
              if (errR) errR.style.display = "none";
            }
          }
        }
        if (dd.getAttribute("data-dropdown") === "ciudadano") {
          const nacionalidadField = dd.closest(".credit-form")?.querySelector(".credit-form__field--nacionalidad");
          if (nacionalidadField) {
            if (v === "No") {
              nacionalidadField.style.display = "";
            } else {
              nacionalidadField.style.display = "none";
              const natVal = nacionalidadField.querySelector(".credit-form__value");
              if (natVal) {
                natVal.textContent = "Seleccionar";
                natVal.setAttribute("data-empty", "true");
              }
              nacionalidadField.querySelector(".credit-form__input-wrap")?.classList.remove("credit-form__input-wrap--error");
              nacionalidadField.querySelector(".credit-form__error").style.display = "none";
            }
          }
        }
        if (dd.getAttribute("data-dropdown") === "tipo-ingresos") {
          displayEmploymentType(dd.closest(".credit-form"));
        }
        if (dd.getAttribute("data-dropdown") === "creditos-activos") {
          displayCreditosActivos(dd.closest(".credit-form"));
        }
        if (dd.getAttribute("data-dropdown") === "vehiculo-propio") {
          displayVehiculoAval(dd.closest(".credit-form"));
        }
        if (dd.getAttribute("data-dropdown") === "vehiculo-aval") {
          displayVehiculoAvalSi(dd.closest(".credit-form"));
        }
        var ddName = dd.getAttribute("data-dropdown");
        if (ddName === "nomina-month" || ddName === "nomina-year") {
          var df = dd.closest("[data-required-date]");
          if (df) {
            var dayList = df.querySelector(".credit-form__date-list-wrap[data-date-list='nomina-day'] .credit-form__dropdown-list");
            if (dayList) {
              populateRestrictedFutureDays(dayList, df, "nomina");
              var dayValEl = df.querySelector("[data-dropdown='nomina-day'] .credit-form__value");
              var dayVal = dayValEl?.getAttribute("data-value");
              var monthVal = df.querySelector("[data-dropdown='nomina-month'] .credit-form__value")?.getAttribute("data-value");
              var yearVal = df.querySelector("[data-dropdown='nomina-year'] .credit-form__value")?.getAttribute("data-value");
              var days = getRestrictedFutureDays(monthVal, yearVal);
              if (dayVal && days.indexOf(dayVal) === -1) {
                if (dayValEl) {
                  dayValEl.textContent = "Día";
                  dayValEl.setAttribute("data-value", "");
                  dayValEl.setAttribute("data-empty", "true");
                }
              }
            }
          }
        }
        checkNextBtn();
        persistCurrentStepAnswers(currentIndex);
      });
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".credit-form__dropdown.is-open").forEach((dd) => dd.classList.remove("is-open"));
    document.querySelectorAll(".credit-form__date-list-wrap.is-open").forEach((w) => w.classList.remove("is-open"));
  });

  document.querySelectorAll(".credit-form input:not([data-iban-input])").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      if (window.FlowEvents && inp.name) FlowEvents.stepAnswerUpdated(inp.name, "[updated]");
      if (inp.hasAttribute("data-postal-input")) {
        inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 5);
      } else if (inp.hasAttribute("data-dni-input")) {
        inp.value = inp.value.replace(/[\s\-]/g, "").replace(/[^A-Za-z0-9]/g, "").slice(0, 9).toUpperCase();
      } else if (inp.getAttribute("inputmode") === "numeric") {
        // Любое поле с inputmode=\"numeric\" — пропускаем только цифры
        inp.value = inp.value.replace(/[^0-9]/g, "");
      }
      const field = inp.closest(".credit-form__field");
      if (field?.hasAttribute("data-required-date")) {
        const day = field.querySelector("[name='day']")?.value?.trim();
        const month = field.querySelector("[name='month']")?.value?.trim();
        const year = field.querySelector("[name='year']")?.value?.trim();
        const filled = day && month && year;
        field.querySelectorAll(".credit-form__input-wrap").forEach((w) => w.classList.toggle("credit-form__input-wrap--error", !filled));
        const err = field.querySelector(".credit-form__error");
        if (err) err.style.display = filled ? "none" : "block";
      } else {
        const wrap = field?.querySelector(".credit-form__input-wrap");
        const filled = inp.hasAttribute("data-postal-input") ? validatePostal(inp.value)
          : inp.hasAttribute("data-dni-input") ? isDniNieValid(inp.value)
          : inp.value.trim() !== "";
        wrap?.classList.toggle("credit-form__input-wrap--error", !filled);
        const err = field?.querySelector(".credit-form__error");
        if (err) {
          err.style.display = filled ? "none" : "block";
          if (!filled && inp.hasAttribute("data-postal-input")) err.textContent = "El código postal es incorrecto (5 dígitos)";
          if (!filled && inp.hasAttribute("data-dni-input")) err.textContent = "8 dígitos + 1 letra, sin espacios ni guiones";
        }
      }
      checkNextBtn();
      persistCurrentStepAnswers(currentIndex);
    });
  });

  // IBAN: ES + 22 dígitos (24 caracteres). Pos 0-1: letras, pos 2+: solo dígitos
  function formatIban(raw) {
    raw = raw.replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    let result = "";
    for (let i = 0; i < raw.length && i < 24; i++) {
      if (i < 2) {
        if (/[A-Z]/.test(raw[i])) result += raw[i];
      } else {
        if (/[0-9]/.test(raw[i])) result += raw[i];
      }
    }
    return result.replace(/(.{4})/g, "$1 ").trim();
  }

  document.querySelectorAll("input[data-iban-input]").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      e.target.value = formatIban(e.target.value);
      const field = inp.closest(".credit-form__field");
      const wrap = field?.querySelector(".credit-form__input-wrap");
      const valid = isIbanValid(inp.value);
      wrap?.classList.toggle("credit-form__input-wrap--error", !valid);
      const err = field?.querySelector(".credit-form__error");
      if (err) err.style.display = valid ? "none" : "block";
      checkNextBtn();
      persistCurrentStepAnswers(currentIndex);
    });
    inp.addEventListener("keypress", (e) => {
      if (e.key.length === 1 && !/^[A-Za-z0-9]$/.test(e.key)) e.preventDefault();
    });
    inp.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData?.getData("text") || "").replace(/\s/g, "").replace(/[^A-Za-z0-9]/gi, "").toUpperCase().slice(0, 24);
      const raw = inp.value.replace(/\s/g, "").replace(/[^A-Z0-9]/g, "") + pasted;
      inp.value = formatIban(raw.slice(0, 24));
      const field = inp.closest(".credit-form__field");
      const wrap = field?.querySelector(".credit-form__input-wrap");
      const valid = isIbanValid(inp.value);
      wrap?.classList.toggle("credit-form__input-wrap--error", !valid);
      field?.querySelector(".credit-form__error") && (field.querySelector(".credit-form__error").style.display = valid ? "none" : "block");
      checkNextBtn();
      persistCurrentStepAnswers(currentIndex);
    });
  });

  document.querySelectorAll(".credit-form__dropdown").forEach((dd) => {
    const valueEl = dd.querySelector(".credit-form__value");
    const wrap = dd.querySelector(".credit-form__input-wrap");
    const err = dd.querySelector(".credit-form__error");
    dd.querySelectorAll(".credit-form__dropdown-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        wrap?.classList.remove("credit-form__input-wrap--error");
        if (err) err.style.display = "none";
      });
    });
  });
}

function closeAllCreditDropdowns() {
  document.querySelectorAll(".credit-form__dropdown.is-open").forEach((o) => o.classList.remove("is-open"));
  document.querySelectorAll(".credit-form__date-list-wrap.is-open").forEach((w) => w.classList.remove("is-open"));
}

initCreditForm();

// -------------------------------------------------------------
//            PURPOSE (2 и 6 блок)
// -------------------------------------------------------------
document.querySelectorAll(".purpose__choose").forEach((block) => {
  const img = block.querySelector(".purpose__img");

  block.addEventListener("click", () => {
    block.classList.toggle("active");
    if (img) {
      img.src = block.classList.contains("active")
        ? "./assets/Choose.svg"
        : "./assets/notChoose.svg";
    }
    checkNextBtn();
  });
});

// -------------------------------------------------------------
//             AMOUNT (3 блок)
// -------------------------------------------------------------
const amountSum = document.querySelector(".amount-sum");

function updateAmount() {
  if (amountSum) amountSum.textContent = currentAmount.toLocaleString();
  checkNextBtn();
}

document.querySelector(".amount__block-minus")?.addEventListener("click", () => {
  currentAmount += 250;
  updateAmount();
});

document.querySelector(".amount__block-plus")?.addEventListener("click", () => {
  if (currentAmount > 0) currentAmount -= 250;
  updateAmount();
});

updateAmount();

// -------------------------------------------------------------
//             OUTSTANDING (4 блок)
// -------------------------------------------------------------
let currentOutstanding = 1000;
const outstandingSum = document.querySelector(".outstanding-sum");
const outstandingDopSum = document.querySelector(".outstanding__debt-sum");

function updateOutstanding() {
  if (outstandingSum) outstandingSum.textContent = currentOutstanding.toLocaleString();
  if (outstandingDopSum) outstandingDopSum.textContent = currentOutstanding.toLocaleString();
  checkNextBtn();
}

document.querySelector(".outstanding__block-minus")?.addEventListener("click", () => {
  currentOutstanding += 250;
  updateOutstanding();
});

document.querySelector(".outstanding__block-plus")?.addEventListener("click", () => {
  if (currentOutstanding > 0) currentOutstanding -= 250;
  updateOutstanding();
});

updateOutstanding();

// -------------------------------------------------------------
//               CATEGORY (5 блок)
// -------------------------------------------------------------
document.querySelectorAll(".category").forEach((cat) => {
  const img = cat.querySelector(".category__img");
  const text = cat.querySelector(".category__text");

  const original = img?.src || "";
  const white = original.replace("/icons/", "/icons/white/");

  cat.addEventListener("click", () => {
    const active = cat.classList.toggle("active");
    if (img) img.src = active ? white : original;
    if (text) text.style.color = active ? "#fff" : "";
    cat.style.backgroundColor = active ? "#1EC756" : "";

    checkNextBtn();
  });
});

// -------------------------------------------------------------
//               MONTHLY (7 блок)
// -------------------------------------------------------------
let currentMonth = 12;
const monthlySum = document.querySelector(".monthly-sum");
const monthlyDopSum = document.querySelector(".monthly__dopsum");

function updateMonthly() {
  if (monthlySum) monthlySum.textContent = currentMonth;
  if (monthlyDopSum) monthlyDopSum.textContent = currentMonth;
  checkNextBtn();
}

document.querySelector(".monthly__block-minus")?.addEventListener("click", () => {
  let step = currentMonth < 12 ? 1 : 3;
  if (currentMonth + step <= 60) currentMonth += step;
  updateMonthly();
});

document.querySelector(".monthly__block-plus")?.addEventListener("click", () => {
  let step = currentMonth <= 12 ? 1 : 3;
  if (currentMonth - step >= 1) currentMonth -= step;
  updateMonthly();
});

updateMonthly();

// -------------------------------------------------------------
//               AMOUNT FORM (1-й блок: доход + срок + mensualidad)
// -------------------------------------------------------------
let amountFormIncome = 500;
let amountFormMonthsVal = 3;
const INCOME_STEP = 500;
const INCOME_MIN = 500;
const INCOME_MAX = 5000;
const MONTHS_MIN = 12;
const MONTHS_MAX = 90;

function formatAmountFormIncome(n) {
  return n.toLocaleString();
}

function updateAmountForm() {
  if (amountFormIncomeNum) amountFormIncomeNum.textContent = formatAmountFormIncome(amountFormIncome);
  if (amountFormMonths) amountFormMonths.textContent = amountFormMonthsVal;
  // Mensualidad ≈ доход / месяцы (упрощённая формула)
  const mensualidad = Math.round(amountFormIncome / amountFormMonthsVal);
  if (amountFormMensualidad) amountFormMensualidad.textContent = mensualidad;
  checkNextBtn();
  persistCurrentStepAnswers(currentIndex);
}

if (amountForm) {
  amountForm.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-amount-form]");
    if (!btn) return;
    const action = btn.getAttribute("data-amount-form");
    if (action === "income-plus") {
      if (amountFormIncome < INCOME_MAX) {
        amountFormIncome += INCOME_STEP;
        updateAmountForm();
      }
    } else if (action === "income-minus") {
      if (amountFormIncome > INCOME_MIN) {
        amountFormIncome -= INCOME_STEP;
        updateAmountForm();
      }
    } else if (action === "months-plus") {
      const step = amountFormMonthsVal <= 11 ? 1 : 6;
      if (amountFormMonthsVal + step <= MONTHS_MAX) {
        amountFormMonthsVal += step;
        updateAmountForm();
      }
    } else if (action === "months-minus") {
      const step = amountFormMonthsVal <= 11 ? 1 : 6;
      if (amountFormMonthsVal - step >= MONTHS_MIN) {
        amountFormMonthsVal -= step;
        updateAmountForm();
      }
    }
  });
  updateAmountForm();
}

// -------------------------------------------------------------
//               INPUT LISTENERS (email + phone)
// -------------------------------------------------------------

const PHONE_PREFIX = "+34 ";

// Email listener
emailInput?.addEventListener("input", checkNextBtn);

// При фокусе вставляем +34
phoneInput?.addEventListener("focus", function () {
  if (!this.value.startsWith(PHONE_PREFIX)) {
    this.value = PHONE_PREFIX;
  }

  setTimeout(() => {
    this.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length);
  }, 0);
});

// Блокируем удаление префикса
phoneInput?.addEventListener("keydown", function (e) {
  const cursorPos = this.selectionStart;

  if (
    (e.key === "Backspace" && cursorPos <= PHONE_PREFIX.length) ||
    (e.key === "Delete" && cursorPos < PHONE_PREFIX.length) ||
    (e.key === "ArrowLeft" && cursorPos <= PHONE_PREFIX.length)
  ) {
    e.preventDefault();
  }

  const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
    e.preventDefault();
  }
});

// Контроль ввода цифр
phoneInput?.addEventListener("input", function () {
  if (!this.value.startsWith(PHONE_PREFIX)) {
    this.value = PHONE_PREFIX;
  }

  let numbers = this.value
    .replace(PHONE_PREFIX, "")
    .replace(/\D/g, "")
    .slice(0, 9); // Испанский номер — 9 цифр

  this.value = PHONE_PREFIX + numbers;

  this.setSelectionRange(this.value.length, this.value.length);

  checkNextBtn();
});

if (privacyLink) privacyLink.style.display = "block";
