/**
 * This types file is used, in case there needs to be multi module type
 * matching at some stage. Grambda converts to the correct types when
 * being parsed by certain modules. It is only for scalar types currently
 */
import { 
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

export default {
  String: { graphql: GraphQLString },
  Int: { graphql: GraphQLInt },
  Float: { graphql: GraphQLFloat },
  Boolean: { graphql: GraphQLBoolean },
  ID: { graphql: GraphQLID }
}