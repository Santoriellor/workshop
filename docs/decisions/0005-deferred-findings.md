# 0005 — Deferred findings

## Status

Living document. Started during the documentation phase (Task 1) of the
`2026-08-22-workshop-refactor` plan; any task in the plan may append a
finding as it runs.

## Purpose

This records defects and risks the survey found that this refactor cycle
deliberately does not fix immediately — either because a later task in this
same plan fixes them (and this entry tracks that they are known, not
forgotten, until that task lands) or because they are out of scope for this
cycle entirely.

## Findings

### Open — fixed later in this plan

- **`ReportSerializer` uses `fields = '__all__'`.** This makes `Report.user`
  writable by any authenticated caller, so a caller can file a report under a
  colleague's name simply by setting `user` in the request body
  (`back/api/serializers.py:258-261`). Fixed by Task 8, which asserts the
  corrected behaviour as a new test per Spec D8 rather than pinning today's
  behaviour.
- **`UserSerializer.create` bypasses password validation.** It calls
  `User.objects.create_user(...)` directly
  (`back/api/serializers.py:64-70`), which never runs the serializer's field
  validators against `AUTH_PASSWORD_VALIDATORS`
  (`UserAttributeSimilarityValidator`, `MinimumLengthValidator`,
  `CommonPasswordValidator`, `NumericPasswordValidator` — all configured in
  `settings.py:153-166` but never invoked on this path). A one-character
  password registers successfully today. Fixed by Task 9.
- **Settings has three interrelated defects**, all present as of this
  writing:
  - `CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS').split(',')`
    (`settings.py:69`) raises `AttributeError` at import if the variable is
    unset — there is no default and no guard.
  - `load_dotenv()` (`settings.py:56`) runs *after* the `read_secret()` calls
    for `DJANGO_SECRET_KEY`, `MYSQL_USER` and `MYSQL_PASSWORD`
    (`settings.py:51-53`), so `back/.env` cannot supply those secrets no
    matter what it contains.
  - `CORS_ORIGIN_WHITELIST` (`settings.py:261-263`) is the pre-3.0
    `django-cors-headers` setting name; the project pins `django-cors-headers`
    4.6.0, which ignores it entirely — only `CORS_ALLOWED_ORIGINS` has any
    effect.

  Fixed by Task 10, alongside the settings-package split recorded in
  `docs/decisions/0001-settings-split-by-environment.md`.

### Deferred beyond this plan

- **JWT stored in `localStorage`.** See
  `docs/decisions/0004-jwt-in-localstorage.md` for the full finding. Not
  fixed in this cycle; moving to httpOnly cookies needs a CSRF story and a
  backend contract change that is out of scope here.
- **`read_secret()` lets an environment variable silently win over a mounted
  Docker secret.** See `docs/decisions/0003-secrets-are-read-only.md`.
  `secrets/` and the code path that reads it are treated as read-only for
  this cycle.
- **`nginx/media` on the VPS is a root-owned leftover** from an earlier
  architecture. Nothing in `docker-compose.yml` or
  `nginx/frontend/nginx.conf` references it; the deploy workflow now excludes
  it from the `rsync --delete` sync (`--exclude "nginx/media"`) because rsync
  cannot remove a root-owned path without root access on the VPS. Cleaning it
  up requires an operator with root on the deployment host; it is not
  something this repository's tooling can do on its own.
- **Nothing formats or lints the backend.** Only `front` has Prettier/ESLint
  configured today. The estate spec's D4 introduces ruff for Python as an
  isolated formatter-sweep commit; that lands in this cycle's refactor phase,
  not the documentation phase.

### Found during Task 2 — dependency findings, owned by Task 14

- **27 npm advisories in transitive frontend dependencies.** `npm audit`
  against `front/` reports 27 advisories, all in transitive packages rather
  than direct dependencies. Not fixed in this cycle; Task 14 owns dependency
  changes.
- **`@vitest/coverage-c8@^0.33.0` conflicts with `vitest@^3.1.3`.** The
  pinned coverage package's peer dependency range does not accept the pinned
  `vitest` major version, so both CI and local installs must run
  `npm ci --legacy-peer-deps` to work around the mismatch instead of a clean
  `npm ci`. Recorded rather than fixed here; Task 14 owns dependency changes.

<!-- Any task in the plan may append its own entries below this line. -->

### Found during Task 8

- The report modal still puts `user` in the create payload. The API ignores it
  as of the ownership fix, but the field and the client-side required check
  that depends on it were left in place; removing them touches the form hook,
  the modal state and the validation list for no behavioural gain.

### Found during Task 10

- `CORS_ORIGIN_WHITELIST = ['http://localhost']` was removed rather than
  migrated. It is the pre-3.0 name of `CORS_ALLOWED_ORIGINS`; django-cors-headers
  4.6.0 ignores it, so it had no effect and reading it as live configuration was
  misleading. `localhost` is not added to `CORS_ALLOWED_ORIGINS` in its place,
  because production serves the frontend from the same origin as the API and
  does not need it; `back/.env.example` already sets `http://localhost:3000` for
  the Vite dev server.

### Found during Task 9

- **Frontend password strength checks are commented out.**
  `front/src/utils/validation.js:52-60` has the real strength checks disabled;
  `isValidPassword` currently only requires one lowercase letter. Task 9 makes
  the backend the enforcement point — `AUTH_PASSWORD_VALIDATORS` now runs via
  `UserSerializer.validate`, so a weak password is rejected with a 400 no
  matter what the client sends — but the client itself still won't tell a user
  their password is weak until they submit and get that 400 back. Restoring
  the frontend checks so the mismatch between what the UI accepts and what the
  API accepts is caught earlier is Task 13's responsibility; not touched here
  per this task's constraints.

### Found during Task 14 — axios 0.27 → 1.x

- **No call site passes a `params` object.**

  ```
  cd front && grep -rn "params:" src --include=*.js --include=*.jsx | grep -v "__tests__"
  ```

  produced no output. Every call site builds its query string with
  `URLSearchParams` and concatenates it onto the URL (including the one Task
  13 moved off `fetch`), so `paramsSerializer` never runs and the 1.x change
  from a serializer function to a `{ encode, serialize }` object cannot affect
  this codebase.

- **Every error read is one of four shapes, all unchanged in 1.x.**

  ```
  cd front && grep -rn "error\.response\|error\.message\|err\.response" src --include=*.js --include=*.jsx | grep -v "__tests__"
  ```

  hits `src/contexts/AuthContext.jsx`, five modal components, and the seven
  Zustand stores' `catch` blocks, all reading `error.response`,
  `error.response.status`, `error.response.data...` or `error.message`.
  `axiosInstance.js` and `authUtils.js` catch and either replay or log the
  error object without inspecting a property. `AxiosError` still carries
  `response`, `config` and `message` unchanged in 1.x; nothing in this
  codebase reads the `code` property 1.x adds, and nothing calls
  `error.toJSON()` or checks `isAxiosError`. This bump is a version change,
  not an error-handling migration.

- **The bump: `axios@^0.27.2` → `axios@^1.7.9`, resolved to `1.19.0`**
  (latest 1.x satisfying the range at install time). `front/package.json` and
  `front/package-lock.json` are the only files this task touches;
  `npm install --legacy-peer-deps` was used to match CI, working around the
  pre-existing `@vitest/coverage-c8`/`vitest@^3` peer conflict recorded above.

- **The `authHeader(config)` `.get()` branch now executes**, confirmed with a
  throwaway diagnostic test (not committed) that read
  `config.headers.constructor.name` inside a custom `axiosInstance.defaults.adapter`:
  it reported `AxiosHeaders`, `typeof headers.get === 'function'` was `true`,
  and `headers.get('Authorization')` returned the bearer token. Before this
  bump `config.headers` was a plain object and only the fallback
  (`config.headers?.Authorization`) branch ran; the committed unit test
  `authHeader reads the header from either axios header representation`
  already exercised both branches directly, but the *application* code path
  only started reaching the `.get()` branch after this upgrade.

- **The 401 retry interceptor (`src/utils/axiosInstance.js`) still holds.**
  Verified with the existing suite plus the same throwaway diagnostic:
  - A recoverable 401 (adapter rejects once, then succeeds) refreshes exactly
    once and replays successfully — covered by
    `refreshes the token and replays the request after a 401`.
  - An unconditionally-401 adapter does not recurse — covered by
    `does not loop when the replayed request is also rejected`, which caps the
    adapter at 5 calls and asserts exactly 2.
  - `config._retry` does survive axios 1.x's internal config rebuild between
    attempts: the diagnostic showed `seen[0] !== seen[1]` (1.x hands the
    adapter a new merged config object on the replay, not the same reference
    the interceptor mutated) but `seen[0]._retry === true` and
    `seen[1]._retry === true` — axios's `mergeConfig` carries custom
    properties like `_retry` through the merge, so the bound is not lost even
    though the object identity changes.

- **`npm audit --omit=dev` reports no axios advisory** after the bump
  (`NO AXIOS ADVISORY`). 12 vulnerabilities remain (2 low, 10 high), all in
  `vite` and its `react-router`/`turbo-stream` dev-tooling transitive chain —
  none in axios or its dependents. Out of scope for this task (Spec D5 is
  axios-only); left for a future dependency-hygiene pass.

### Found during Task 12

- Pagination is still declared two different ways. `ReportViewSet`,
  `InventoryViewSet` and `InvoiceViewSet` opt out of DRF pagination and use
  `OptionalPaginationMixin`; `OwnerViewSet`, `VehicleViewSet`, `UserViewSet` and
  `UserProfileViewSet` inherit `LimitOffsetPagination` with no default page size,
  which happens to produce a bare array too — until a caller passes `limit`, at
  which point those four return the envelope and their zustand stores, which
  assign `response.data` straight into state, would store an object where an
  array is expected. Unifying this means changing the store contract as well as
  the API and is out of scope for this cycle.

### Found during Task 15, corrected during Task 15 review

- **`ReportCard.jsx`'s `userName` memo was missing a `react-hooks/exhaustive-deps`
  dependency, and was a live bug, not lint pedantry.** `getUserNameById`
  (`front/src/components/reports/ReportCard.jsx:37-39`) closes over `users`
  from `useUserStore`, which initialises to `[]` and is populated by an async
  fetch. With the `useMemo` at line 50 listing only `[item.user]`, a card
  mounted before that fetch resolved computed `'Unknown User'` once and never
  recomputed after `users` arrived.

  This was first misdiagnosed as "adding `users` would make the memo
  recompute every render" and deferred by disabling
  `react-hooks/exhaustive-deps` for the file in `front/eslint.config.js`. That
  rationale was wrong: `users` is a store reference that only changes when
  the fetch lands, not a fresh reference every render — exactly the same
  reasoning the sibling memos at lines 42-49 already rely on for
  `vehicles`/`owners`. Corrected: the deps array is now
  `[item.user, users]`, and the per-file ESLint override has been removed.
