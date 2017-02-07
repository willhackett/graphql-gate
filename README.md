# twobyfour

[![npm version](https://badge.fury.io/js/twobyfour.svg)](https://badge.fury.io/js/twobyfour)
[![Build Status](https://travis-ci.org/OpenClubDev/twobyfour.svg?branch=master)](https://travis-ci.org/OpenClubDev/twobyfour?branch=master)

Being agnostic of all business logic, graphql expects you to put everything inside the resolve functions. This means validation, permissions, analytics, business logic, etc. This was annoying, so... twobyfour is a graphql type wrapper that allows you to put resolve chains on any field, argument or type. They automatically wrap the primary resolver, so you can think of it as building and attaching arbitrary promise chains around your resolve functions. It will make a lot more sense with an example, so there is one just a small scroll away.

## Installation

```npm install twobyfour```

## Usage
```
twobyfour(graphqlType, schema, config)
/*
    graphqlType - any graphql object type (eg. GraphQLObjectType)
    schema - regular graphql type schema + extra twobyfour keys
    config - config objects specifying key additions and where they apply
*/
```
**config**

There is a sample config in the example below, but basically, the config is just an object that contains an array of key strings for three possible types:
    - `args:` promise chains that are run before all others for any given arguments.
    - `pre:` promise chains that are run before the primary resolve function.
    - `post:` promise chains that are run after the primary resolve function *(Note: these resolvers are run asynchronously to the return of the primary resolve. This was so that post resolvers don't delay any reply to a client).*

**resolvers**

Say you added the key `validators` to the `args` key for the twobyfour config. To add promise chains to be run on an argument, simply add a single function or an array of functions to the key on that argument:
```
args: {
  my_arg: {
    type: GraphQLString,
    validators: [isLength(1, 50), matches(/^[\w\d]+(?:-[\w\d]+)*$/)]
```
In the example above, `isLength` and `matches` are both higher order functions that return functions that match the regular graphql resolve pattern `resolve(root, args, context, info)`.
*NOTE: Argument resolvers are slightly different in that they also include the current argument as the key `arg` on the `info` object parameter.*

## Example

Imagine you had the following basic type/query in graphql:

```
const myType = new GraphQLObjectType({
  name: 'atype',
  fields: {
    some_field: {
      type: GraphQLString
    }
  }
})

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: myType,
        resolve() {
          // ... return some data
        }
      }
    }
  })
})
```
Now let's say you want to put validation on the arguments, like a regex match or length check, and you also want to put permissions on the query. Normally you would need to put all this work in the resolve function of the query, but now you can do the following in twobyfour:

```
const myType = twobyfour(GraphQLObjectType, {
  name: 'atype',
  fields: {
    some_field: {
      type: GraphQLString,
      validators: [isLength(1, 50), matches(/^[\w\d]+(?:-[\w\d]+)*$/)]
    }
  }
})

const schema = new GraphQLSchema({
  query: twobyfour(GraphQLObjectType, {
    name: 'RootQueryType',
    fields: {
      hello: {
        type: myType,
        permissions: isAdmin,
        resolve() {
          // ... return some data
        }
      }
    }
  })
})
```

This might look a little magic, but here is what is happening.

1. Define a twobyfour config, that tells twobyfour which keys to look for on arguments or fields.
```
const config = {
  args: ['validators'],
  pre: ['permissions'],
  post: ['analytics']
}
```
2. Rather than call `new GraphQLObjectType(schema)`, you instead wrap your type in twobyfour, passing the config:
```const myType = twobyfour(GraphQLObjectType, schema, config)```
3. On your fields, queries/mutations, if those config keys are found, it will build a promise chain of all the items in the array (or just a single item), and run the chain around the primary resolve function.

4. All items inside the new key arrays get run with the exact same function definition as the primary resolver, with access to exactly the same parameters:
```myItem(root, args, context, info) { ... }```

## Wrapping twobyfour

Generally you would want a single config for all types, so the best way to do this is to create another file in your project that wraps twobyfour, putting the single config on all calls to it. For example:

```
import twobyfour from 'twobyfour'

export default (type, schema) => twobyfour(type, schema, {
  // your config details here
}
```
This way you can now just import the file above, and use twobyfour without specifying a config each time, and also have one single source of truth for the config.

## Extras

Included in twobyfour are promise chain helpers. For now it is just `or()`. This allows you to allow a logical or in your promise chain. For example:

```
import { or } from twobyfour
...
// inside your type/query/mutation
args: {
  test: {
    validators: [or(isAdmin, someOtherPermissionFunction)]
```
This causes the promise chain to fulfill if any of the given promises are resolved.
