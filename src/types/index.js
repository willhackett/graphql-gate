/**
 * This types file is used, in case there needs to be multi module type
 * matching at some stage. twobyfour converts to the correct types when
 * being parsed by certain modules. It is only for scalar types currently
 */
import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean
} from 'graphql'
import GraphQLDateTime from './date'

export default {
  _id: { graphql: GraphQLID },
  _string: { graphql: GraphQLString },
  _int: { graphql: GraphQLInt },
  _float: { graphql: GraphQLFloat },
  _boolean: { graphql: GraphQLBoolean },
  _datetime: { graphql: GraphQLDateTime }
}