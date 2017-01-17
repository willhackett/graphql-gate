
/**
 * Perform an Array.map like function on an object
 */
const mapObj = (o, f, ctx) => {
  ctx = ctx || this
  var result = {}
  Object.keys(o).forEach(k => {
    result[k] = f.call(ctx, o[k], k, o);
  })
  return result
}

export {
  mapObj
}