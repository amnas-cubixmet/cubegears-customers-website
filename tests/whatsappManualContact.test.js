import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappDigits } from '../src/i18n.js';

test('accepts formatted supported international phone numbers', () => {
  assert.equal(whatsappDigits('+91 (98765) 43210'), '919876543210');
  assert.equal(whatsappDigits('+971 50 123 4567'), '971501234567');
  assert.equal(whatsappDigits('966501234567'), '966501234567');
});

test('rejects invalid or incomplete numbers without guessing country prefix', () => {
  for (const value of ['', '9876543210', '+91987654', 'javascript:alert(1)', '+999123456789']) {
    assert.equal(whatsappDigits(value), '', value);
  }
});
