import { GraphQLScalarType } from '/Users/mattway/repos/openclub-graphql/node_modules/graphql'

export default new GraphQLScalarType({
  name: 'DateTime',
  serialize: value => {
    if (!(value instanceof Date)) {
      // Is this how you raise a 'field error'?
      throw new Error('Field error: value is not an instance of Date')
    }
    if (isNaN(value.getTime())) {
      throw new Error('Field error: value is an invalid Date')
    }
    return value.toJSON()
  },
  parseValue: value => {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      throw new Error('Field error: value is an invalid Date')
    }
    return date
  },
  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: Can only parse strings to dates but got a: ' + ast.kind, [ast])
    }
    let result = new Date(ast.value)
    if (isNaN(result.getTime())) {
      throw new GraphQLError('Query error: Invalid date', [ast])
    }
    if (ast.value !== result.toJSON()) {
      throw new GraphQLError('Query error: Invalid date format, only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ', [ast])
    }

    return ast.value
  }
})