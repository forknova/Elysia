import './mongoose.ts';

import { Elysia } from 'elysia'
import cors from "@elysiajs/cors";
import {elysiaShopify, getShopifyGraphQLClient} from "./shopify.ts";
import {env} from "./env.ts";
import {ProductConnection} from "../shopify-gql-api.ts";

const app = new Elysia()
  .use(cors())
  .onRequest(({ request }) => {
    console.log(`[${request.method}]: ${request.url}`)
  })
  .onError(({ error }) => {
    console.error(error);
  })
  .use(elysiaShopify({
    appUrl: env('FRONTEND_URL'),
    authPath: '/auth',
    callbackPath: '/auth/callback'
  }))
  .get('/products', async (context) => {
    const client = await getShopifyGraphQLClient(context);

    const response = await client?.query<{ products: ProductConnection }>({
      data: `
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
      `
    });

    return response?.body;
  })
  .listen(8080);

export type App = typeof app;
export type AppContext = Parameters<Parameters<App['get']>[1]>[0];
