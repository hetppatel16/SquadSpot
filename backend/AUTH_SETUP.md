# SquadSpot Authentication & Security Setup

This module uses Supabase Auth for email/password and provider authentication. FastAPI verifies Supabase access tokens before allowing access to private endpoints.

## Backend environment

Create `backend/.env` from `backend/.env.example` and set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep `.env` out of Git. The service-role key is server-only and must never be added to the Expo frontend or a public repository.

## Supabase Auth dashboard

1. Enable Email authentication and decide whether email confirmation is required for new accounts. When confirmation is required, signup intentionally returns a confirmation message instead of an active app session.
2. Configure Google in Supabase Auth and Google Cloud. Use the matching web, Android and iOS OAuth client IDs. The app uses the `squadspot://oauthredirect` custom scheme for native builds; register the redirect URI generated for your web origin as well. The same provider must be enabled in Supabase because the backend exchanges Google ID tokens through Supabase Auth. The IDs in `frontend/src/constants/authConfig.js` are public identifiers and should be replaced with IDs registered for the project's own bundle/package IDs if needed.
3. Configure Apple in Supabase Auth and the Apple Developer account before enabling Apple sign-in in an iOS build.
4. In **Authentication → Email Templates → Reset Password**, configure the email body to display the Supabase OTP using `{{ .Token }}`. The app accepts a six-digit code; a link-only template will not work with this screen.
5. Set the project's Auth email/OTP expiry and rate limits appropriately. Supabase validates recovery-code expiry and one-time use.

## Frontend environment

Create `frontend/.env` and set `EXPO_PUBLIC_API_URL` to the backend base URL. For Expo web on the same computer this can be `http://127.0.0.1:8000`. For a physical phone, use the computer's reachable LAN address instead of `127.0.0.1`.

The Google client IDs currently live in `frontend/src/constants/authConfig.js`; replace them with the IDs registered for your own app if required. They are public client identifiers, not provider client secrets. The custom `squadspot` URI scheme is already declared in `frontend/app.json`. Expo's current OAuth guide notes that Expo Go cannot test custom-scheme OAuth redirects; use an Expo development build for native Google/Apple sign-in.

## Run the backend

From `backend/` with the project's Python virtual environment activated:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Run the tests

From `backend/` with the same virtual environment activated:

```bash
pip install -r requirements-dev.txt
pytest -q
```

The tests mock Supabase Auth calls; they check API behavior but do not replace a live integration test against your own Supabase project.

On native iOS/Android, access and refresh tokens are stored with Expo SecureStore. Expo's web implementation falls back to AsyncStorage, which is not an HttpOnly cookie; for a production web deployment, move web session storage to a server-managed Secure/HttpOnly cookie flow.

## Protected API

`POST /api/itinerary` requires `Authorization: Bearer <supabase_access_token>`. The public `/api/health` and `/api/pois` endpoints remain available without a user session.
