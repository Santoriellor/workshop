# 0002 — Permission baseline

## Status

Implemented. The specific defect described below was fixed and deployed
ahead of this refactor cycle, on 2026-08-22, because it was live on
`workshop.santoriello.ch` and this plan had it queued behind six other
tasks — it could not wait for its originally-scheduled slot (Task 7).
Task 7 was amended in place: rather than re-implement a fix that had
already shipped, it closed the test gap the out-of-band fix left behind.
The out-of-band fix landed with five tests in
`back/api/tests/test_user_endpoint_permissions.py`; Task 7 replaced that
file with the full ten-test set specified for it in
`back/api/tests/test_users_api.py` (the repo's `test_<thing>_api.py`
convention, which the hurried file did not follow) and removed the old
file once every case it covered was present in the new one. The general
pattern change described below (every viewset declaring its own
permissions explicitly, public access granted per-action) was already in
place across `back/api/views.py` by the time Task 7 ran; see "Current
state".

## Context

`REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']` in `settings.py` is
`IsAuthenticated`. Every single viewset in `back/api/views.py` re-declares
`permission_classes` on the class anyway, rather than relying on that
default. That redundancy is exactly what let one viewset override the
default silently and go unnoticed: `UserViewSet` originally read

```python
permission_classes = []
```

with no `@action`-level override, which made `GET /api/users/` — the full
user list, including id, username and email for every account — readable by
an anonymous caller. Nothing about that mistake would trip a lint rule or a
type check; it is legal DRF, and the project-wide default being
`IsAuthenticated` did nothing to protect this one class because the class
overrode it.

## Current state

This specific defect was fixed out-of-band, ahead of this plan: on
2026-08-22, `UserViewSet` was changed to

```python
permission_classes = [permissions.IsAuthenticated]

@action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
def check_availability(self, request):
```

(`back/api/views.py:93,101`). The fix was merged and deployed, and verified
live: `GET /api/users/` now returns 401 for an unauthenticated caller, and
`check_availability` — which by design must be reachable before login, since
the registration form uses it to check username/email availability — still
returns 200. This ADR documents that the fix shipped ahead of the plan (the
finding was serious enough, and the fix small and self-contained enough,
that it did not wait for this refactor cycle's characterization phase) and
records the permission baseline as it now stands, not as it stood before the
fix.

As of this writing, every viewset in `back/api/views.py` declares
`permission_classes = [permissions.IsAuthenticated]` except for two
`@action`s that are deliberately public: `UserViewSet.check_availability`
(above) and the two standalone `APIView`s `RegisterView` and `LoginView`
(`permission_classes = []`, i.e. `AllowAny` — a caller cannot register or log
in while already required to be authenticated).

## Decision

Every viewset declares `permission_classes` explicitly; the class-level
default remains `IsAuthenticated`; any endpoint that must be reachable
without authentication grants that per action via `get_permissions()` (or a
per-action `permission_classes` on an `@action`, as `check_availability`
already does), never by emptying the class-level list. Emptying the list is
what caused the `UserViewSet` defect, so it is treated as a pattern to avoid
project-wide, not merely a mistake that was fixed once.

## Consequences

`back/api/tests/test_users_api.py` (Task 7) asserts the corrected boundary
for `UserViewSet` specifically — including the five cases the out-of-band
fix's tests did not cover: that no email leaks into an anonymous response
body, that `check_availability` reports a free email correctly, that no
list row carries a `password` field, that `me` returns the caller's own
identity, and that the endpoint rejects writes with 405 (it is a
`ReadOnlyModelViewSet`). Later tasks in this refactor cycle apply the same
per-viewset characterization to the rest of `back/api/views.py` (per Spec
D8, since this is a security-motivated behaviour change, it is asserted as
corrected behaviour, not pinned as current behaviour).
