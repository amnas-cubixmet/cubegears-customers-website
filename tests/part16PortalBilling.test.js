import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { invoiceTotals, invoicePaymentLabel, safeMoney } from '../src/portalBilling.js';
import { copy } from '../src/i18n.js';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('amount parsing fails closed on malformed, infinite and negative values', () => {
  assert.equal(safeMoney('1520.50'), 1520.5);
  assert.equal(safeMoney(' 12.50 '), 12.5);
  for (const item of ['Infinity', '-5', '1e7', '0xF', '12.345', '', null, undefined, {}]) {
    assert.equal(safeMoney(item), 0);
  }
});

test('finalized invoice totals use actual paid and outstanding fields without deriving fake payments', () => {
  const totals = invoiceTotals([
    { status: 'Finalized', total: '1800.00', paid: '500.00', balance: '1300.00' },
    { status: 'Paid', total: '400.00', paid: '400.00', balance: '0.00' },
    { status: 'Draft', total: '9999.00', paid: '0.00', balance: '9999.00' },
    { status: 'Cancelled', total: '9999.00', paid: '0.00', balance: '9999.00' },
  ]);
  assert.deepEqual(totals, { count: 2, total: 2200, paid: 900, outstanding: 1300 });
  assert.deepEqual(invoiceTotals(), { count: 0, total: 0, paid: 0, outstanding: 0 });
});

test('payment labels are localized and distinguish no payment from partial payment', () => {
  const due = { total: '800', paid: '0', balance: '800' };
  const partial = { total: '800', paid: '300', balance: '500' };
  const settled = { total: '800', paid: '800', balance: '0' };
  for (const locale of ['en', 'ml']) {
    assert.equal(invoicePaymentLabel(due, copy[locale]), copy[locale].unpaidStatus);
    assert.equal(invoicePaymentLabel(partial, copy[locale]), copy[locale].partialStatus);
    assert.equal(invoicePaymentLabel(settled, copy[locale]), copy[locale].paidStatus);
    for (const key of [
      'refresh', 'refreshing', 'refreshFailed', 'outstanding', 'invoiceOverview',
      'paidAmount', 'balanceDue', 'invoiced', 'balanceNote'
    ]) {
      assert.ok(copy[locale][key], locale + ':' + key);
    }
  }
});

test('customer dashboard uses authenticated session, not mock payment records', () => {
  assert.match(source, /const totals=invoiceTotals\(scopedInvoices\)/);
  assert.match(source, /await portalApi\.session\(\)/);
  assert.match(source, /invoicePaymentLabel\(d,t\)/);
  assert.match(source, /matchingJobIds\.has/);
  assert.match(source, /refreshError/);
  assert.doesNotMatch(source, /portalApi\.createPayment/);
});
