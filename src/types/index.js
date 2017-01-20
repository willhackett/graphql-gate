/**
 * This types file is used, in case there needs to be multi module type
 * matching at some stage. twobyfour converts to the correct types when
 * being parsed by certain modules. It is only for scalar types currently
 */
import { 
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'
import GraphQLDateTime from './date'

export default {
  _string: { graphql: GraphQLString },
  _int: { graphql: GraphQLInt },
  _float: { graphql: GraphQLFloat },
  _boolean: { graphql: GraphQLBoolean },
  _id: { graphql: GraphQLID },
  _datetime: { graphql: GraphQLDateTime }
}