# Migration Notes (Day 1)

## Confirmed backend contracts used
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/profile
- POST /api/location-priority/calculate
- POST /api/complaints/submit

## Open items
- Backend uses multiple complaint routes and variants (complaints.js, complaints-fixed.js, complaints.js.new).
  Decision needed: production source of truth route file for long-term maintenance.
- Category enum in backend is partially validated in location-priority route and can differ by endpoint.
  Action: finalize category constants and expose from backend or shared config.
- Image pipeline currently accepts imageUrl in complaint submit; local file upload contract for Flutter camera flow needs final endpoint decision.

## Run prerequisites
- Install Flutter SDK and add to PATH.
- Ensure backend server is running and reachable from device/emulator.
- Pass API_BASE_URL via --dart-define when running app.
