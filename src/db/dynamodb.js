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
const getResource = (params, context) => {
  return docClient.get(params).promise().then(result => {
    return result.Item ? result.Item : Promise.reject(new Error('(getResource): Resource could not be found'))
  })
}

/**
 * Put a resource in the DB
 * The params given match graphql's param object layout and context
 */
const putResource = (params, context) => {
  return docClient.put(params).promise()
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
  getResource,
  putResource
}
