import './mongoose.ts';

import { Elysia, t } from 'elysia'
import cors from "@elysiajs/cors";
import {elysiaShopify} from "./shopify.ts";
import {ProductConnection} from "../shopify-gql-api.ts";
import {env} from "./env.ts";

const app = new Elysia()
  .use(cors())
  .use(elysiaShopify({
    authPath: '/auth',
    callbackPath: '/auth/callback'
  }))
  .get('/products', async (context) => {
    const { shopify } = context;

    return await shopify.graphql.admin<{ products: ProductConnection }>(`
      #graphql
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `);
  })
  .post('/something', () => {
    return { wow: true }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })
  .listen(parseInt(env('BACKEND_PORT')));

export type App = typeof app;
