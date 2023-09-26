import {App} from "../../server/src";
import {edenTreaty} from "@elysiajs/eden";

export const app = edenTreaty<App>(import.meta.env.VITE_API_URL, {
  // TODO: Make fetch composers more generic, they currently only work with the way Eden dispatches requests
  // Eden always dispatches fetches with (url: string, init: RequestInit),
  // though `fetch` has a more diverse signature.
  // @ts-ignore
  fetcher: withAbortControllers(
    withShopifyAuth(
      createFetcher()
    )
  )
});

type Fetcher = (url: string, init: RequestInit) => Promise<Response | undefined>;

function createFetcher(): Fetcher {
  return (url: string, init: RequestInit) => fetch(url, init);
}

function withShopifyAuth(_fetch: Fetcher): Fetcher {
  return async (url: string, init: RequestInit) => {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    if (typeof init !== 'object') {
      throw new Error('Fetcher init must be an object');
    }

    const authHeader = `Bearer ${await shopify.idToken()}`;

    init.headers ||= {};
    (init.headers as Record<string, string>)['Authorization'] = authHeader;
    init.credentials = undefined;

    const response = await _fetch(url, init);
    if (!response) return;

    const topRedirect = response.headers.get('x-top-redirect');
    if (topRedirect) {
      window.open(topRedirect, '_top');
    }

    return response;
  }
}

const abortControllers: Record<string, AbortController> = {};

const duplicateRequestReason = 'Newer duplicate request dispatched';

function withAbortControllers(_fetch: Fetcher): Fetcher {
  return async (url: string, init: RequestInit) => {
    const requestId = `[${init.method?.toUpperCase() || 'GET'}]:${url}`;

    abortControllers[requestId]?.abort(duplicateRequestReason);
    abortControllers[requestId] = new AbortController();
    init.signal = abortControllers[requestId].signal;

    return await (async () => {
      try {
        const response = await _fetch(url, init);
        delete abortControllers[requestId];

        return response;
      } catch (err) {
        if (err == duplicateRequestReason) {
          // Aborted
        } else {
          throw err;
        }
      }
    })();
  }
}