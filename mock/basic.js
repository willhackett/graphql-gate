/**
 * Some simple use cases for testing
 */

 import {
   graphql,
   GraphQLObjectType,
   GraphQLInputObjectType,
   GraphQLString,
   GraphQLSchema
 } from 'graphql'
import twobyfour from '/src/twobyfour'

const dummy = val => (root, args, context, info) => {
  console.log(val)
  return Promise.resolve(val)
}

const testType = new GraphQLObjectType({
  name: 'testType',
  description: 'test description',
  fields: {
    testField: {
      type: GraphQLString,
      permissions: dummy(4)
    }
  }
})

const query = {
  name: 'testQuery',
  description: 'test query',
  type: testType,
  permissions: dummy(3),
  args: {
    firstArg: {
      type: GraphQLString,
      validators: dummy(1)
    },
    secondArgs: {
      type: new GraphQLInputObjectType({
        name: 'somecustom',
        description: 'custom nested type',
        fields: {
          afield: {
            type: GraphQLString,
            validators: dummy(2)
          }
        }
      })
    }
  },
  analytics: dummy(5),
  resolve: (root, args) => ({ testField: args.firstArg })
}

const gqSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      testQuery: query
    }
  })
})

// run twobyfour over the schema
twobyfour(gqSchema, {
  args: ['validators'],
  pre: ['permissions'],
  post: ['analytics']
})

export {
  gqSchema
}
