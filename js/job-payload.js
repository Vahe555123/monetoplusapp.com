/**
 * Build job payload from comprehensive form data for main bot API
 */
(function (root) {
  "use strict";

  var MONTHS_TO_NUM = {
    Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
    Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
  };
  var NUM_TO_MONTHS = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
    7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
  };

  function parseDatePart(day, month, year) {
    if (!day || !month || !year) return null;
    var m = typeof month === "string" ? MONTHS_TO_NUM[month] || parseInt(month, 10) : month;
    return { day: parseInt(day, 10), month: month, year: parseInt(year, 10) };
  }

  function normalizeLookupKey(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getByKey(obj, keys) {
    if (!obj || typeof obj !== "object") return null;
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v !== undefined && v !== null && v !== "") return v;
    }

    var normalizedMap = null;
    for (var j = 0; j < keys.length; j++) {
      var normalizedKey = normalizeLookupKey(keys[j]);
      if (!normalizedKey) continue;
      if (!normalizedMap) {
        normalizedMap = {};
        for (var sourceKey in obj) {
          var mappedKey = normalizeLookupKey(sourceKey);
          if (mappedKey && normalizedMap[mappedKey] === undefined) {
            normalizedMap[mappedKey] = obj[sourceKey];
          }
        }
      }
      var normalizedValue = normalizedMap[normalizedKey];
      if (normalizedValue !== undefined && normalizedValue !== null && normalizedValue !== "") return normalizedValue;
    }

    return null;
  }

  function buildDateStrFromParts(obj, prefix) {
    if (!prefix) return null;
    var day = getByKey(obj, [prefix + "-day"]);
    var month = getByKey(obj, [prefix + "-month"]);
    var year = getByKey(obj, [prefix + "-year"]);
    if (!day || !month || !year) return null;

    var dayStr = String(day).padStart(2, "0");
    var monthStr = String(month).trim();
    if (/^\d+$/.test(monthStr)) {
      monthStr = NUM_TO_MONTHS[parseInt(monthStr, 10)] || monthStr;
    }
    return dayStr + " " + monthStr + " " + String(year).trim();
  }

  function normalizeOfferVal(s) {
    if (!s || typeof s !== "string") return s;
    return s.trim().replace(/\s+/g, " ");
  }

  var STREET_TYPES_API = ["Calle", "Avenida", "Plaza", "Paseo", "Callejón", "Otro"];
  function normalizeStreetType(s) {
    if (!s || typeof s !== "string") return "Otro";
    var t = s.replace(/\s+/g, " ").trim();
    if (STREET_TYPES_API.indexOf(t) >= 0) return t;
    if (t === "Pasaje") return "Paseo";
    return "Otro";
  }

  var HOUSING_TYPES_API = ["Propiedad", "Alquiler", "Alquiler (Comparto piso)", "Vivienda familiar", "Otro"];
  function normalizeHousingType(s) {
    if (!s || typeof s !== "string") return "Otro";
    var t = s.replace(/\s+/g, " ").trim();
    if (HOUSING_TYPES_API.indexOf(t) >= 0) return t;
    if (t === "Alquiler (Vives solo)") return "Alquiler";
    if (t === "Propietario con hipoteca" || t === "Propietario sin hipoteca") return "Propiedad";
    if (t === "Vivo con mis padres") return "Vivienda familiar";
    return "Otro";
  }

  var MAX_DATE_YEAR = 2026;
  function clampDateYear(d) {
    if (!d || typeof d.year !== "number") return d;
    if (d.year > MAX_DATE_YEAR) d.year = MAX_DATE_YEAR;
    return d;
  }

  /** 100 названий компаний для подстановки при Desempleado (под копотом → Trabajo Fijo) */
  var FAKE_COMPANIES = [
    "Inversiones Mediterráneas S.L.", "Tech Solutions España", "Grupo Logístico Ibérico", "Consultores Financieros del Sur",
    "Construcciones García y Asociados", "Alimentación Fresca S.A.", "Servicios Integrales Valencia", "Distribuciones Costa Brava",
    "Innovación Digital Madrid", "Transportes Rápidos del Norte", "Hoteles y Turismo Andaluz", "Energías Renovables Iberia",
    "Textiles Moda Barcelona", "Automoción Española S.L.", "Farmacias del Pueblo", "Supermercados La Económica",
    "Gestión Inmobiliaria Sur", "Seguros y Pensiones Plus", "Educación Online España", "Restauración Gourmet S.L.",
    "Limpieza Profesional Madrid", "Mantenimiento Industrial Valencia", "Recursos Humanos Global", "Marketing Digital Sur",
    "Imprenta y Papelería García", "Joyería y Relojería Elegante", "Electrónica y Gadgets", "Deportes y Ocio Activo",
    "Floristería Jardines del Sur", "Panadería y Pastelería Artesanal", "Carnicería y Charcutería Fresca", "Pescadería Mar del Sur",
    "Ferretería y Bricolaje", "Opticentros Visión Clara", "Clínica Dental Sonrisa", "Centro Óptico España",
    "Academia de Idiomas Europa", "Gimnasio Vital Fitness", "Spa y Bienestar Relax", "Peluquería Estilo Moderno",
    "Taller Mecánico Rápido", "Lavandería Express", "Fotografía y Vídeo Pro", "Diseño Gráfico Creativo",
    "Abogados y Asesores Legales", "Contabilidad y Auditoría Pro", "Asesoría Fiscal Integral", "Gestoría Administrativa",
    "Agencia de Viajes Mundos", "Alquiler de Vehículos AutoRent", "Mudanzas y Transporte", "Guardería Pequeños Pasos",
    "Residencia de Mayores Vida", "Centro de Día Atención", "Clínica Veterinaria Mascotas", "Tienda de Mascotas Amigo",
    "Librería Cultural", "Tienda de Música y Sonido", "Deportes Náuticos Costa", "Camping y Naturaleza",
    "Restaurante Casa Pepe", "Bar y Cafetería Central", "Pizzería Italiana", "Comida China Express",
    "Tienda de Regalos Original", "Artículos de Boda", "Decoración del Hogar", "Muebles y Colchones",
    "Alfombras y Cortinas", "Pinturas y Barnices", "Jardinería y Plantas", "Viveros del Valle",
    "Informática y Reparación PC", "Telefonía Móvil y Fija", "Ciberseguridad Pro", "Cloud Solutions España",
    "Publicidad y Medios", "Editorial Libros del Sur", "Radio y Televisión Local", "Prensa Diaria Regional",
    "Asociación de Comerciantes", "Cooperativa Agrícola", "Cámara de Comercio", "Fundación Social",
    "Centro de Formación Profesional", "Universidad Privada Sur", "Escuela de Negocios", "Instituto de Idiomas",
    "Clínica de Fisioterapia", "Centro de Podología", "Laboratorio de Análisis", "Óptica y Audífonos",
    "Ferretería Industrial", "Suministros de Oficina", "Equipamiento Hostelero", "Material Sanitario",
    "Distribuidora de Bebidas", "Importación y Exportación", "Almacén Logístico", "Centro de Distribución",
    "Call Center Atención Cliente", "Telemarketing España", "Externalización Servicios", "Subcontratación Industrial",
    "Comercial del Mediterráneo", "Representaciones Comerciales Sur", "Importadora Textil Asia", "Exportadora Aceite Oliva",
    "Estación de Servicio Total", "Concesionario Automóviles Sur", "Taller Neumáticos Rueda", "Autocaravanas y Caravanas",
    "Inmobiliaria Vista al Mar", "Gestión de Alquileres", "Reformas y Rehabilitación", "Fontanería y Electricidad 24h",
    "Cerrajería Urgente", "Control de Plagas", "Limpieza de Cristales", "Jardinería y Paisajismo"
  ];

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Случайная добавка 400–600: 400, 450, 500, 550, 600 */
  function randomBudgetExtra() {
    var options = [400, 450, 500, 550, 600];
    return options[Math.floor(Math.random() * options.length)];
  }

  /** Округляет до ближайших 50 (4000, 4050, 4100...) */
  function roundTo50(n) {
    return Math.round((n || 0) / 50) * 50;
  }

  /** Если бюджет < 500: бюджет = Monthly Amount + 400–600. ЗП = расходы + бюджет, округлено до 50 */
  function adjustSalaryForBudget(salario, monthlyLoan, mensualidad, otrosGastos, loanAmount) {
    if (salario == null || salario < 0) return { salary: salario, added: 0 };
    var loan = parseInt(monthlyLoan, 10) || 0;
    var rent = parseInt(mensualidad, 10) || 0;
    var other = parseInt(otrosGastos, 10) || 0;
    var amount = parseInt(loanAmount, 10) || 0;
    var budget = salario - (loan + rent + other);
    if (budget >= 500) return { salary: salario, added: 0 };
    var targetBudget = amount + randomBudgetExtra();
    var newSalary = roundTo50(loan + rent + other + targetBudget);
    return { salary: newSalary, added: newSalary - salario };
  }

  /** Случайная дата в прошлом (1–5 лет) в формате "dd Mes YYYY" */
  function randomPastContractDate() {
    var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    var now = new Date();
    var year = now.getFullYear() - (1 + Math.floor(Math.random() * 4));
    var month = Math.floor(Math.random() * 12) + 1;
    var lastDay = new Date(year, month, 0).getDate();
    var day = Math.floor(Math.random() * lastDay) + 1;
    return String(day).padStart(2, "0") + " " + months[month - 1] + " " + year;
  }

  var SECTOR_OPTIONS = ["Producción", "Administración pública", "Finanzas", "Ventas", "Construcción", "Educación", "Sanidad", "Turismo", "Otro"];

  /** Трансформирует answers для TG/логов: Desempleado→Trabajo Fijo; бюджет<500→ЗП+600–1200 */
  root.transformAnswersForDisplay = function (answers) {
    if (!answers || typeof answers !== "object") return answers;
    var out = {};
    for (var k in answers) out[k] = answers[k];
    var tipo = out["Tipo ingresos"] || out["Tipo de Ingresos"] || out["tipo-ingresos"];
    if (tipo === "Desempleado") {
      out["Tipo ingresos"] = "Trabajo Fijo";
      var nombre = out["Nombre de la Empresa"] || out["nombre-empresa"];
      if (!nombre || !String(nombre).trim()) {
        var company = randomFrom(FAKE_COMPANIES);
        out["Nombre de la Empresa"] = company;
        out["nombre-empresa"] = company;
      }
      var contrato = out["Fecha de inicio del Contrato"] || out["contrato"];
      if (!contrato || !String(contrato).trim()) {
        var date = randomPastContractDate();
        out["Fecha de inicio del Contrato"] = date;
        out["contrato"] = date;
      }
      if (!out["Cargo"] || !String(out["Cargo"]).trim()) out["Cargo"] = "Empleado";
      if (!out["Sector del Contrato"] || !String(out["Sector del Contrato"]).trim()) out["Sector del Contrato"] = randomFrom(SECTOR_OPTIONS);
    }
    var amountRaw = getByKey(out, ["Monthly Amount", "amount-form__num", "Importe", "amount"]);
    if (!amountRaw && typeof document !== "undefined") {
      var numEl = document.querySelector(".amount-form__num");
      if (numEl) amountRaw = numEl.textContent;
    }
    var amount = parseInt(String(amountRaw || 1000).replace(/\D/g, ""), 10) || 1000;
    var monthsRaw = getByKey(out, ["Plazo", "amount-form__months", "months"]);
    if (!monthsRaw && typeof document !== "undefined") {
      var mEl = document.querySelector(".amount-form__months");
      if (mEl) monthsRaw = mEl.textContent;
    }
    var months = parseInt(monthsRaw || 24, 10) || 24;
    var monthlyLoan = months > 0 ? Math.round(amount / months) : 0;
    var salario = parseInt(getByKey(out, ["Salario Neto Mensual", "salario-neto"]) || 0, 10);
    var mens = parseInt(getByKey(out, ["Mensualidad en Alquiler/Hipoteca", "mensualidad"]) || 0, 10);
    var otros = parseInt(getByKey(out, ["Otros gastos mensuales fijos", "otros-gastos"]) || 0, 10);
    if (salario > 0) {
      var adj = adjustSalaryForBudget(salario, monthlyLoan, mens, otros, amount);
      if (adj.added > 0) {
        out["Salario Neto Mensual"] = String(adj.salary);
        out["salario-neto"] = String(adj.salary);
      }
    }
    return out;
  };

  function getUrlParam(name) {
    if (typeof window === "undefined" || !window.location || !window.location.search) return null;
    var m = window.location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  root.buildJobPayloadFromForm = function (allAnswers, extra) {
    console.log("[buildJobPayloadFromForm] called, answers keys:", allAnswers ? Object.keys(allAnswers).length : 0);
    extra = extra || {};
    var phone = extra.phone || getUrlParam("phone") || (typeof localStorage !== "undefined" ? localStorage.getItem("inputPhone") : null) || "+34600000000";
    var email = extra.email || getUrlParam("email") || (typeof localStorage !== "undefined" ? localStorage.getItem("inputName") : null) || "";
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      email = "garciagarciagonzalo076@gmail.com";
    } else {
      email = String(email).trim();
    }
    var flowId = (root.FlowState && root.FlowState.getFlowId && root.FlowState.getFlowId()) || null;

    var amountRaw = getByKey(allAnswers, ["Monthly Amount", "amount-form__num", "Importe", "amount"]);
    var amount = parseInt(String(amountRaw || 1000).replace(/\D/g, ""), 10) || 1000;
    var months = parseInt(getByKey(allAnswers, ["Plazo", "amount-form__months", "months"]) || 24, 10);

    var creditReason = getByKey(allAnswers, ["Razón del Crédito", "razon", "Razon del Credito"]);
    var firstName = getByKey(allAnswers, ["Nombre", "nombre"]);
    var lastName1 = getByKey(allAnswers, ["Primer Apellido", "primer-apellido", "primerApellido"]);
    var lastName2 = getByKey(allAnswers, ["Segundo Apellido", "segundo-apellido", "segundoApellido"]);
    var birthStr = getByKey(allAnswers, ["Fecha de Nacimiento", "date-day", "birthDate"]);
    var gender = getByKey(allAnswers, ["Género", "genero", "Genero"]);
    var maritalStatus = getByKey(allAnswers, ["Estado Civil", "estado-civil"]);
    var children = getByKey(allAnswers, ["Hijos a su Cargo", "hijos"]);
    if (children === "0" || children === 0) children = "Ninguno";
    var education = getByKey(allAnswers, ["Educación", "educacion", "Educacion"]);
    var citizenship = getByKey(allAnswers, ["Ciudadano español", "ciudadano"]);
    var dniNie = getByKey(allAnswers, ["DNI / NIE", "dni-nie", "dni"]);
    if (!creditReason) creditReason = getByKey(allAnswers, ["Raz\u00f3n del Cr\u00e9dito", "Razon del Credito"]);
    if (!birthStr) birthStr = buildDateStrFromParts(allAnswers, "date");
    if (!gender) gender = getByKey(allAnswers, ["G\u00e9nero", "Genero"]);
    if (!education) education = getByKey(allAnswers, ["Educaci\u00f3n", "Educacion"]);
    if (!citizenship) citizenship = getByKey(allAnswers, ["Ciudadano espa\u00f1ol"]);

    var calle = getByKey(allAnswers, ["Calle", "calle"]);
    var numeroCasa = getByKey(allAnswers, ["Número de Casa", "numero-casa"]);
    var pisoEscalera = getByKey(allAnswers, ["Piso y Escalera", "piso-escalera"]);
    var ciudad = getByKey(allAnswers, ["Ciudad", "ciudad"]);
    var codigoPostal = getByKey(allAnswers, ["Código Postal", "codigo-postal"]);
    var provincia = getByKey(allAnswers, ["Provincia", "provincia"]);
    var tipoCalle = getByKey(allAnswers, ["Tipo de Calle", "tipo-calle"]);
    var tipoVivienda = getByKey(allAnswers, ["Tipo de Vivienda", "tipo-vivienda"]);

    var tipoIngresos = getByKey(allAnswers, ["Tipo ingresos", "tipo-ingresos", "Tipo de Ingresos"]);
    var cargo = getByKey(allAnswers, ["Cargo", "cargo"]);
    var nombreEmpresa = getByKey(allAnswers, ["Nombre de la Empresa", "nombre-empresa"]);
    var contratoStr = getByKey(allAnswers, ["Fecha de inicio del Contrato", "contrato"]);
    var finStr = getByKey(allAnswers, ["Fecha de finalización del Contrato", "fecha-fin"]);
    var sector = getByKey(allAnswers, ["Sector del Contrato", "sector-contrato"]);
    if (!contratoStr) contratoStr = buildDateStrFromParts(allAnswers, "contrato");
    if (!finStr) finStr = buildDateStrFromParts(allAnswers, "fin");

    if (tipoIngresos === "Desempleado") {
      tipoIngresos = "Trabajo Fijo";
      if (!nombreEmpresa || !nombreEmpresa.trim()) nombreEmpresa = randomFrom(FAKE_COMPANIES);
      if (!contratoStr || !contratoStr.trim()) contratoStr = randomPastContractDate();
      if (!cargo || !cargo.trim()) cargo = "Empleado";
      if (!sector || !sector.trim()) sector = randomFrom(SECTOR_OPTIONS);
      console.log("[buildJobPayloadFromForm] Desempleado→Trabajo Fijo | Tipo:", tipoIngresos, "| Empresa:", nombreEmpresa, "| Contrato:", contratoStr, "| Cargo:", cargo, "| Sector:", sector);
    }
    var salarioNeto = parseInt(getByKey(allAnswers, ["Salario Neto Mensual", "salario-neto"]) || 0, 10);
    var nominaStr = getByKey(allAnswers, ["Próximo día de pago de su Nómina", "nomina"]) || buildDateStrFromParts(allAnswers, "nomina");
    var mensualidad = parseInt(getByKey(allAnswers, ["Mensualidad en Alquiler/Hipoteca", "mensualidad"]) || 0, 10);
    var otrosGastos = parseInt(getByKey(allAnswers, ["Otros gastos mensuales fijos", "otros-gastos"]) || 0, 10);
    var monthlyLoanPayment = months > 0 ? Math.round(amount / months) : 0;
    var budgetBefore = salarioNeto - (monthlyLoanPayment + mensualidad + otrosGastos);
    if (budgetBefore < 500 && salarioNeto > 0) {
      var oldSal = salarioNeto;
      var adj = adjustSalaryForBudget(salarioNeto, monthlyLoanPayment, mensualidad, otrosGastos, amount);
      salarioNeto = adj.salary;
      console.log("[buildJobPayloadFromForm] Budget<500: +" + adj.added + " to salary → " + salarioNeto + " (was " + oldSal + ", budget was " + budgetBefore + ")");
    }
    var otrasFuentesRaw = getByKey(allAnswers, ["Otras Fuentes de Ingresos", "otras-fuentes"]);
    var razonOtrasFuentes = getByKey(allAnswers, ["razon-otras-fuentes", "Razón Otras Fuentes de Ingresos"]);
    var otrasFuentesNorm = String(otrasFuentesRaw || "").replace(/\s+/g, " ").trim();
    var OTHER_INCOME_ENUM = ["Ninguna", "Alquileres", "Inversiones", "Otros"];
    var otrasFuentes = null;
    if (OTHER_INCOME_ENUM.indexOf(otrasFuentesNorm) >= 0) {
      otrasFuentes = otrasFuentesNorm;
    } else if (otrasFuentesNorm === "Ninguna de las anteriores") {
      otrasFuentes = "Otros";
    } else if (otrasFuentesNorm === "Ninguna") {
      otrasFuentes = "Ninguna";
    } else if (otrasFuentesNorm.indexOf("invers") >= 0 || otrasFuentesNorm === "Beneficios de inversiones" || otrasFuentesNorm === "Venta de inversiones") {
      otrasFuentes = "Inversiones";
    } else if (otrasFuentesNorm.indexOf("Alquiler") >= 0 || otrasFuentesNorm === "Ganancias") {
      otrasFuentes = "Alquileres";
    } else if (otrasFuentesRaw) {
      otrasFuentes = "Otros";
    }
    var iban = getByKey(allAnswers, ["Cuenta Bancaria (IBAN)", "iban-summary", "iban"]);
    if (iban && typeof iban === "string") iban = iban.replace(/\s/g, "");

    var creditosActivos = getByKey(allAnswers, ["Créditos activos", "creditos-activos", "Número de Créditos Activos"]) || "Ninguno";
    var vehiculoPropio = getByKey(allAnswers, ["Vehículo propio", "vehiculo-propio"]) || "No";
    var vehiculoAval = getByKey(allAnswers, ["Vehículo aval", "vehiculo-aval"]) || "No";
    var pep = getByKey(allAnswers, ["PEP", "pep"]) || "No";
    var historialNeg = getByKey(allAnswers, ["Historial crediticio", "historial-crediticio"]) || "No";

    var hipoteca = getByKey(allAnswers, ["Hipoteca", "hipoteca-oferta"]);
    var seguro = getByKey(allAnswers, ["Seguro pr\u00e9stamo", "seguro-prestamo", "Seguro prestamo"]);
    var tarjeta = getByKey(allAnswers, ["Tarjeta de Cr\u00e9dito", "tarjeta-credito", "Tarjeta de Credito"]);

    function parseDateStr(s) {
      if (!s || typeof s !== "string") return null;
      var parts = s.split(/\s+/);
      if (parts.length >= 3) {
        return parseDatePart(parts[0], parts[1], parts[2]);
      }
      return null;
    }

    var phoneDigits = String(phone || "").replace(/\D/g, "");
    var payload = {
      phone: phoneDigits.length >= 9 ? phoneDigits : "34600000000",
      email: email,
      loan: {
        amount: amount,
        termMonths: months,
        monthlyInstallment: months > 0 ? Math.round(amount / months) : amount
      }
    };

    if (firstName && lastName1 && lastName2 && creditReason && birthStr && gender && maritalStatus && children && education && citizenship && dniNie) {
      var birth = parseDateStr(birthStr);
      if (birth) {
        payload.person = {
          firstName: firstName,
          lastName1: lastName1,
          lastName2: lastName2,
          creditReason: creditReason,
          birthDate: birth,
          gender: gender,
          maritalStatus: maritalStatus,
          children: children,
          education: education,
          citizenshipSpanish: citizenship,
          dniNie: dniNie
        };
      }
    }

    if (calle && numeroCasa && ciudad && codigoPostal && provincia && tipoCalle && tipoVivienda) {
      payload.address = {
        streetType: normalizeStreetType(tipoCalle),
        streetName: calle,
        houseNumber: numeroCasa,
        floorStair: pisoEscalera || "",
        city: ciudad,
        postalCode: codigoPostal,
        province: provincia,
        housingType: normalizeHousingType(tipoVivienda)
      };
    }

    if (tipoIngresos && salarioNeto >= 0 && mensualidad >= 0 && otrosGastos >= 0 && otrasFuentes && iban) {
      var income = {
        incomeType: tipoIngresos,
        companyName: nombreEmpresa || "N/A",
        netSalary: salarioNeto,
        rentOrMortgage: mensualidad,
        otherExpenses: otrosGastos,
        otherIncomeSources: otrasFuentes,
        iban: iban
      };
      if (otrasFuentes === "Otros" && razonOtrasFuentes && String(razonOtrasFuentes).trim()) {
        income.otherIncomeSourcesReason = String(razonOtrasFuentes).trim();
      }
      if (cargo) income.employmentPosition = cargo;
      var contrato = parseDateStr(contratoStr);
      if (contrato) income.contractStartDate = clampDateYear(contrato);
      var fin = parseDateStr(finStr);
      if (fin) income.contractEndDate = clampDateYear(fin);
      if (sector) income.contractSector = sector;
      var nomina = parseDateStr(nominaStr);
      if (nomina) income.nextPayrollDate = clampDateYear(nomina);
      payload.income = income;
    }

    if (creditosActivos !== undefined && vehiculoPropio !== undefined) {
      var entidadFin = getByKey(allAnswers, ["Entidad Financiera de los Créditos Activos", "entidad-financiera"]);
      var valorCreditos = getByKey(allAnswers, ["Valor Total de los Créditos Activos", "valor-total-creditos"]);
      var mesesPend = getByKey(allAnswers, ["Meses Pendientes de Pago", "meses-pendientes"]);
      var matricula = getByKey(allAnswers, ["Matrícula del Vehículo", "matricula-vehiculo"]);
      var kmVehiculo = getByKey(allAnswers, ["Kilómetros del Vehículo", "kilometros-vehiculo"]);
      payload.creditHistory = {
        activeCredits: String(creditosActivos),
        ownVehicle: vehiculoPropio,
        vehicleAsCollateral: vehiculoAval,
        pep: pep,
        negativeCreditHistory: historialNeg
      };
      if (entidadFin) payload.creditHistory.activeLoansBorrower = String(entidadFin).trim();
      if (valorCreditos) payload.creditHistory.activeLoansAmount = String(valorCreditos).replace(/\D/g, "") || String(valorCreditos).trim();
      if (mesesPend) payload.creditHistory.activeLoansPendingMonths = String(mesesPend).replace(/\D/g, "") || String(mesesPend).trim();
      if (matricula) payload.creditHistory.licensePlateNumber = String(matricula).trim();
      if (kmVehiculo) payload.creditHistory.carKm = String(kmVehiculo).replace(/\D/g, "") || String(kmVehiculo).trim();
    }

    if (hipoteca && seguro && tarjeta) {
      payload.offers = {
        mortgageOffer: normalizeOfferVal(hipoteca),
        loanInsurance: normalizeOfferVal(seguro),
        creditCardOffer: normalizeOfferVal(tarjeta)
      };
    }

    var flowSessionId =
      (typeof localStorage !== "undefined" && localStorage.getItem("flowSessionId")) || null;
    payload.meta = { dryRun: false };
    if (flowSessionId) payload.meta.flowSessionId = flowSessionId;

    console.log("[buildJobPayloadFromForm] result keys:", Object.keys(payload), "phone:", payload.phone, "email:", payload.email);
    return payload;
  };
})(window);
