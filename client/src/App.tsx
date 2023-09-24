import {useEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { edenTreaty } from '@elysiajs/eden'
import type { App } from '../../server/src'

const app = edenTreaty<App>(import.meta.env.VITE_API_URL, {
  fetcher: async (url, _init) => {
    const authHeader = `Bearer ${await shopify.idToken()}`;
    let requestInit: RequestInit | undefined;

    if (url instanceof Request) {
      url.headers.set('Authorization', authHeader);
    } else {
      requestInit = _init || { headers: {} };
      (requestInit.headers as Record<string, string>)['Authorization'] = authHeader;
    }

    if (requestInit) {
      requestInit.credentials = undefined;
    }

    const response = await fetch(url, requestInit);

    const topRedirect = response.headers.get('x-top-redirect');
    if (topRedirect) {
      window.open(topRedirect, '_top');
    }

    return response;
  }
});

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const shop = await app.shop.get();
      const products = await app.products.get();

      console.log({ shop, products });
    })();
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
