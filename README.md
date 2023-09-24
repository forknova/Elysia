# Elysia Shopify App Template

The app is a SPA designed to integrate with Shopify.

## This is not production ready

While it may work, I can't recommend production usage. This is relatively bare-bones, but there are some things that work:

- Installation flow
- Billing
- Shopify Admin GQL API queries
- Shopify app bridge

## Stack

- Bun (of course)
- Elysia
- MongoDB w/ Typegoose
- Vite
- `@shopify/shopify-api`

## Get stated

1. Clone the repo
2. `cd client`
3. `bun install`
4. `cd ../server`
5. `bun install`
6. Fill out the appropriate environment variables in `client/.env` and `server/.env` (you'll have to copy/paste/rename the `.env.example` in each directory)
7. `cd client`
8. `bun dev`
9. Open another terminal
10. `cd server`
11. `bun start`