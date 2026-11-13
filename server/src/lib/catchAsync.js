// Express 4 does not forward rejected promises from async handlers to the
// error middleware: the request hangs and, on Node ≥ 15, the unhandled
// rejection kills the whole process (site down until Railway restarts it).
// This walks a router's stack and wraps every route handler so a rejection is
// passed to next(err) instead.

function wrap(fn) {
  if (fn.length >= 4) return fn; // error middleware, leave as-is
  return function wrapped(req, res, next) {
    try {
      const out = fn(req, res, next);
      if (out && typeof out.catch === 'function') out.catch(next);
      return out;
    } catch (err) {
      return next(err);
    }
  };
}

export function catchAsync(router) {
  for (const layer of router.stack) {
    if (layer.route) {
      for (const inner of layer.route.stack) inner.handle = wrap(inner.handle);
    } else {
      layer.handle = wrap(layer.handle);
    }
  }
  return router;
}
