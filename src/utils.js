
/**
 * Perform an Array.map like function on an object
 */
const mapObj = (o, f, ctx) => {
  ctx = ctx || this
  var result = {}
  Object.keys(o).forEach(k => {
    result[k] = f.call(ctx, o[k], k, o)
  })
  return result
}

/**
 * Check if a variable is an object with keys
 */
const isObjectWithKeys = value => {
  return typeof value === 'object' && Object.keys(value).length > 0
}

/**
 * Shorthand for chaining promise work sequentially
 */
const pChain = (arr, fn) => arr.reduce((a, b) =>
  a.then(() => fn(b)), Promise.resolve())

export {
  mapObj,
  isObjectWithKeys,
  pChain
}
