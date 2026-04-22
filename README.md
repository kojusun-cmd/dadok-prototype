# Massage App Workspace Guide

## Active Project
- Use `dadok-prototype` for all development and deployment tasks.
- Do not edit or deploy from backup folders.

## Backup Policy
- Historical copies are stored in `backups/`.
- Current backup location: `backups/dadok-prototype_backup`.

## Quick Start
1. Open `dadok-prototype`.
2. Run and test changes there.
3. Keep backups read-only unless recovery is needed.

## Da:dok Prototype

Static web prototype for the massage app.

### Project Structure
- `dadok-prototype/index.html`: user-facing mobile web screen
- `dadok-prototype/admin.html`: admin/partner management screen
- `dadok-prototype/assets/css/style.css`: shared styling
- `dadok-prototype/assets/js/script.js`: main user flow logic
- `dadok-prototype/assets/js/admin.js`: admin page logic
- `dadok-prototype/docs/`: project notes and pending tasks
- `dadok-prototype/firebase.json`, `dadok-prototype/firestore.rules`, `dadok-prototype/firestore.indexes.json`, `dadok-prototype/storage.rules`: Firebase config/rules
