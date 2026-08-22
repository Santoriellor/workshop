# Design

## Domain model

- **`User`** — a custom `AbstractUser` (`back/api/models.py`). `USERNAME_FIELD`
  is `email`, so email is the login credential, while `username` stays a
  required, unique field (`REQUIRED_FIELDS = ['username']`) kept for legacy
  compatibility.
- **`UserProfile`** — one-to-one with `User`. Created (and re-saved) by a
  `post_save` signal on `User` (`back/api/models.py:250-261`), so a profile
  always exists once a user exists.
- **`Owner`** — a vehicle owner: name, address, phone, optional unique email.
- **`Vehicle`** — FK to `Owner`. Brand, model, unique license plate, year.
- **`Report`** — FK to `Vehicle` and to `User` (the employee who filed it).
  Tracks the state of a service job.
- **`TaskTemplate`** — a reusable blueprint for a billable task (name,
  description, price).
- **`Task`** — joins a `TaskTemplate` to a `Report`: one line item of work
  performed on that report.
- **`Inventory`** — a stock item: name, unique reference code, category,
  quantity in stock, unit price.
- **`Part`** — joins an `Inventory` item to a `Report` (a part consumed by
  that report) and adjusts stock automatically. `Part.save()` deducts the
  used quantity from `Inventory.quantity_in_stock` (restoring the previous
  amount first if it's an update to an existing `Part`) and refuses to save
  if there isn't enough stock; `Part.delete()` restores the quantity
  (`back/api/models.py:179-217`).
- **`Invoice`** — FK to `Report`. `total_cost` is a `@property` computed on
  read from the report's tasks and parts, not a stored column — the stored
  `total_cost` column was removed in migration `0009`.

## Report lifecycle

`Report.STATUS_CHOICES` is `pending / in_progress / completed / exported`.
Reaching `exported` is the trigger that creates the `Invoice`: the check lives
in `ReportViewSet.update()` — if the status transitions to `"exported"` in
this request, `generate_invoice()` runs, creating the `Invoice` row and
writing its PDF to `MEDIA_ROOT/invoices/`. There is no other route into
invoice creation; deleting a `Report` cascades to its `Invoice` and to its
`Part` rows (which restore inventory on the way out, via `Report.delete()`
walking `part_set` first).

## Invoicing

`back/api/services/invoices.py` renders the invoice as HTML
(`api/invoice_template.html`) and converts it to PDF with WeasyPrint. Line
items come from the report's `Task` set (each priced from its
`TaskTemplate.price`) and `Part` set (each priced as
`quantity_used * unit_price`). A flat 20% VAT rate is applied per line and to
the totals. The rendered PDF is saved onto `Invoice.pdf` and served back
through the `media_volume`.

## Authentication model

Login exchanges email + password for a SimpleJWT access/refresh pair
(`LoginView` / `LoginSerializer`). Every subsequent request authenticates
with `Authorization: Bearer <access token>`; there is no session-based or
cookie-based authentication anywhere in `REST_FRAMEWORK`. See
`docs/decisions/0004-jwt-in-localstorage.md` for where the frontend keeps
those tokens.

Every authenticated user is a workshop employee, not a customer: the domain
has no concept of a user owning "their" data. An authenticated user has
access to every owner, every vehicle, every report and the full stock — there
is no per-user or per-owner row-level filtering anywhere in the codebase,
with exactly one exception: `UserProfileViewSet.get_queryset()` restricts the
`profile` endpoint to the requesting user's own `UserProfile` row
(`UserProfile.objects.filter(user=self.request.user)`). No other viewset
filters its queryset by the requesting user.

## Where the original project documentation lives

The project's original write-up and presentation materials predate this
documentation set and are kept, not discarded, in `docs/reference/`:

- `docs/reference/Projektarbeit - Anwendung dokumentation.pdf` — the original
  application documentation.
- `docs/reference/Pres1.pdf` — the original presentation slides.
- `docs/reference/pres-guide.pdf` — the presentation guide/notes.
