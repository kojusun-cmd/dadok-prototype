# Da:dok Prototype

Static web prototype for the massage app.

## Project Structure
- `index.html`: user-facing mobile web screen
- `admin.html`: admin/partner management screen
- `assets/css/style.css`: shared styling
- `assets/js/script.js`: main user flow logic
- `assets/js/admin.js`: admin page logic
- `docs/`: project notes and pending tasks
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`: Firebase config/rules

## Working Rules
- This is the active development folder.
- Keep backup copies outside this folder (`../backups/`).
- Do not commit generated dependencies such as `node_modules/`.

## Local Run
Quick preview:
1. Open `index.html` directly in a browser.
2. Open `admin.html` for admin flow checks.

If Firebase features are being tested, run through your current Firebase workflow and ensure rules/config files in this folder are used.

## Current Priorities
- Stabilize Firebase-connected user flows.
- Replace remaining mock payloads in dashboard stats.
- Keep docs in `docs/` updated after each major change.
