import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import {
  graphql,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLList
} from 'graphql'
import twobyfour from '/src/twobyfour'

chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.should()

describe('Test twobyfour primary graphql wrapping', () => {

  const sp = sinon.spy()
  const func = val => () => sp(val)
  const failure = val => () => {
    sp(val)
    return Promise.reject(new Error('some test error'))
  }

  const testType = new GraphQLObjectType({
    name: 'testType',
    description: 'test description',
    fields: {
      testField: {
        type: GraphQLString,
        permissions: func(4)
      },
      testArray: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'arrayItemType',
          description: 'array read type description',
          fields: {
            item: {
              type: GraphQLString
            }
          }
        }))
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
        validators: [func(1), func(6)],
        other: func(7)
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
      },
      thirdArgs: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: 'customlistitem',
          fields: {
            item: {
              type: GraphQLString,
              other: func(8)
            }
          }
        }))
      }
    },
    analytics: func(5),
    resolve: (root, args) => ({
      testField: args.firstArg,
      testArray: args.thirdArgs
    })
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
    args: ['validators', 'other'],
    pre: ['permissions'],
    post: ['analytics']
  })

  it('should run all chains for a test query', () => {

    return graphql(gqSchema, `
      query {
        testQuery(firstArg: "somevalue", thirdArgs: [
          {
            item: "anitem"
          }
          {
            item: "anotheritem"
          }
        ]){
          testField,
          testArray{
            item
          }
        }
      }
    `).then(result => {
      result.should.deep.equal({
        data: {
          testQuery: {
            testField: 'somevalue',
            testArray: [
              { item: 'anitem' },
              { item: 'anotheritem' }
            ]
          }
        }
      })
      sp.callCount.should.equal(8)
      sp.firstCall.should.have.been.calledWith(1)
      sp.secondCall.should.have.been.calledWith(6)
      sp.thirdCall.should.have.been.calledWith(7)
      sp.lastCall.should.have.been.calledWith(4)
      sp.reset()
    })
  })
})
