# 0002 — Permission baseline

## Status

Partially implemented. The specific defect described below has already been
fixed and deployed, ahead of this refactor cycle. The general pattern change
(every viewset declaring its own permissions explicitly, public access
granted per-action) is implemented by a later task in this cycle (Task 7 of
the `2026-08-22-workshop-refactor` plan).

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

Later tasks in this refactor cycle apply this pattern consistently and add a
characterization test asserting the corrected boundary for every viewset (per
Spec D8, since this is a security-motivated behaviour change, it is asserted
as corrected behaviour, not pinned as current behaviour).
