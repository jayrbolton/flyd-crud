const R = require('ramda')
const flyd = require('flyd')
flyd.filter = require('flyd/module/filter')
flyd.flatMap = require('flyd/module/flatmap')
const request = require('flyd-ajax')
const flatMap = require('flyd/module/flatmap')
const filter = require('flyd/module/filter')
const mergeAll = require('flyd/module/mergeall')

module.exports = function crud (options) {
  // merge the `any` prop into each request
  options = R.compose(
    R.map((req) => R.merge(options.any, req))
  , R.omit(['any'])
  )(options)

  const resultDefaults = {loading$: flyd.stream(), error$: flyd.stream(), body$: flyd.stream()}
  // The result object gets mutated by the setupRequests function. See comments for that function for details.
  var result = R.merge(resultDefaults, R.map(() => resultDefaults , options))
  R.mapObjIndexed((r, name) => setupRequests(name, options, result), options)

  return result
}

// This creates the response stream and filters it into success and failure streams
// All the logic here is managed imperatively by using flyd.on and pushing directly to streams
// The reason for this is that the stream logic, when using onSuccess, onFail, and onStart, was super complicated and I couldn't figure out how to do it without imperative pushing.
function setupRequests (name, options, result) {
  console.log('make for', name)
  const reqResult = result[name]
  const reqOptions = options[name]

  const path = typeof reqOptions.path === 'function' ? reqOptions.path(params) : reqOptions.path
  const payloadKey = reqOptions.method === 'get' ? 'query' : 'send'
  const resp$ = flyd.flatMap(
    (params) => request({
      method: reqOptions.method
    , [payloadKey]: params
    , headers: reqOptions.headers
    , path: path
    , url: reqOptions.url
    }).load
  , reqOptions.params$
  )
  const success$ = flyd.filter(r => r.status === 200, resp$)
  const fail$ = flyd.filter(r => r.status !== 200, resp$)

  // Imperatively loading to true
  flyd.on(
    () => {result.loading$(true); reqResult.loading$(true)}
  , reqOptions.params$
  )

  // Imperatively loading to false
  flyd.on(
    () => {result.loading$(false); reqResult.loading$(false)}
  , resp$
  )

  // Imperatively set success and failure data
  flyd.on(
    (r) => {result.body$(r.body); reqResult.body$(r.body)}
  , success$
  )
  flyd.on(
    (r) => {result.error$(r.body); reqResult.error$(r.body)}
  , fail$
  )

  // Imperatively push to onStart streams
  R.map(
    n => flyd.on(() => options[n].params$(options[n].params$()), reqOptions.params$)
  , reqOptions.onStart || []
  )

  // Imperatively push to onSuccess streams
  R.map(
    n => flyd.on(() => options[n].params$(options[n].params$()), success$)
  , reqOptions.onSuccess || []
  )

  // Imperatively push to onFail streams
  R.map(
    n => flyd.on(() => options[n].params$(options[n].params$()), fail$)
  , reqOptions.onFail || []
  )

}

