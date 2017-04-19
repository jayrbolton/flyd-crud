var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var R = require('ramda');
var flyd = require('flyd');
var request = require('flyd-ajax');
var flatMap = require('flyd/module/flatmap');
var filter = require('flyd/module/filter');
var mergeAll = require('flyd/module/mergeall');

function crud(options) {
  var any = R.merge({
    err: function (response) {
      return String(response.body);
    },
    headers: {}
  }, options.any || {});

  var create = R.merge({
    params$: flyd.stream(),
    method: 'post',
    path: ''
  }, R.merge(any, options.create || {}));

  var read = R.merge({
    method: 'get',
    path: '',
    params$: flyd.stream()
  }, R.merge(any, options.read || {}));

  var update = R.merge({
    method: 'patch',
    path: '',
    params$: flyd.stream()
  }, R.merge(any, options.update || {}));

  var del = R.merge({
    method: 'delete',
    path: '',
    params$: flyd.stream()
  }, R.merge(any, options.delete || {}));

  var _makeRequest = makeRequest(create, create.params$),
      _makeRequest2 = _slicedToArray(_makeRequest, 2),
      createOk$ = _makeRequest2[0],
      createErr$ = _makeRequest2[1];

  var _makeRequest3 = makeRequest(update, update.params$),
      _makeRequest4 = _slicedToArray(_makeRequest3, 2),
      updateOk$ = _makeRequest4[0],
      updateErr$ = _makeRequest4[1];

  var _makeRequest5 = makeRequest(del, del.params$),
      _makeRequest6 = _slicedToArray(_makeRequest5, 2),
      deleteOk$ = _makeRequest6[0],
      deleteErr$ = _makeRequest6[1];

  // Read on read.data$, deleteOk$, updateOk$, and createOk$


  var readOn$ = mergeAll([read.params$, deleteOk$, updateOk$, createOk$]);
  // Stream of read data for the request
  var readParams$ = flyd.map(function () {
    return read.params$();
  }, readOn$);

  var _makeRequest7 = makeRequest(read, readParams$),
      _makeRequest8 = _slicedToArray(_makeRequest7, 2),
      readOk$ = _makeRequest8[0],
      readErr$ = _makeRequest8[1];

  var data$ = flyd.merge(flyd.stream(options.default || []), flyd.map(R.prop('body'), readOk$));

  var loading$ = mergeAll([flyd.map(R.always(true), create.params$), flyd.map(R.always(true), update.params$), flyd.map(R.always(true), del.params$), flyd.map(R.always(false), createErr$), flyd.map(R.always(false), updateErr$), flyd.map(R.always(false), deleteErr$), flyd.map(R.always(false), data$)]);

  return {
    loading$: loading$,
    data$: data$,
    readErr$: readErr$, createErr$: createErr$, updateErr$: updateErr$, deleteErr$: deleteErr$
  };
}

function makeRequest(options, params$) {
  var req = function (params) {
    var _request;

    var payloadKey = options.method === 'get' ? 'query' : 'send';
    var path = typeof options.path === 'function' ? options.path(params) : options.path;
    if (options.defaultParams) params = R.merge(options.defaultParams, params);
    return request((_request = {
      method: options.method
    }, _defineProperty(_request, payloadKey, params), _defineProperty(_request, 'headers', options.headers), _defineProperty(_request, 'path', path), _defineProperty(_request, 'url', options.url), _request)).load;
  };
  var resp$ = flatMap(req, params$);
  if (options.method === 'delete') {
    flyd.map(function (r) {
      return console.log({ r: r });
    }, resp$);
  }
  var ok$ = filter(function (r) {
    return r.status === 200;
  }, resp$);
  var err$ = filter(function (r) {
    return r.status !== 200;
  }, resp$);
  return [ok$, err$];
}

module.exports = crud;

