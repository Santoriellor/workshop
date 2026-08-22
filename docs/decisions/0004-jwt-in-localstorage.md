# 0004 — JWT stored in `localStorage`

## Status

Accepted as a recorded finding; not fixed in this refactor cycle.

## Context

The frontend stores both JWTs issued at login in `localStorage`:

```javascript
localStorage.setItem('token', response.data.access)
localStorage.setItem('refreshToken', response.data.refresh)
```

(`front/src/contexts/AuthContext.jsx:49-50`, inside `AuthProvider.login`).
The access token is then read back out of `localStorage` on every page load
(`AuthContext.jsx:29`) and attached to outgoing requests via
`setAxiosToken`.

Anything stored in `localStorage` is readable by any JavaScript running on
the page's origin — including a third-party script pulled in by a dependency,
or an attacker's payload if the app is ever vulnerable to XSS anywhere on the
`workshop.santoriello.ch` origin. Unlike a cookie, there is no way to mark a
`localStorage` entry `httpOnly`; a successful XSS attack can read both tokens
directly and exfiltrate them, giving the attacker a live session (and, once
the access token expires, a fresh one, since the refresh token is readable
too).

## Decision

This finding is recorded but not acted on in this refactor cycle. Moving the
tokens to httpOnly cookies would require CSRF protection (cookies are sent
automatically by the browser, so the backend can no longer rely on "the
caller possesses the token" as proof of intent) and a backend change to set
and read those cookies instead of returning tokens in the JSON body. Both are
out of scope for this cycle, which does not change `back/api/views.py`'s
authentication contract.

## Consequences

The current behaviour (tokens in `localStorage`) is what the characterization
phase pins, since D8 in the estate spec reserves "assert corrected behaviour
instead of pinning current behaviour" for defects this plan actually fixes,
and this one is explicitly deferred. It is carried forward in
`docs/decisions/0005-deferred-findings.md` as a candidate for a future cycle.
