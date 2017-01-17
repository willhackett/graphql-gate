import { 
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList
} from 'graphql'
import { mapObj } from './utils'

/**
 * Primary entry function into twobyfour. Expects a twobyfour schema,
 * and converts it into a usable graphql schema.
 */
const twobyfour = config => {
  // minimum expectation is queries
  if(!config.queries || Object.keys(config.queries) === 0){
    throw new Error('twobyfour config must have a query object key set')
  }

  const schema = {
    query: new GraphQLObjectType({
      name: 'Query',
      fields: mapObj(config.queries, parseRoot)
    })
  }

  // parse mutations if available
  if(config.mutations && Object.keys(config.mutations) > 0){
    schema.mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: mapObj(config.mutations, parseRoot)
    })
  }

  return new GraphQLSchema(schema)
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

  const newType = fields ? parseType(type) : type.graphql
  return Object.assign({}, config, {
    type: required ? new GraphQLNonNull(newType) : newType
  })
}

/**
 * Validate a single value with an optional set of promise returning
 * validation functions
 */
const validateField = (value, validators = [], context) => {
  if(Array.isArray(validators)){
    // run the individual validators sequentially to ensure context caching works
    return validators.reduce((p, v) => p.then(() => v(value, context)), Promise.resolve())
  }
  // single validator
  return validators(value, context)
}

/**
 * Validate an object set of key/values, and its associated schema
 * definitions (which contain optional validator functions)
 */
const validateFields = (values, defs, context) => {
  // validate each arg in seuqential order to utilise context caching correctly
  return Object.keys(values).reduce((p, key) =>
    p.then(() => validateField(values[key], defs[key].validation, context)),
  Promise.resolve())
}

/**
 * Parse a config type, which could either be a query or a mutation.
 * The type makes no difference to the parser, as details should be on
 * the config objects.
 */
const parseRoot = config => ({
  type: parseType(config.type),
  args: mapObj(config.args || {}, parseField),
  resolve: (root, params, context) =>
    validateFields(params, config.args, context)
    .then(() => config.resolve(root, params, context))
})


export default twobyfour
