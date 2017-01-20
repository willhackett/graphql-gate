import { 
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList
} from '/Users/mattway/repos/openclub-graphql/node_modules/graphql'
import { mapObj, isObjectWithKeys, pChain } from './utils'

/**
 * Default config (in check order)
 */
const defaultConfig = [
  {
    name: 'validators',
    args: true
  },
  {
    name: 'permissions',
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

  // check for a scalar graphql type
  if(config.graphql){ return config.graphql }

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
 * Parse an individual field of a type
 * It will recursively traverse the tree in the same manner
 * as graphql, but wrapping with extra requirements
 */
const parseField = config => {
  const { list, required, type } = config

  let childType = parseType(type)

  if(required){
    childType = new GraphQLNonNull(childType)
  }

  if(list){
    childType = new GraphQLList(childType)
  }

  return Object.assign({}, config, {
    type: childType
  })
}

/**
 * Run arbitrary functor against a single field
 * validation functions
 */
const functorField = (key, value, functors = [], context, info) => {
  if(Array.isArray(functors)){
    // run the individual functors sequentially to ensure context caching works
    return pChain(functors, v => v(key, value, context, info))
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
  return pChain(Object.keys(values), key => {
    const val = values[key]
    const functorRan = functorField(key, values[key], defs[key][name], context, info)

    // TODO: add support for array child types

    // deal with nested value types (TODO: this might belong in functorField())
    if(isObjectWithKeys(val)){
      return functorRan.then(() => functorFields(name, val, defs[key].type.fields, context, info))
    }
    return functorRan
  })
}

/**
 * Run any available generators over a schema set, updating the relevant args
 */
const runGenerators = (values, defs, context, info) => {
  return pChain(Object.keys(defs), key => {
    if(defs[key].generator){
      values[key] = defs[key].generator(values, context, info)
    }
  })
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
  resolve: (root, args, context, info) => pChain(config, cat => 
    (cat.args ? 
      functorFields(cat.name, args, proc.args, context, info) : 
        Promise.resolve())
    // TODO: use info to pass desired keys to functorFields
    /*.then(cat.read ? 
      functorFields(cat.name, type, proc.type, context, info) : 
        Promise.resolve())*/
  )  
  // run any available generators
  .then(() => runGenerators(args, proc.args, context, info))
  // run the actual resolver
  .then(() => proc.resolve(root, args, context, info))
})

export {
  defaultConfig
}

export default twobyfour
