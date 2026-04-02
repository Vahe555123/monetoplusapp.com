const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isValidSpanishDni,
  isValidSpanishNie,
  isValidDniNie
} = require("../js/dni-validation.js");

test("accepts valid DNI with correct modulo-23 letter", () => {
  assert.equal(isValidSpanishDni("12345678Z"), true);
  assert.equal(isValidDniNie("12345678z"), true);
});

test("rejects DNI when the letter does not match", () => {
  assert.equal(isValidSpanishDni("12345678A"), false);
  assert.equal(isValidDniNie("12345678A"), false);
});

test("rejects malformed DNI values", () => {
  assert.equal(isValidSpanishDni("1234567Z"), false);
  assert.equal(isValidSpanishDni("123456789Z"), false);
  assert.equal(isValidSpanishDni("12345678"), false);
  assert.equal(isValidSpanishDni("1234A678Z"), false);
});

test("keeps NIE validation working with the same modulo-23 table", () => {
  assert.equal(isValidSpanishNie("X1234567L"), true);
  assert.equal(isValidDniNie("X1234567A"), false);
});
