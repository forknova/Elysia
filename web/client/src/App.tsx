import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import {useEden} from "./hooks/useEden.ts";
import {app} from "./eden.ts";

function App() {
  const { loading, dispatch } = useEden(app.something.post, {
    input: {
      username: 'test',
      password: 'asdf'
    },
    lazy: true
  });

  const { data: productsData } = useEden(app.products.get, {});

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
        <button onClick={() => dispatch()} disabled={loading}>
          {loading ? 'Posting...' : 'Post something'}
        </button>

        {productsData?.products.edges.map(({ node }) => (
          <div>
            <h1>{node.title}</h1>
          </div>
        ))}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
