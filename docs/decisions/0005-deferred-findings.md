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
- ~~**Nothing formats or lints the backend.**~~ **Resolved by Task 15**, no
  longer deferred. At the time this entry was written (Task 1, documentation
  phase) only `front` had Prettier/ESLint configured. `ruff.toml` (repository
  root) now lints and formats `back/`, `front/eslint.config.js` replaces the
  removed `front/.eslintrc.js` under ESLint 9's flat-config format, and both
  run as CI gates in `.github/workflows/deploy.yml` alongside the two test
  suites. Left in place here, struck through rather than deleted, as a record
  that the gap this entry originally flagged is now closed.

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
- **`_ENV` lands in `django.conf.settings` as `settings._ENV`.**
  `back/backend/settings/__init__.py` assigns `_ENV = os.getenv("DJANGO_ENV",
  "development").strip().lower()` at module scope before selecting which
  settings module to load. Django's `Settings.__init__` copies every
  module-level name for which `name.isupper()` is true onto the settings
  object — and `"_ENV".isupper()` is `True` in Python (leading underscores
  are not cased characters, so `isupper()` only looks at the letters), so
  `_ENV` is not filtered out the way a genuinely private helper would be.
  The result is harmless — `settings._ENV` is just the lowercased environment
  name, not a secret — but it is an accidental extra attribute on the
  settings object, not a designed one.
- **Production `CSRF_TRUSTED_ORIGINS` filters hosts on `'.' in host`.**
  `back/backend/settings/production.py:31` builds it as
  `[f"https://{host}" for host in ALLOWED_HOSTS if "." in host]`. Today
  `ALLOWED_HOSTS` is `workshop.santoriello.ch`, which contains a dot and
  produces the correct single entry. But if `ALLOWED_HOSTS` is ever widened
  to a Django wildcard-subdomain entry such as `.santoriello.ch`, that entry
  also contains a dot and would pass the filter unchanged, producing
  `https://.santoriello.ch` — a leading-dot origin that does not match any
  `Origin` header a real browser sends, so CSRF-protected POSTs from the
  intended wildcard subdomains would fail even though `ALLOWED_HOSTS` itself
  correctly permits the host. Not a live bug today; a latent one for the day
  `ALLOWED_HOSTS` grows a wildcard entry.
- **Production `CORS_ALLOWED_ORIGINS` unset now yields `[]` silently where it
  previously crashed at import.** Before Task 10,
  `os.getenv('CORS_ALLOWED_ORIGINS').split(',')` raised `AttributeError` the
  moment the variable was unset, which — however unfriendly the error — meant
  a misconfigured production deployment could not start at all and the
  problem was impossible to miss. `csv_env()` replaced that with a graceful
  default, but `production.py:16` calls `csv_env("CORS_ALLOWED_ORIGINS")`
  with no default argument, so an unset variable now resolves quietly to
  `CORS_ALLOWED_ORIGINS = []`. Django starts normally, the deploy looks
  healthy, and every cross-origin request from the frontend is simply
  rejected by CORS with no log line pointing at the cause. The loud-failure
  guarantee that made this class of misconfiguration impossible to deploy
  unnoticed is gone; catching it now depends on someone testing the frontend
  against the deployed backend rather than the deploy itself failing. Fixing
  it would mean giving `production.py` its own required-variable check (mirroring
  `read_secret()`'s pattern) rather than reusing `csv_env()`'s permissive
  default — out of scope for this cycle, which does not add new settings
  validation.

### Found during Task 9

- **Frontend password strength checks are commented out.**
  `front/src/utils/validation.js:52-60` has the real strength checks disabled;
  `isValidPassword` currently only requires one lowercase letter. Task 9 makes
  the backend the enforcement point — `AUTH_PASSWORD_VALIDATORS` now runs via
  `UserSerializer.validate`, so a weak password is rejected with a 400 no
  matter what the client sends — but the client itself still won't tell a user
  their password is weak until they submit and get that 400 back. Restoring
  the frontend checks so the mismatch between what the UI accepts and what the
  API accepts is caught earlier was flagged as Task 13's responsibility.
  **Update at Task 16:** Task 13 ran (it introduced the single HTTP client and
  `useUserStore.updateUser`) and did not touch `validation.js`. The lowercase
  requirement at `front/src/utils/validation.js:65`
  (`if (!/[a-z]/.test(password))`) is still active today and is still
  stricter than the backend: `AUTH_PASSWORD_VALIDATORS` has no lowercase
  requirement, so the client rejects some passwords Django would accept. This
  remains deferred, now beyond this plan entirely rather than pending a later
  task in it.
- **`MinimumLengthValidator` has no test password that isolates it.** Every
  password in `test_registration_password.py` that is short enough to trip
  `MinimumLengthValidator` (default: under 8 characters) is *also* on
  Django's common-password list, so `CommonPasswordValidator` rejects it too
  and the test cannot tell which validator actually fired. Confirmed
  directly: `CommonPasswordValidator().validate("abc123")` — the password
  used by `test_a_short_password_is_rejected` — raises on its own, before
  length is even considered. This does not weaken the suite's claim that weak
  passwords are rejected, only its claim about *which* validator is
  responsible for rejecting each one.

### Found during Task 13 — one HTTP client, `useUserStore.updateUser`

- **`Register.jsx` double-navigates after a successful registration.**
  `AuthContext.jsx`'s `register()` already calls `navigate('/login')` after
  the success dialog (line 110) and returns `true`. `Register.jsx`'s
  `handleSubmit` then does `if (isRegistered) { navigate('/login') }` (line
  106) on that same `true`. Both calls target the same route, so this is
  inert in practice — React Router does not error on a redundant `navigate`
  to the current destination — but it is dead, confusing code: a reader
  fixing either call site would reasonably expect it to be the only one.
  Removing it is a one-line change but touches a component this task's scope
  did not otherwise touch.

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
  axios-only); left for a future dependency-hygiene pass. Reconfirmed at
  Task 16: `npm audit --omit=dev` against the current `package-lock.json`
  still reports exactly 12 (2 low, 10 high), same packages.
- **`typescript` and `@typescript-eslint/parser` were dropped from
  `package-lock.json` during the axios install.** Neither is a direct
  dependency; both used to appear as installed transitive packages (pulled in
  by an ESLint plugin's optional peer) and no longer do after
  `npm install --legacy-peer-deps` re-resolved the tree for the axios bump.
  `package-lock.json` still lists them as *peer dependency ranges* several
  ESLint packages declare (e.g. `"typescript": ">=4.8.4 <5.9.0"`), which is
  just those packages documenting what they'd accept — there is no
  `node_modules/typescript` or `node_modules/@typescript-eslint/parser` entry
  in the lockfile any more. This is inert today because
  `front/eslint.config.js` (Task 15) uses ESLint's default JavaScript parser,
  not `@typescript-eslint/parser` — nothing in the config or the codebase
  references either package. It would only matter if a future change adopted
  TypeScript or the TypeScript ESLint parser, at which point both would need
  to be added back as direct dependencies rather than assumed still present.

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
- **An empty `?ordering=` yields a 500, on all three `OptionalPaginationMixin`
  endpoints.** `OptionalPaginationMixin.list()`
  (`back/api/mixins.py:20-22`) does
  `ordering = request.query_params.get("ordering", self.default_ordering)`
  then `.order_by(*ordering.split(","))`. A caller who sends `?ordering=`
  (present but empty, as opposed to omitted) gets `ordering = ""`, and
  `"".split(",")` is `['']`, so the call becomes `.order_by('')`, which Django
  raises `FieldError` on — an uncaught 500 for `ReportViewSet`,
  `InventoryViewSet` and `InvoiceViewSet` alike. This bug predates Task 12 —
  each viewset carried its own copy of the same logic before the mixin
  consolidated them — but consolidating it means the fix, when it happens, is
  now a single `if ordering:` guard in one place instead of three. Not fixed
  here because Task 12's brief was consolidation, not new defect fixes.
- **`ConcurrencyCheckMixin.validate` diverges from the pre-Task-12 code only
  for a falsy-but-non-`None` `self.instance`.** The five serializers this
  mixin replaced each wrote `if self.instance:` (truthiness); the mixin
  (`back/api/serializers.py:43`) writes `if self.instance is None:`
  (identity) with inverted logic. In DRF, `self.instance` is always either
  `None` (create) or a saved model instance (update), and a model instance
  with no `__bool__`/`__len__` override is always truthy, so the two forms
  are behaviourally identical for every real case in this codebase. Recorded
  because it is a genuine semantic change, not because it is reachable.
- **Import audit for the ruff sweep (Spec D8 asked which imports survived
  it):** `back/api/views.py`'s unused `import os` — flagged during Task 12's
  characterization — no longer exists; ruff's `--fix` (the formatter-sweep
  commit, `b0f43bb6`) removed it as an F401 violation. `back/api/serializers.py`
  imports `os`, `datetime` and `Decimal` (plus `now` from
  `django.utils.timezone`); all four are used
  (`os.path.join`/`os.path.exists` at `serializers.py:397-398`,
  `datetime.now().year` at `:186`, `Decimal(...)` at `:316` and `:351`, `now()`
  at `:319` and `:354`), so ruff correctly left all four in place.

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

### Found during Task 16 — pre-existing domain findings, not touched this cycle

These surfaced while re-reading `back/api/models.py` and `back/api/views.py`
for the Task 16 documentation refresh. None are regressions introduced by
this refactor; all predate it and remain exactly as found, per this task's
"no application code" constraint.

- **`Report.status` is an unconstrained `CharField` with `choices`, not a
  `choices`-enforced value at the database level** (`back/api/models.py:109`).
  Django validates `choices` in `full_clean()` and in `ModelForm`/DRF
  serializer validation, but nothing stops a direct `.save()` (a migration, a
  shell session, `bulk_create`) from writing an arbitrary string.
  `ReportViewSet` (`back/api/views.py:240`) then compares `status` to the bare
  literal `"exported"` twice on one line
  (`self._previous_status != "exported" and self._updated_instance.status ==
  "exported"`) rather than a named constant — so a typo'd status string would
  silently never trigger invoice generation instead of raising anywhere.
- **`Invoice.total_cost` recomputes from the report's tasks and parts on every
  read** (`back/api/models.py:249-262`), rather than being stored at export
  time. This means a historic, already-issued invoice's displayed total
  changes if a `TaskTemplate.price` or `Inventory.unit_price` it referenced is
  edited later — the PDF generated at export time is frozen, but the API
  response for that same invoice is not. This is a domain-correctness bug
  (an invoice should be immutable once issued), not a performance one, and
  fixing it properly means storing the total at export time plus a migration
  to backfill it for existing rows — out of scope for a documentation-only
  task and not something this cycle's plan scoped in.
- **A commented-out `total_cost` field lingers on `Invoice`**
  (`back/api/models.py:243`): `""" total_cost = models.DecimalField(...) """`,
  dead since the column was dropped in migration `0009` in favor of the
  `@property` above it. Harmless, but a `git log`/`git blame` archaeology
  session would answer the same question this comment is trying to.
- **`Part.save()` has an `if`/`else` whose two branches are identical**
  (`back/api/models.py:206-212`): both the `if previous_inventory ==
  self.part:` branch and its `else` do exactly
  `previous_inventory.quantity_in_stock += previous_part.quantity_used;
  previous_inventory.save()`. The `else` branch's comment ("If changing
  inventory item, restore the old one and update the new one") describes
  intended behaviour the code does not actually implement differently from
  the `if` branch — whatever divergent handling was meant for
  "changed to a different inventory item mid-update" either was never
  written or was written and then made identical by mistake. Not touched
  here; behaviour is unchanged either way since both branches do the same
  thing today.
- **The `myapiapp` logger in `LOGGING`** (`back/backend/settings/base.py:255-259`)
  does not correspond to any entry in `INSTALLED_APPS` — the custom app is
  named `api`. Nothing in the codebase currently logs through a logger named
  `myapiapp`, so the handler is configured but unused; a developer adding
  `logging.getLogger(__name__)`-style logging inside `api/` and expecting the
  `myapiapp` logger's `INFO` level and console handler to apply would be
  surprised that it does not, since `__name__` inside `api/` resolves to
  `api.<module>`, not `myapiapp.<module>`.
