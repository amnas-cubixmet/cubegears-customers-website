# Customer Website — Manual WhatsApp Contact QA

Updated: 2026-11-12

- Customer website contains only user-initiated `wa.me` contact/enquiry links, not Meta APIs or automatic messaging.
- Validated international phone numbers for India and supported GCC destinations.
- Disabled malformed or local-only numbers instead of opening invalid WhatsApp targets.
- Added `tests/whatsappManualContact.test.js` for valid/invalid number regression.
- Other customer portal security/access token handling is unchanged.
- Browser/real WhatsApp delivery is not inferred from link opening.

CI: pending. Branch: `feature/manual-whatsapp-only-20261112`.
