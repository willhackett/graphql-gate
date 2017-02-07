/**
 * Perform an Array.map like function on an object
 */
const mapObject = (o, f, ctx) => {
  ctx = ctx || this
  var result = {}
  Object.keys(o).forEach(k => result[k] = f.call(ctx, o[k], k, o))
  return result
}

/**
 * Given an array, reduce is into a synchronous promise chain.
 * Each iteration function is given an array item and the result
 * of the previous promise
 */
const promiseChain = (_arr, fn) => {
  // turn single values into array
  const arr = Array.isArray(_arr) ? _arr : [_arr]
  // run a reduce chain of promises
  return arr.reduce((p, item) => p.then(result => fn(item, result)), Promise.resolve())
}

/**
 * Given an object and an array of keys, return true
 * if the object contains ANY of the keys
 */
const hasKeys = (obj = {}, keys = []) => keys.some(key => obj[key])

export {
  mapObject,
  promiseChain,
  hasKeys
}
