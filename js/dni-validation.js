(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.DniValidation = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this,
  function () {
    "use strict";

    var DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

    function normalize(value) {
      return String(value || "")
        .replace(/[\s-]/g, "")
        .toUpperCase();
    }

    function isValidSpanishDni(value) {
      var dni = normalize(value);
      var match = /^(\d{8})([A-Z])$/.exec(dni);
      if (!match) return false;

      var number = parseInt(match[1], 10);
      var expectedLetter = DNI_LETTERS.charAt(number % 23);
      return expectedLetter === match[2];
    }

    function isValidSpanishNie(value) {
      var nie = normalize(value);
      var match = /^([XYZ])(\d{7,8})([A-Z])$/.exec(nie);
      if (!match) return false;

      var prefixMap = { X: "0", Y: "1", Z: "2" };
      var number = parseInt(prefixMap[match[1]] + match[2], 10);
      var expectedLetter = DNI_LETTERS.charAt(number % 23);
      return expectedLetter === match[3];
    }

    function isValidDniNie(value) {
      return isValidSpanishDni(value) || isValidSpanishNie(value);
    }

    return {
      DNI_LETTERS: DNI_LETTERS,
      normalize: normalize,
      isValidSpanishDni: isValidSpanishDni,
      isValidSpanishNie: isValidSpanishNie,
      isValidDniNie: isValidDniNie
    };
  }
);
