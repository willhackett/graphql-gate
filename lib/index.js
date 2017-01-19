/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Types = undefined;

	var _twobyfour = __webpack_require__(1);

	var _twobyfour2 = _interopRequireDefault(_twobyfour);

	var _types = __webpack_require__(4);

	var _types2 = _interopRequireDefault(_types);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.Types = _types2.default;
	exports.default = _twobyfour2.default;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _graphql = __webpack_require__(2);

	var _utils = __webpack_require__(3);

	/**
	 * Primary entry function into twobyfour. Expects a twobyfour schema,
	 * and converts it into a usable graphql schema.
	 */
	var twobyfour = function twobyfour(config) {
	  // minimum expectation is queries
	  if (!config.queries || Object.keys(config.queries) === 0) {
	    throw new Error('twobyfour config must have a query object key set');
	  }

	  var schema = {
	    query: new _graphql.GraphQLObjectType({
	      name: 'Query',
	      fields: (0, _utils.mapObj)(config.queries, parseRoot)
	    })
	  };

	  // parse mutations if available
	  if (config.mutations && Object.keys(config.mutations).length > 0) {
	    schema.mutation = new _graphql.GraphQLObjectType({
	      name: 'Mutation',
	      fields: (0, _utils.mapObj)(config.mutations, parseRoot)
	    });
	  }

	  return new _graphql.GraphQLSchema(schema);
	};

	// cache to hold the requested and parsed types
	var typeCache = {};

	/**
	 * Parse a field set with a name, and whether or not
	 * it is an input type
	 */
	var parseType = function parseType(config) {
	  var name = config.name,
	      fields = config.fields;

	  // return cached type if available

	  if (typeCache[name]) {
	    return typeCache[name];
	  }

	  var _config = Object.assign({}, config, {
	    fields: (0, _utils.mapObj)(fields, parseField)
	  });

	  // set cache and return the correct object
	  return typeCache[name] = config.input ? new _graphql.GraphQLInputObjectType(_config) : new _graphql.GraphQLObjectType(_config);
	};

	/**
	 * Parse a list type field
	 */
	var parseList = function parseList(config) {
	  return Object.assign({}, config, {
	    type: new _graphql.GraphQLList(parseType(config))
	  });
	};

	/**
	 * Parse an individual field of a type
	 * It will recursively traverse the tree in the same manner
	 * as graphql, but wrapping with extra requirements
	 */
	var parseField = function parseField(config) {
	  var list = config.list,
	      fields = config.fields,
	      required = config.required,
	      type = config.type;


	  if (list) {
	    return parseList(type);
	  }

	  var newType = fields ? parseType(config) : type.graphql;
	  return Object.assign({}, config, {
	    type: required ? new _graphql.GraphQLNonNull(newType) : newType
	  });
	};

	/**
	 * Validate a single value with an optional set of promise returning
	 * validation functions
	 */
	var validateField = function validateField(key, value) {
	  var validators = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
	  var context = arguments[3];

	  if (Array.isArray(validators)) {
	    // run the individual validators sequentially to ensure context caching works
	    return validators.reduce(function (p, v) {
	      return p.then(function () {
	        return v(key, value, context);
	      });
	    }, Promise.resolve());
	  }
	  // single validator
	  return validators(key, value, context);
	};

	/**
	 * Validate an object set of key/values, and its associated schema
	 * definitions (which contain optional validator functions)
	 */
	var validateFields = function validateFields(values, defs, context) {
	  // validate each arg in sequential order to utilise context caching correctly
	  return Object.keys(values).reduce(function (p, key) {
	    return p.then(function () {
	      var val = values[key];
	      var itemValidated = validateField(key, values[key], defs[key].validators, context);

	      // TODO: add support for array arg types

	      // deal with nested arg types
	      if ((0, _utils.isObjectWithKeys)(val)) {
	        return itemValidated.then(function () {
	          return validateFields(val, defs[key].fields);
	        });
	      }
	      return itemValidated;
	    });
	  }, Promise.resolve());
	};

	/**
	 * Parse a config type, which could either be a query or a mutation.
	 * The type makes no difference to the parser, as details should be on
	 * the config objects.
	 */
	var parseRoot = function parseRoot(config) {
	  return {
	    type: parseType(config.type),
	    args: (0, _utils.mapObj)(config.args || {}, parseField),
	    resolve: function resolve(root, params, context) {
	      return validateFields(params, config.args, context).then(function () {
	        return config.resolve(root, params, context);
	      });
	    }
	  };
	};

	exports.default = twobyfour;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("graphql");

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/**
	 * Perform an Array.map like function on an object
	 */
	var mapObj = function mapObj(o, f, ctx) {
	  ctx = ctx || undefined;
	  var result = {};
	  Object.keys(o).forEach(function (k) {
	    result[k] = f.call(ctx, o[k], k, o);
	  });
	  return result;
	};

	/**
	 * Check if a variable is an object with keys
	 */
	var isObjectWithKeys = function isObjectWithKeys(value) {
	  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && Object.keys(value).length > 0;
	};

	exports.mapObj = mapObj;
	exports.isObjectWithKeys = isObjectWithKeys;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _graphql = __webpack_require__(2);

	exports.default = {
	  String: { graphql: _graphql.GraphQLString },
	  Int: { graphql: _graphql.GraphQLInt },
	  Float: { graphql: _graphql.GraphQLFloat },
	  Boolean: { graphql: _graphql.GraphQLBoolean },
	  ID: { graphql: _graphql.GraphQLID }
	}; /**
	    * This types file is used, in case there needs to be multi module type
	    * matching at some stage. Grambda converts to the correct types when
	    * being parsed by certain modules. It is only for scalar types currently
	    */

/***/ }
/******/ ]);