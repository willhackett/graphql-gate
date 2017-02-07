import { promiseChain } from './utils'

/**
 * This is a helper function that allows logical OR of promises within a
 * resolve promise chain. It returns a resolve fulfillment if ANY of the
 * promises in the array resolve successfully
 */
const or = fn_arr => (root, args, context, info) => {
  return new Promise((resolve, reject) => {
    let errorCount = 0
    // run each function in a chain
    // resolving the entire or if any resolve (realy exiting if so)
    promiseChain(fn_arr, fn =>
      fn(root, args, context, info).then(() => {
        // resolve the entire or as a promise resolved
        resolve()
        // reject this promise so the chain early exits
        return Promise.reject()
      })
      // if an error is caught, count them up
      .catch(err => {
        errorCount++
        if(errorCount === fn_arr.length || !Array.isArray(fn_arr)){
          reject(err)
        }
      })
    )
  })
}

export {
  or
}
