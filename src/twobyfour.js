import { 
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList
} from 'graphql'
import { mapObj, isObjectWithKeys } from './utils'

/**
 * Default config (in check order)
 */
const defaultConfig = [
  {
    name: validators,
    args: true
  },
  {
    name: permissions,
    args: true,
    read: true
  }
]

/**
 * Primary entry function into twobyfour. Expects a twobyfour schema,
 * and converts it into a usable graphql schema.
 */
const twobyfour = (schema, config = defaultConfig) => {
  // minimum expectation is queries
  if(!schema.queries || Object.keys(schema.queries) === 0){
    throw new Error('twobyfour config must have a query object key set')
  }

  const graphqlSchema = {
    query: new GraphQLObjectType({
      name: 'Query',
      fields: mapObj(schema.queries, query => parseRoot(query, config))
    })
  }

  // parse mutations if available
  if(schema.mutations && Object.keys(schema.mutations).length > 0){
    graphqlSchema.mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: mapObj(schema.mutations, mutation => parseRoot(mutation, config))
    })
  }

  return new GraphQLSchema(graphqlSchema)
}

// cache to hold the requested and parsed types
const typeCache = {}

/**
 * Parse a field set with a name, and whether or not
 * it is an input type
 */
const parseType = config => {
  const { name, fields } = config

  // return cached type if available
  if(typeCache[name]) { return typeCache[name] }

  const _config = Object.assign({}, config, {
    fields: mapObj(fields, parseField)
  })

  // set cache and return the correct object
  return typeCache[name] = config.input ? 
    new GraphQLInputObjectType(_config) :
    new GraphQLObjectType(_config)
}

/**
 * Parse a list type field
 */
const parseList = config => Object.assign({}, config, {
  type: new GraphQLList(parseType(config))
})

/**
 * Parse an individual field of a type
 * It will recursively traverse the tree in the same manner
 * as graphql, but wrapping with extra requirements
 */
const parseField = config => {
  const { list, fields, required, type } = config

  if(list){
    return parseList(type)
  }

  const newType = fields ? parseType(config) : type.graphql
  return Object.assign({}, config, {
    type: required ? new GraphQLNonNull(newType) : newType
  })
}

/**
 * Run arbitrary functor against a single field
 * validation functions
 */
const functorField = (key, value, functors = [], context, info) => {
  if(Array.isArray(functors)){
    // run the individual functors sequentially to ensure context caching works
    return functors.reduce((p, v) => p.then(() => v(key, value, context, info)), Promise.resolve())
  }
  // single validator
  return functors(key, value, context, info)
}

/**
 * Run arbitrary functions over a key set, if matched to a 
 * config with functions to run for that keyset
 */
const functorFields = (name, values, defs, context, info) => {
  // validate each value in sequential order to enforce chaining
  return Object.keys(values).reduce((p, key) =>
    p.then(() => {
      const val = values[key]
      const functorRan = functorField(key, values[key], defs[key][name], context, info)

      // TODO: add support for array child types

      // deal with nested value types (TODO: this might belong in functorField())
      if(isObjectWithKeys(val)){
        return functorRan.then(() => functorFields(name, val, defs[key].fields, context, info))
      }
      return functorRan
    })
  ), Promise.resolve())
}

/**
 * Run any available generators over a schema set, updating the relevant args
 */
const runGenerators = (values, defs, context, info) => {
  return Object.keys(defs).reduce((p, key) =>
    p.then(() => {
      if(defs[key].generator){
        values[key] = defs[key].generator(values, context, info)
      }
    })
  ), Promise.resolve())
}

/**
 * Parse a config type, which could either be a query or a mutation.
 * The type makes no difference to the parser, as details should be on
 * the config objects.
 */
const parseRoot = (proc, config = []) => ({
  type: parseType(proc.type),
  args: mapObj(proc.args || {}, parseField),
  // go through the config list of functor types to run
  resolve: (root, args, context, info) => config.reduce((a, b) => {
    return (b.args ? functorFields(config.name, args, proc.args, context, info) : Promise.resolve())
      .then(b.read ? functorFields(config.name, type, proc.type, context, info) : Promise.resolve())
  }, Promise.resolve())
  // run any available generators
  .then(() => runGenerators(args, proc.args, context, info))
  // run the actual resolver
  .then(() => config.resolve(root, args, context, info))
})

export {
  defaultConfig
}

export default twobyfour
