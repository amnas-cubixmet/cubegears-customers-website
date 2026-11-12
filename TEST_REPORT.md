# Customer Website — Manual WhatsApp Contact QA

Updated: 2026-11-12

- Customer website contains only user-initiated `wa.me` contact/enquiry links, not Meta APIs or automatic messaging.
- Validated international phone numbers for India and supported GCC destinations.
- Disabled malformed or local-only numbers instead of opening invalid WhatsApp targets.
- Added `tests/whatsappManualContact.test.js` for valid/invalid number regression.
- Other customer portal security/access token handling is unchanged.
- Browser/real WhatsApp delivery is not inferred from link opening.

Implementation PR [#33](https://github.com/amnas-cubixmet/cubegears-customers-website/pull/33) merged to main as `b514d68949a82bb05220951d6cdad3b62cdf016b`. Merged-main [CI 43171281680](https://github.com/amnas-cubixmet/cubegears-customers-website/actions/runs/43171281680): **success** (Node tests and Next.js build). No authenticated live customer or mobile WhatsApp delivery retest has been completed; do not infer delivery from a draft.
