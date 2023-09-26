# Elysia Shopify App Template

The app is a SPA designed to integrate with Shopify.

## This is not production ready

While it may work, I can't recommend production usage. This is relatively bare-bones, but there are some things that work:

- Installation flow
- Billing
- Shopify Admin GQL API queries
- Shopify app bridge
- Shopify CLI integration

## Stack

- Bun (of course)
- Elysia
- MongoDB w/ Typegoose
- Vite

## Get stated

1. Clone the repo
2. `cd client`
3. `bun install`
4. Run `bun install` in both `web/client` and `web/server`
5. Copy and paste `.env.example` to `.env` in both `web/client` and `web/server`, filling out applicable variables
6. Run `bun dev` in the project root which will invoke the Shopify CLI

## Notes

**Server:**

- The `elysiaShopify` plugin uses `derive` to provide a `shop` and `session` object for your routes

**Client:**

- There's a `useEden` hook to make dispatching requests to your API easier to work with in your React components