import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema
} from 'graphql'
import twobyfour from '/src/twobyfour'

chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.should()

describe('Test twobyfour primary graphql wrapping', () => {

  const testConfig = {
    args: ['validators'],
    pre: ['permissions'],
    post: ['analytics']
  }

  const schema = {
    name: 'test',
    description: 'test description',
    fields: {
      testField: {
        type: GraphQLString
      }
    }
  }

  it('should parse a basic query type', () => {
    const type = twobyfour(GraphQLObjectType, schema, testConfig)
    type.getFields().should.have.all.keys('testField')
  })

  it('should run all chains for a test query', () => {
    const sp = sinon.spy()
    const func = val => () => sp(val)
    schema.fields.testField.permissions = func(4)
    const type = twobyfour(GraphQLObjectType, schema, testConfig)

    const query = {
      name: 'testQuery',
      description: 'test query',
      type: type,
      permissions: func(2),
      args: {
        firstArg: {
          type: GraphQLString,
          validators: func(1)
        }
      },
      analytics: func(3),
      resolve: (root, args) => ({ testField: args.firstArg })
    }

    const gqSchema = new GraphQLSchema({
      query: twobyfour(GraphQLObjectType, {
        name: 'Query',
        fields: {
          testQuery: query
        }
      }, testConfig)
    })

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
      sp.callCount.should.equal(4)
      sp.firstCall.should.have.been.calledWith(1)
      sp.secondCall.should.have.been.calledWith(2)
      sp.thirdCall.should.have.been.calledWith(3)
      sp.lastCall.should.have.been.calledWith(4)
      sp.reset()
    })
  })
})
