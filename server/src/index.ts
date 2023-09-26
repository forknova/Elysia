import './mongoose.ts';

import { Elysia } from 'elysia'
import cors from "@elysiajs/cors";
import {elysiaShopify} from "./shopify.ts";
import {ProductConnection} from "../shopify-gql-api.ts";

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
  .listen(8080);

export type App = typeof app;
