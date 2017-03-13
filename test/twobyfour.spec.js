import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import {
  graphql,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLSchema
} from 'graphql'
import twobyfour from '/src/twobyfour'

chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.should()

describe('Test twobyfour primary graphql wrapping', () => {

  const sp = sinon.spy()
  const func = val => () => sp(val)

  const testType = new GraphQLObjectType({
    name: 'testType',
    description: 'test description',
    fields: {
      testField: {
        type: GraphQLString,
        permissions: func(4)
      }
    }
  })

  const query = {
    name: 'testQuery',
    description: 'test query',
    type: testType,
    permissions: func(3),
    args: {
      firstArg: {
        type: GraphQLString,
        validators: func(1)
      },
      secondArgs: {
        type: new GraphQLInputObjectType({
          name: 'somecustom',
          description: 'custom nested type',
          fields: {
            afield: {
              type: GraphQLString,
              validators: func(2)
            }
          }
        })
      }
    },
    analytics: func(5),
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

  it('should run all chains for a test query', () => {

    return graphql(gqSchema, `
      query {
        testQuery(firstArg: "somevalue"){
          testField
        }
      }
    `).then(result => {
      result.should.deep.equal({
        data: {
          testQuery: {
            testField: 'somevalue'
          }
        }
      })
      sp.callCount.should.equal(5)
      sp.firstCall.should.have.been.calledWith(1)
      sp.secondCall.should.have.been.calledWith(2)
      sp.thirdCall.should.have.been.calledWith(3)
      sp.lastCall.should.have.been.calledWith(5)
      sp.reset()
    })
  })
})
