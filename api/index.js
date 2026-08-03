// Vercel Serverless Function — entry point for all /api/* requests.
// Uses CommonJS (no "type":"module" at root) so Vercel's Node.js runtime
// can import it without an ESM loader flag.
//
// Strategy: compile the TypeScript server to server/dist/ as part of the
// Vercel build step, then require() the compiled output here.
// The pool is initialised lazily on the first request and reused across
// warm invocations within the same function instance.

const path = require('path')

// Resolve the compiled server entry relative to this file's location.
// After `tsc` the output lands at server/dist/index.js.
const serverDistPath = path.join(__dirname, '..', 'server', 'dist', 'index.js')

let appPromise = null

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      // Dynamic import works for both CJS and ESM compiled output.
      const mod = await import(serverDistPath)

      const { app, initPool } = mod

      // Initialise the pool once per function instance (warm start reuse).
      await initPool()

      return app
    })()
  }
  return appPromise
}

// Vercel calls this export for every incoming request.
module.exports = async (req, res) => {
  try {
    const app = await getApp()
    app(req, res)
  } catch (err) {
    console.error('[Serverless] Fatal init error:', err)
    res.status(500).json({ error: 'Server initialisation failed' })
  }
}
