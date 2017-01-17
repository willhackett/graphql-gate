/**
 * Dynamodb interface implementation for twobyfour
 */

/**
 * The document client used to interface with the database
 */
let docClient
const setDoc = doc => docClient = doc

/**
 * The cache used to store resources grabbed within a single call.
 * This is so that if multiple fields/permissions/validations require the
 * same resource within a call, it will only be grabbed once
 */
let resourceCache = {}

/**
 * Clear the resource cache
 */
const clearCache = () => resourceCache = {}

/**
 * Get a resource from the DB
 * The params provided match graphql's param object layout and context
 */
const getResource = (table, params, context) => {
  // convert the params to dynamo params
  const _params = {
    Key: params,
    TableName: table
  }

  return docClient.get(_params).promise()
}

/**
 * Put a resource in the DB
 * The params given match graphql's param object layout and context
 */
const putResource = (table, params, context) => {
  // convert to dynamo params
  const _params = {
    //Item: ...,
    TableName: table
  }

  return docClient.put(_params).promise()
}

/**
 * Update a resource in the DB
 * The params given match graphq's param object layout and context
 */
const updateResource = (table, params, context) => {

}

/**
 * Delete a resource in the DB
 * The params given match graphq's param object layout and context
 */
const deleteResource = (table, params, context) => {

}

export default {
  setDoc,
  getResource
}
