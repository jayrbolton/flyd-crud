var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var R = require('ramda');
var flyd = require('flyd');
var request = require('flyd-ajax');
flatMap = require('flyd/module/flatmap');

function crud(options) {
  var any = R.merge({
    err: function (response) {
      return String(response.body);
    },
    headers: {}
  }, options.any || {});

  var create = R.merge({
    data$: flyd.stream(),
    method: 'post',
    path: ''
  }, R.merge(any, options.create || {}));

  var read = R.merge({
    method: 'get',
    path: '',
    data$: flyd.stream()
  }, R.merge(any, options.read || {}));

  var update = R.merge({
    method: 'patch',
    path: '',
    data$: flyd.stream()
  }, R.merge(any, options.update || {}));

  var del = R.merge({
    method: 'delete',
    path: '',
    data$: flyd.stream()
  }, R.merge(any, options.delete || {}));

  var _flatMap = flatMap(makeRequest(create), create.data$),
      _flatMap2 = _slicedToArray(_flatMap, 2),
      createOk$ = _flatMap2[0],
      createErr$ = _flatMap2[1];

  var _flatMap3 = flatMap(makeRequest(update), update.data$),
      _flatMap4 = _slicedToArray(_flatMap3, 2),
      updateOk$ = _flatMap4[0],
      updateErr$ = _flatMap4[1];

  var _flatMap5 = flatMap(makeRequest(del), del.data$),
      _flatMap6 = _slicedToArray(_flatMap5, 2),
      deleteOk$ = _flatMap6[0],
      deleteErr$ = _flatMap6[1];

  // Read on read.data$, deleteOk$, updateOk$, and createOk$


  var readOn$ = flyd.mergeAll([read.data$, deleteOk$, updateOk$, createOk$]);
  // Stream of read data for the request
  var readData$ = flyd.map(function () {
    return read.data$();
  }, readOn$);

  var _flatMap7 = flatMap(makeRequest(read), readData$),
      _flatMap8 = _slicedToArray(_flatMap7, 2),
      readOk$ = _flatMap8[0],
      readErr$ = _flatMap8[1];

  var data$ = flyd.merge(flyd.stream(options.default || []), flyd.map(R.prop('body'), readOk$));

  var loading$ = flyd.mergeAll([flyd.map(R.always(true), create.data$), flyd.map(R.always(true), update.data$), flyd.map(R.always(true), del.data$), flyd.map(R.always(false), createErr$), flyd.map(R.always(false), updateErr$), flyd.map(R.always(false), deleteErr$), flyd.map(R.always(false), data$)]);

  return {
    loading$: loading$,
    data$: data$,
    readErr$: readErr$, createErr$: createErr$, updateErr$: updateErr$, deleteErr$: deleteErr$
  };
}

var makeRequest = R.curryN(2, function (options, data) {
  var _request;

  var payloadKey = options.method === 'get' ? 'query' : 'send';
  var path = typeof options.path === 'function' ? options.path(data) : options.path;

  var resp$ = request((_request = {
    method: options.method
  }, _defineProperty(_request, payloadKey, data), _defineProperty(_request, 'headers', options.headers), _defineProperty(_request, 'path', path), _defineProperty(_request, 'url', options.url), _request)).load;

  var ok$ = flyd.filter(function (r) {
    return r.status === 200;
  }, resp$);
  var err$ = flyd.filter(function (r) {
    return r.status !== 200;
  }, resp$);

  return [ok$, err$];
});

module.exports = crud;

