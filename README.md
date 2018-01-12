![graphql-gate](https://www.willhackett.com/img/gate_logo.png)

[![npm version](https://badge.fury.io/js/graphql-gate.svg)](https://badge.fury.io/js/graphql-gate)
[![CircleCI](https://circleci.com/gh/willhackett/graphql-gate/tree/master.svg?style=svg)](https://circleci.com/gh/willhackett/graphql-gate/tree/master)

GraphQL expects all logic to exist inside resolve functions. This means validators, permissions, analytics or other additional business logic must be inside a resolve function.

GraphQL Gate allows you to apply this logic as fields on top of your existing schema. GraphQL Gate is a schema wrapper that allows you to decorate fields with instructions that are automatically wrapped around your primary resolve. GraphQL Gate automatically walks the schema tree, looking for the appropriate decorators and updates the resolve functions automatically.

## Installation

```javascript
gate(schema, config)

```

Being agnostic of all business logic, graphql expects you to put everything inside the resolve functions. This means validation, permissions, analytics, business logic, etc. We wanted to put these things right next to the appropriate fields, so they are easier to understand and act on. So gate is a graphql schema wrapper that allows you to decorate any field with functions that will be wrapped around your primary resolve (including managing arguments). It automatically walks the schema tree, looking for the appropriate decorators and updates the resolve functions automagically. There is an example below.

## Installation

```npm install gate --save```

## Usage
```javascript
const schema = gate(GraphQLSchema, GraphQLGateConfig)
/*
    GraphQLSchema - A regular GraphQL Schema, with fields decorated according to the config
    GraphQLGateConfig - config objects specifying decorator names and when they apply
*/
```

**Config**

The configuration object contains an array of decorator names for three possible types. These names will be used to lookup fields inside the schema.

    - `args:` promise chains that are run before all others for any given arguments.
    - `pre:` promise chains that are run before the primary resolve function.
    - `post:` promise chains that are run after the primary resolve function.

 *(Important Note: `post` resolvers are run asynchronously after the return of the primary resolve. This was so that post resolvers don't delay any reply to a client. This is useful for analytics or post-response logic that doesn't require the user to wait for a response.)*

**Resolvers**

Based on the list of resolvers added to the config, either a single function or an array of functions can be used to decorate any field in place of the `resolve` argument.

For example: the key `validators` exists in the `args` decorator list which you use to validate an string input.

```javascript
args: {
  my_arg: {
    type: GraphQLString,
    validators: [isLength(1, 50), matches(/^[\w\d]+(?:-[\w\d]+)*$/)]
```

In the example above, `isLength` and `matches` are both higher order functions that return functions that match the regular graphql resolve pattern `resolve(root, args, context, info)`.

*NOTE: Argument resolvers are slightly different in that they also include the current argument name as the key `arg` on the `info` object parameter.*

## Example

Imagine you had the following basic type/query in graphql:

```javascript:
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        args: {
          myArg: {
            type: GraphQLString
          }
        },
        type: GraphQLString,
        resolve() {
          // ... return some string
          return 'I am the result'
        }
      }
    }
  })
})
```
Now let's say you want to put validation on the argument, like a regex match or length check, and put permissions on the query itself. Normally you would need to put all this work in the resolve function of the query, but now you can do the following in gate:

```
const schema = gate(new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        args: {
          myArg: {
            type: GraphQLString,
            validators: [isLength(1, 50), matches(/^[\w\d]+(?:-[\w\d]+)*$/)]
          }
        }
        type: GraphQLString,
        permissions: isAdmin,
        resolve() {
          // ... return some string
          return 'I am the result'
        }
      }
    }
  })
}), {
  args: ['validators'],
  pre: ['permissions']
})
```

This might look a little magic, but here is how it works.

1. Define your schema as per usual, but decorate any field with a function or array of functions that match the same interface as the regular graphql resolve function. For example:
```
const isLength = (min, max) => (root, args, context, info) => {
  // arguments get their name put on the info object
  const arg = args[info.arg]
  if(arg.length < min || arg.length > max){
    return Promise.reject(new Error('String is an invalid length'))
  }
}

// on an argument field
hello: {
  args: {
    myArg: {
      type: GraphQLString,
      validators: isLength(5, 10)
    }
  }
}
```

2. Wrap your graphql schema in `gate()`, passing in a config object detailing to gate which words represent decorators to be run at which time in the resolve lifecycle. For example:
```
gate(mySchema, {
  args: ['validators'] // tell gate to look for the 'validators' decorator on any arguments
})
```

## Extras

Included in gate are promise chain helpers. For now it is just `or()`. This allows you to allow a logical or in your promise chain. For example:

```
import { or } from gate
...
// inside your type/query/mutation
args: {
  test: {
    validators: [or(isAdmin, someOtherPermissionFunction)]
```
This causes the promise chain to fulfill if any of the given promises are resolved.
