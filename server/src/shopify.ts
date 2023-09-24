import '@shopify/shopify-api/adapters/web-api';

import {
  BillingError,
  BillingInterval,
  BillingReplacementBehavior,
  LATEST_API_VERSION,
  Session,
  shopifyApi
} from '@shopify/shopify-api';
import {env} from "./env.ts";
import {Elysia} from "elysia";
import {Shop, ShopModel} from "./models/Shop.ts";
import {UserError} from "../shopify-gql-api.ts";
import {AppContext} from "./index.ts";

const plans = {
  basic: {
    amount: 10,
    currencyCode: 'USD',
    interval: BillingInterval.Every30Days,
    trialDays: 7,
    replacementBehavior: BillingReplacementBehavior.ApplyOnNextBillingCycle,
  },
  pro: {
    amount: 20,
    currencyCode: 'USD',
    interval: BillingInterval.Every30Days,
    trialDays: 7,
    replacementBehavior: BillingReplacementBehavior.ApplyOnNextBillingCycle,
  }
} as const;

const ALL_PLANS = Object.keys(plans);

export const shopify = shopifyApi({
  apiKey: env('SHOPIFY_API_KEY'),
  apiSecretKey: env('SHOPIFY_API_SECRET'),
  scopes: env('SHOPIFY_API_SCOPES').split(','),
  hostName: env('HOST_NAME'),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  billing: plans
});

type ElysiaShopifyOpts = {
  /**
   * i.e. `"/app"`, `"http://localhost:5173"`, `"https://your-app.com"`
   */
  appUrl: string;

  /**
   * i.e. `"/auth"`
   */
  authPath: string;

  /**
   * i.e. `"/auth/callback"`
   */
  callbackPath: string;
}

export function elysiaShopify(opts: ElysiaShopifyOpts) {
  const { appUrl, authPath, callbackPath  } = opts;

  return new Elysia()
    .derive(async ({ headers }) => {
      const sessionToken = headers['authorization']?.replace('Bearer ', '');
      if (!sessionToken) return;

      const jwtPayload = await (async () => {
        try {
          return await shopify.session.decodeSessionToken(sessionToken);
        } catch (err) {
          console.error(err);
          return null;
        }
      })();

      if (!jwtPayload) return;

      const shopDomain = new URL(jwtPayload.dest).hostname;
      const shop = await ShopModel.findOne({ domain: shopDomain });
      if (!shop) return;

      const session = shopToSession(shop);

      return { shop, session };
    })
    .get('/', async ({ query, set }) => {
      const shopDomain = shopify.utils.sanitizeShop(query.shop || '', true)
      if (!shopDomain) {
        set.status = 400;
        return '<h1>Bad request</h1>';
      }

      const shop = await ShopModel.findOne({ domain: shopDomain });
      if (!shop) {
        const search = new URLSearchParams(query as Record<string, string>);
        set.redirect = `${authPath}?${search.toString()}`;

        return `<h1>Logging in...</h1>`;
      }

      console.log(`${shopDomain} installed, redirecting to front-end`)
      set.redirect = `${appUrl}?shop=${shopDomain}`;
    })
    .get('/auth', async ({ set, query, request }) => {
      const shop = shopify.utils.sanitizeShop(query.shop || '', true)
      if (!shop) {
        set.status = 400;
        return '<h1>Bad request</h1>';
      }

      const response = new Response();

      return await shopify.auth.begin({
        shop,
        callbackPath: callbackPath,
        isOnline: false,
        rawRequest: request,
        rawResponse: response,
      });
    })
    .get('/auth/callback', async ({ request, set }) => {
      const response = new Response();

      const callback = await shopify.auth.callback({
        rawRequest: request,
        rawResponse: response,
      });

      let shop = await ShopModel.findOne({ domain: callback.session.shop });
      const params = {
        domain: callback.session.shop,
        state: callback.session.state,
        isOnline: callback.session.isOnline,
        scope: callback.session.scope,
        expires: callback.session.expires,
        accessToken: callback.session.accessToken,
        sessionId: callback.session.id
      };

      if (!shop) {
        await ShopModel.create(params);
      } else {
        shop.set(params);
        await shop.save();
      }

      // Redirect to app
      set.redirect = await shopify.auth.getEmbeddedAppUrl({ rawRequest: request })
    })
    // Used by the front-end to verify authentication
    .get('/shop', async (context) => {
      const proceed = await ensureBilling(context, ['pro']);
      if (!proceed) return;

      return {
        domain: context.shop.domain
      }
    })
}

/**
 * Returns `true` if merchant has active billing, `false` if otherwise (and will redirect.)
 * @param context
 * @param plans
 */
export async function ensureBilling(context: AppContext, plans: string[] = ALL_PLANS) {
  try {
    const hasBilling = await shopify.billing.check({ plans, session: context.session })

    if (!hasBilling) {
      context.set.headers['X-Top-Redirect'] = await shopify.billing.request({ plan: plans[0], session: context.session })
      context.set.headers['access-control-expose-headers'] = 'X-Top-Redirect'
      return false;
    }
  } catch (err) {
    if (err instanceof BillingError) {
      err.errorData.forEach((userError: UserError) => console.error('[Billing Error]', userError.message));
    } else {
      console.error(err);
    }

    context.set.status = 500;
    return false;
  }

  return true;
}

type GraphqlClient = InstanceType<typeof shopify.clients.Graphql>

export async function getShopifyGraphQLClient(context: AppContext): Promise<GraphqlClient | null> {
  return new shopify.clients.Graphql({
    session: context.session
  })
}

function shopToSession(shop: Shop): Session {
  return new Session({
    ...shop.toJSON(),
    id: shop.sessionId,
    shop: shop.domain
  })
}