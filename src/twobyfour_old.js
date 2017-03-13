import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  defaultFieldResolver
} from 'graphql'
import {
  mapObject,
  promiseChain,
  hasKeys
} from './utils'

/**
 * Given a schema object, and a set of keys, build a promise chain
 * that runs each function array for each found key, passing in the
 * usual graphql resolve parameters
 */
const keyChain = (schema, keys, root, args, context, info) =>
  promiseChain(keys, key => schema[key] ?
    promiseChain(schema[key], (fn, res) => fn(root, args, context, info, res)) :
    Promise.resolve()
  )

/**
 * Given a schema object, and arrays of pre/post processing keys,
 * build a single graphql resolve function that runs a pre chain
 * before the primary resolver, and a post chain after. The post
 * chain will not error the graphql call on rejection, and will only
 * log a rejection result. This is because the resolver has already
 * been successful and thus should return to the user
 */
const buildResolve = (schema, _args, _pre, _post) => (root, args, context, info) => {
  // set the primary resolve (default if not found)
  const primaryResolver = schema.resolve || defaultFieldResolver

  // process any argument chain first if available
  // args can only be part of the pre chain
  return (schema.args ?
    promiseChain(Object.keys(schema.args),
      arg => keyChain(schema.args[arg], _args, root, args, context, { ...info, arg })) :
    Promise.resolve()
  )
  // run the pre chain if applicable
  .then(() => keyChain(schema, _pre, root, args, context, info))
  // run the primary resolver
  .then(res => Promise.resolve(primaryResolver(root, args, context, info, res))
    .then(finalResult => {
      // run a post chain if applicable, but don't effect the final outcome
      keyChain(schema, _post, root, args, context, info)
      // return asynch from post chain
      return finalResult
    })
  )
}

/**
 * Given a field object, build chained resolve if applicable
 */
const processField = (field, { args = [], pre = [], post = [] }) => {
  // only apply the resolve builder to fields that need it
  const result = {
    ...field
  }

  // check if pre/post keys are found, or there are args and
  // they contain pre/post keys
  const argKeys = field.args ? Object.keys(field.args) : []
  if(argKeys.some(arg => hasKeys(field.args[arg], args)) ||
     hasKeys(field, pre) ||
     hasKeys(field, post)){
    // build the wrapping resolve chain
    result.resolve = buildResolve(field, args, pre, post)
  }

  return result
}

/**
 * Given a graphql type schema, return a graphql type, but with
 * the schema modified to run a resolve pre/post chain if defined
 */
const twobyfour = (type, schema, config) => {
  const output = {
    ...schema
  }

  // check if the fields object is a lazy loaded function,
  // and if so, we need to perform lazy twobyfour
  if(typeof schema.fields === "function"){
    output.fields = () => mapObject(schema.fields(), field => processField(field, config))
  }else{
    output.fields = mapObject(schema.fields, field => processField(field, config))
  }

  return new type(output)
}

export default twobyfour
