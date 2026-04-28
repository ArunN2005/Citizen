# CIVIC-REZO Flutter (Phase 1-3 Scaffold)

This folder contains a phase-wise Flutter migration scaffold wired to the existing Node backend.

## Implemented in this phase
- App foundation with Riverpod + go_router + Dio
- Auth flow
  - Login
  - Signup
  - Session restore via secure token storage
  - Route guard
- Complaint flow
  - Priority preview via `/api/location-priority/calculate`
  - Complaint submission via `/api/complaints/submit`

## Prerequisites
- Install Flutter SDK and ensure `flutter` is on PATH.
- Start backend server from `CIVIC-REZO-Backend`.

## Env files
- Flutter reads its config from [CIVIC-REZO-Flutter/.env](.env) and [CIVIC-REZO-Flutter/.env.example](.env.example).
- Backend reads its config from [CIVIC-REZO-Backend/.env](../CIVIC-REZO-Backend/.env) and [CIVIC-REZO-Backend/.env.example](../CIVIC-REZO-Backend/.env.example).
- Image upload uses the backend Cloudinary proxy, so Flutter only needs `API_BASE_URL`.

## Run
1. Get packages
   - `flutter pub get`
2. Run app (Android emulator example)
   - `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001`
3. Run static analysis
   - `flutter analyze`

## If testing on physical device
Use your machine IP instead of localhost, for example:
- `flutter run --dart-define=API_BASE_URL=http://192.168.1.25:3001`

## Current scope limitations
- Feed/map/voting screens are next phase.
- Contract conflicts between multiple backend complaint route variants are documented in `MIGRATION_NOTES.md`.
