import {
  defaultFieldResolver
} from 'graphql'
import {
  mapObject,
  promiseChain,
  getMatchingKeys
} from './utils'
import debugCreator from 'debug'

const debug = debugCreator('twobyfour')

// cache used so that we don't rebuild the same type twice
let typeCache = {}

// given an object, and keys, build a resolve chain for the matching key values
const buildResolveChain = (field, keys) => {
  const matchedKeys = getMatchingKeys(field, keys)
  if(matchedKeys.length <= 0){ return }

  return (root, args, context, info) => promiseChain(matchedKeys, key =>
    promiseChain(field[key], (fn, res) => fn(root, args, context, info, res)))
}

// Given an object and set of possible matching keys
// return a new array of all concatenated items for each key.
// If only a single item is given, make it an array
const getAssociatedArgFunctions = (obj, keys) => {
  const output = []
  getMatchingKeys(obj, keys).forEach(key => {
    const funcs = obj[key]
    if(Array.isArray(funcs)){
      output.push(...funcs)
    }else{
      output.push(funcs)
    }
  })
  return output
}

const buildArgTree = (args, keys) => {
  if(!args){ return }

  const branches = {}
  Object.keys(args).forEach(argName => {
    const arg = args[argName]
    // create a functions key if applicable
    const functions = getAssociatedArgFunctions(arg, keys)
    // create a children key if applicable
    const children = buildArgTree(arg.type._fields, keys)

    if(functions.length > 0 || children){
      const key = {}
      if(functions.length > 0){ key.functions = functions }
      if(children){ key.children = children }

      branches[argName] = key
    }
  })

  if(Object.keys(branches).length > 0){
    return branches
  }
}

const runArgTree = (tree, root, args, context, info) => {
  return Object.keys(tree).reduce((p, argName) => {
    // only process arg if it was provided to the query
    if(args[argName]){
      const arg = tree[argName]
      if(arg.functions){
        p = p.then(promiseChain(arg.functions, fn => fn(root, args, context, { ...info, argName })))
      }
      if(arg.children){
        p.then(runArgTree(arg.children, root, args[argName], context, info))
      }
    }
  }, Promise.resolve())
}

// build a promise chain for an argument object if required (keys found)
const buildArgChain = (args, keys) => {
  const tree = buildArgTree(args, keys)
  if(!tree){ return }

  return (root, args, context, info) => runArgTree(tree, root, args, context, info)
}

const processField = (name, field, parsedField, config) => {
  debug(`field - ${name}`)

  // attempt to get an arg promise chain
  const argChain = buildArgChain(field.args, config.args)

  // attempt to get a pre/post chain
  const preChain = buildResolveChain(field, config.pre)
  const postChain = buildResolveChain(field, config.post)

  // if any of the chains are relevant replace the current resolver
  if(argChain || preChain || postChain){
    debug(`Processing keys found for field: ${name}`)
    const primaryResolver = field.resolve || defaultFieldResolver
    parsedField.resolve = (root, args, context, info) => {
      return Promise.resolve()
        .then(() => argChain ? argChain(root, args, context, info) : null)
        .then(() => preChain ? preChain(root, args, context, info) : null)
        .then(() => primaryResolver(root, args, context, info))
        .then(primaryResult => {
          // run the post chain async to the reply
          if(postChain) { postChain(root, args, context, info) }

          return primaryResult
        })
    }
  }

  // if there are return types on the field, build any resolvers for these
  // types as well
  if(field.type && field.type._fields){
    processType(field.type, config)
  }
}

const processType = (type, config) => {
  if(!type || typeCache[type.name]){ return }
  typeCache[type.name] = true

  const fields = type._typeConfig.fields
  const parsedFields = type._fields
  if(!fields) { return }

  debug(`--- processing fields for type: ${type.name}`)
  Object.keys(fields).forEach(field => processField(field, fields[field], parsedFields[field], config))
}

const twobyfour = (schema, config) => {
  typeCache = {}
  // process both the query and mutation type if they exist
  processType(schema._queryType, config)
  processType(schema._mutationType, config)

  // return the original schema (which has been updated)
  return schema
}

export default twobyfour
