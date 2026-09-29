# Nano Protein Ice Cream — Storefront

Next.js storefront for a fictional protein ice cream brand: an animated landing
page, a catalog, a cart, order history and an admin panel. It consumes a Spring
Boot API that lives in a separate repository:
<https://github.com/DanielNed11/ice-cream>

Live at <https://icecream.danielnedyalkov.dev>

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Motion | Framer Motion |
| Auth | JWT access tokens held in memory, rotating refresh tokens |
| Hosting | Vercel |

## What it does

**Storefront** — a landing page that opens on a randomly chosen flavour, a shop
that reads live stock from the API, a cart, and checkout.

**Account** — registration, sign in, and an order history with per-order detail
and customer cancellation.

**Admin** — order analytics with status and date filtering, and a streamed
`.xlsx` export. Superadmins additionally get product management. Both panels are
hidden from customers, though the real protection is the API returning 403; the
client-side guard only decides what to render.

**Session handling** — `lib/api/client.ts` wraps every request. A 401 triggers a
single-flight refresh, replays the original request, and emits a session-expired
event if the refresh itself fails, so a burst of parallel requests produces one
refresh rather than a stampede.

## Running it locally

Requires Node 20+ and the API running on port 8080.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then <http://localhost:3000>.

### Environment

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:8080` |

`NEXT_PUBLIC_*` variables are **inlined at build time**, not read at runtime.
Changing this value in Vercel has no effect until the project is redeployed —
the built bundle still contains the old one.

## Deploying

Vercel builds on push to `main`. Two things must line up with the API:

- **`NEXT_PUBLIC_API_URL`** must point at the deployed API, and the project must
  be rebuilt after it changes.
- **The API's `CORS_ALLOWED_ORIGINS`** must list this site's origin. If it does
  not, both services look healthy while the browser blocks every request — the
  failure is visible only in the console.

Adding a custom domain needs no rebuild: Vercel routes the existing deployment
to the new hostname and issues the certificate itself. Widen the API's allowed
origins *before* pointing DNS, so there is never a window where the site loads
but cannot reach the API.

## Notes on the design

- **Tokens live in `localStorage`, deliberately.** That keeps the session across
  reloads without a cookie or a server session, at the cost of being readable by
  any script running on the page. The stronger arrangement is an httpOnly
  refresh cookie the browser sends but no script can read; this is a demo, and
  the tradeoff is recorded here rather than hidden. Every read and write is
  wrapped, because a browser with site data blocked throws rather than returning
  null.
- **Routes are typed.** `typedRoutes` is enabled, so a link to a route that does
  not exist fails the build rather than the click. New routes need
  `npx next typegen` before the types catch up.
- **The navbar is transparent over the hero and solid everywhere else.** The
  landing page renders nothing until its preloader resolves, so the observed
  element does not exist at mount — a `MutationObserver` waits for it instead of
  assuming it is there.
