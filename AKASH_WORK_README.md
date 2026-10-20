# Akash's Work – SquadSpot

This document records the work Akash contributed to the SquadSpot project. It is intended to help teammates and future contributors understand which parts Akash handled, what was changed, and which areas should not be unnecessarily rewritten.

> **Scope note:** This README documents the work discussed and tested during development. Before describing a contribution as fully merged into the team's latest branch, verify the current Git history and files. Do not assume that every local patch or generated file is already merged.

## 1. Main areas handled by Akash

### A. Authentication and API security

Akash worked on the application's authentication and API-security flow using Supabase Auth and Bearer access tokens.

**Responsibilities and implementation areas**

- Frontend login/session handling through the authentication context.
- Persisting and restoring the Supabase session using the platform storage utility.
- Sending the access token with protected API requests using the `Authorization: Bearer <token>` header.
- Backend validation of the supplied access token and identification of the current user.
- Protecting authenticated API routes with the current-user dependency.
- Testing authentication behaviour, including rejection of invalid tokens.

**Related files**

| File | Responsibility |
|---|---|
| `frontend/src/context/AuthContext.js` | Frontend authentication state and login/logout flow |
| `frontend/src/utils/storage.js` | Session persistence for web/mobile |
| `frontend/src/services/api.js` | API requests and authentication header handling |
| `backend/app/api/auth.py` | Current-user authentication dependency |
| `backend/app/core/security.py` | Access-token validation and security helpers |
| `backend/app/api/routes.py` | Applying authentication to protected endpoints |
| `backend/tests/test_auth_security.py` | Automated authentication/security tests |

**Important design decision**

The project retained the simpler Supabase Bearer-token approach. An experimental HttpOnly-cookie/CSRF approach was rolled back. Do not reintroduce the cookie-based design or add a second authentication mechanism unless the team explicitly agrees to redesign authentication.

**Testing recorded during development**

- Login was checked in the running application.
- Session persistence after browser refresh was checked.
- Logout was checked.
- The backend authentication test suite reported 14 passing tests at the time of testing.

### B. Budget validation

Akash worked on validating the user's budget at both the frontend and backend boundaries.

**Frontend behaviour**

- Rejects an empty or whitespace-only budget.
- Rejects zero and negative values.
- Rejects non-numeric, `NaN`, and infinite values.
- Allows only finite positive amounts to proceed.

**Backend behaviour**

The request schema validates that the budget is a finite number greater than zero. Backend validation is required even when frontend validation exists, because clients can call the API directly.

**Related files**

| File | Responsibility |
|---|---|
| `frontend/src/utils/Validations.js` | Reusable `validateBudget` function |
| `frontend/src/screens/PlannerScreen.js` | Stops invalid budgets before planning/navigation |
| `backend/app/api/schemas.py` | Pydantic validation for the budget field |

**Validation rule**

The backend budget field uses a positive-value constraint (`gt=0`) and disallows infinity/NaN (`allow_inf_nan=False`).

### C. Dynamic city search and selection

Akash worked on replacing the planner's fixed city list with city records fetched from Supabase through the backend.

**Flow**

1. The user types a city name in the planner.
2. The frontend waits briefly before searching (debouncing) to avoid making a request for every keystroke.
3. The frontend API service calls `GET /api/cities` with the search text.
4. FastAPI retrieves matching active cities from the `cities` table.
5. Matching city records are returned to the planner for selection.

**Related files**

| File | Responsibility |
|---|---|
| `frontend/src/screens/PlannerScreen.js` | City search input, results, loading/error state and selection |
| `frontend/src/constants/config.js` | Cities API endpoint constant |
| `frontend/src/services/api.js` | Frontend `searchCities` request |
| `backend/app/api/routes.py` | `GET /api/cities` endpoint |
| `backend/app/data_layer/repository.py` | Query for active city records |

**Important distinction**

Adding a row to `cities` only makes the city available for selection. It does not automatically add attractions to that city. Place records belong in `places` and are connected to a city by `city_id`.

### D. Itinerary correctness and user-facing fixes

During testing, Akash helped identify and validate fixes for issues that affected the generated itinerary experience:

- Recommendations must be restricted to places belonging to the selected city.
- Selected category preferences must be passed to the backend correctly; selecting Food must not silently become Adventure.
- Chill is represented as a vibe, not as a place category.
- If there are no matching verified places, the application should show a clear no-results message rather than inventing generic stops.
- The frontend should leave the loading screen when the backend returns an empty itinerary or an error.
- Place latitude/longitude should be preserved through the API response and frontend transformation so Google Maps can open a directions route using actual coordinates.

**Related areas to inspect when maintaining these fixes**

- `frontend/src/screens/PlannerScreen.js`
- `frontend/src/services/api.js`
- `frontend/src/screens/LoadingScreen.js`
- `frontend/src/screens/ResultScreen.js`
- `backend/app/services/itinerary_service.py`
- `backend/app/data_layer/repository.py`

These are maintenance notes for the relevant flow; they do not mean Akash owns every part of the itinerary algorithm.

## 2. Place data import work

Akash also worked on integrating and running the reusable OpenStreetMap POI-import process to populate the existing city database.

**What the importer does**

- Reads active cities from Supabase.
- Requests named OpenStreetMap features around city coordinates.
- Maps supported OSM tags to SquadSpot's existing categories.
- Adds heuristic vibe associations.
- Uses OSM element IDs and normalized names to avoid duplicates.
- Supports `--dry-run` so results can be previewed without database writes.
- Writes place records and their category/vibe relationships when run without `--dry-run`.

**Important limitations**

- OpenStreetMap coverage differs by city; a low count does not prove a city has no attractions.
- OSM generally does not provide trustworthy entry fees, ratings, or per-person spending estimates. Unknown values must remain unknown (`NULL`), not be represented as free (`0`).
- Category and vibe mappings are rule-based and need quality checks. A category count alone does not prove every place is a good recommendation.
- The importer uses a service-role Supabase key. It must only run in the backend/admin environment and must never be exposed in the frontend or committed to Git.
- Respect the OpenStreetMap attribution/licensing requirements when displaying imported data.

**Recorded import outcome**

The bulk run reported 6,620 newly imported OpenStreetMap records across 62 active cities. Supabase verification then showed 7,082 unique active places in total, with category and vibe associations present for the active records at the time of verification. These are recorded project results, not a guarantee that all place data is complete or error-free.

**Related file**

- `backend/scripts/import_osm_pois.py`

## 3. What Akash's work should not be overwritten casually

Before changing these areas, understand the existing implementation and discuss the change with Akash/the team:

1. **Authentication:** Do not replace the Bearer-token flow with cookie authentication or remove protected-route checks without an agreed security design.
2. **Budget validation:** Do not remove either frontend or backend validation. Both are intentional.
3. **City search:** Do not reintroduce a hardcoded city list as the only source of cities.
4. **City-to-place relationship:** Do not assume a city row automatically contains POIs. `places.city_id` links each place to its city.
5. **No-results handling:** Do not replace missing results with fabricated attractions such as generic “Adventure Point” stops.
6. **Unknown costs:** Do not convert `NULL` prices into zero or claim an unverified price is an official entry fee.
7. **Google Maps navigation:** Do not remove stop coordinates when transforming itinerary data; directions need the actual coordinates or place identifiers.
8. **Importer safety:** Do not run bulk imports repeatedly without checking the dry-run, existing records, deduplication, and per-city limits.
9. **Secrets:** Never commit `.env`, Supabase service-role keys, NextGIS API keys, access tokens, or other credentials.

## 4. Quick run commands

Run the backend from the `backend` directory:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Useful backend URLs:

- Health check: `http://127.0.0.1:8000/api/health`
- Swagger: `http://127.0.0.1:8000/docs`

Run the Expo web frontend from the `frontend` directory:

```powershell
npx expo start --web --port 3000
```

## 5. Before making changes

- Pull the latest team branch and check `git status` before editing.
- Read the relevant file and its callers before changing an API contract.
- Keep `.env` and credentials out of Git.
- Run the relevant backend tests after authentication or schema changes.
- Test login, refresh persistence and logout after authentication changes.
- Test empty, zero, negative and valid budgets after budget-validation changes.
- Test city search with multiple cities and confirm the selected city ID/name reaches the backend.
- Test category-only selections to ensure unrelated categories do not appear.
- Test an empty-result response to ensure the loading screen exits correctly.
- Test Google Maps navigation with real stop coordinates.
- Use importer dry-run and inspect sample names/categories before writing new records.

## 6. Ownership boundary

This README records Akash's contributions and related maintenance precautions. It does **not** claim that Akash authored or owns every part of SquadSpot. In particular, the core POI normalization, greedy filtering, fitness-scoring, scheduling, and genetic-algorithm implementations are separate project components and are not listed here as Akash's primary contributions.

For questions about a change, check the Git commit history and coordinate with the person responsible before replacing their work.
