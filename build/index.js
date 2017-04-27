function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var R = require('ramda');
var flyd = require('flyd');
flyd.filter = require('flyd/module/filter');
flyd.flatMap = require('flyd/module/flatmap');
var request = require('flyd-ajax');
var flatMap = require('flyd/module/flatmap');
var filter = require('flyd/module/filter');
var mergeAll = require('flyd/module/mergeall');

module.exports = function crud(options) {
  // merge the `any` prop into each request
  options = R.compose(R.map(function (req) {
    return R.merge(options.any, req);
  }), R.omit(['any']))(options);

  var resultDefaults = { loading$: flyd.stream(), error$: flyd.stream(), body$: flyd.stream() };
  // The result object gets mutated by the setupRequests function. See comments for that function for details.
  var result = R.merge(resultDefaults, R.map(function () {
    return resultDefaults;
  }, options));
  R.mapObjIndexed(function (r, name) {
    return setupRequests(name, options, result);
  }, options);

  return result;
};

// This creates the response stream and filters it into success and failure streams
// All the logic here is managed imperatively by using flyd.on and pushing directly to streams
// The reason for this is that the stream logic, when using onSuccess, onFail, and onStart, was super complicated and I couldn't figure out how to do it without imperative pushing.
function setupRequests(name, options, result) {
  var reqResult = result[name];
  var reqOptions = options[name];

  var payloadKey = reqOptions.method === 'get' ? 'query' : 'send';
  var resp$ = flyd.flatMap(function (params) {
    var _request;

    return request((_request = {
      method: reqOptions.method
    }, _defineProperty(_request, payloadKey, params), _defineProperty(_request, 'headers', reqOptions.headers), _defineProperty(_request, 'path', typeof reqOptions.path === 'function' ? reqOptions.path(params) : reqOptions.path), _defineProperty(_request, 'url', reqOptions.url), _request)).load;
  }, reqOptions.params$);
  var success$ = flyd.filter(function (r) {
    return r.status === 200;
  }, resp$);
  var fail$ = flyd.filter(function (r) {
    return r.status !== 200;
  }, resp$);

  // Imperatively loading to true
  flyd.on(function () {
    result.loading$(true);reqResult.loading$(true);
  }, reqOptions.params$);

  // Imperatively loading to false
  flyd.on(function () {
    result.loading$(false);reqResult.loading$(false);
  }, resp$);

  // Imperatively set success and failure data
  flyd.on(function (r) {
    result.body$(r.body);reqResult.body$(r.body);
  }, success$);
  flyd.on(function (r) {
    result.error$(r.body);reqResult.error$(r.body);
  }, fail$);

  // Imperatively push to onStart streams
  R.map(function (n) {
    return flyd.on(function () {
      return options[n].params$(options[n].params$());
    }, reqOptions.params$);
  }, reqOptions.onStart || []);

  // Imperatively push to onSuccess streams
  R.map(function (n) {
    return flyd.on(function () {
      return options[n].params$(options[n].params$());
    }, success$);
  }, reqOptions.onSuccess || []);

  // Imperatively push to onFail streams
  R.map(function (n) {
    return flyd.on(function () {
      return options[n].params$(options[n].params$());
    }, fail$);
  }, reqOptions.onFail || []);
}

