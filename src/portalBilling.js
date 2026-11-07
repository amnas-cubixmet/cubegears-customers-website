/**
 * Read-only financial presentation helpers for the customer portal.
 * Amounts always come from finalized Django invoice records.
 * This module never creates, changes, or infers a payment transaction.
 */
export function safeMoney(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  if (typeof value === 'string' && !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return 0;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function invoiceTotals(invoices = []) {
  const rows = Array.isArray(invoices) ? invoices : [];
  return rows.reduce((totals, invoice) => {
    if (!invoice || typeof invoice !== 'object') return totals;
    // Django's /customer-website/session is authoritative: it excludes
    // drafts and cancellations. Re-check here to protect the UI as well.
    if (['Draft', 'Cancelled'].includes(invoice.status)) return totals;
    totals.total += safeMoney(invoice.total);
    totals.paid += safeMoney(invoice.paid);
    totals.outstanding += safeMoney(invoice.balance);
    totals.count += 1;
    return totals;
  }, { total: 0, paid: 0, outstanding: 0, count: 0 });
}

export function invoicePaymentLabel(invoice, translations) {
  const balance = safeMoney(invoice?.balance);
  const paid = safeMoney(invoice?.paid);
  if (balance === 0) return translations.paidStatus;
  return paid > 0 ? translations.partialStatus : translations.unpaidStatus;
}
