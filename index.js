const R = require('ramda')
const flyd = require('flyd')
const request = require('flyd-ajax')
const flatMap = require('flyd/module/flatmap')
const filter = require('flyd/module/filter')
const mergeAll = require('flyd/module/mergeall')

function crud(options) {
  const any = R.merge({
    err: response => String(response.body)
  , headers: {}
  }, options.any || {})

  const create = R.merge({
    params$: flyd.stream()
  , method: 'post'
  , path: ''
  }, R.merge(any, options.create || {}))

  const read = R.merge({
    method: 'get'
  , path: ''
  , params$: flyd.stream()
  }, R.merge(any, options.read || {}))

  const update = R.merge({
    method: 'patch'
  , path: ''
  , params$: flyd.stream()
  }, R.merge(any, options.update || {}))

  const del = R.merge({
    method: 'delete'
  , path: ''
  , params$: flyd.stream()
  }, R.merge(any, options.delete || {}))

  const [createOk$, createErr$] = makeRequest(create, create.params$)
  const [updateOk$, updateErr$] = makeRequest(update, update.params$)
  const [deleteOk$, deleteErr$] = makeRequest(del, del.params$)

  // Read on read.data$, deleteOk$, updateOk$, and createOk$
  const readOn$ = mergeAll([read.params$, deleteOk$, updateOk$, createOk$])
  // Stream of read data for the request
  const readParams$ = flyd.map(()=> read.params$(), readOn$)
  const [readOk$, readErr$] = makeRequest(read, readParams$)

  const data$ = flyd.merge(
    flyd.stream(options.default || [])
  , flyd.map(R.prop('body'), readOk$)
  )

  const loading$ = mergeAll([
    flyd.map(R.always(true), create.params$)
  , flyd.map(R.always(true), update.params$)
  , flyd.map(R.always(true), del.params$)
  , flyd.map(R.always(false), createErr$)
  , flyd.map(R.always(false), updateErr$)
  , flyd.map(R.always(false), deleteErr$)
  , flyd.map(R.always(false), data$)
  ])

  return {
    loading$
  , data$
  , readErr$, createErr$, updateErr$, deleteErr$
  }
}

function makeRequest(options, params$) {
  const req = params => {
    const payloadKey = options.method === 'get' ? 'query' : 'send'
    const path = typeof options.path === 'function' ? options.path(params) : options.path
    if(options.defaultParams) params = R.merge(options.defaultParams, params)
    return request({
      method: options.method
    , [payloadKey]: params
    , headers: options.headers
    , path
    , url: options.url
    }).load
  }
  const resp$ = flatMap(req, params$)
  if(options.method === 'delete') {
    flyd.map(r => console.log({r}), resp$)
  }
  const ok$ = filter(r => r.status === 200, resp$)
  const err$ = filter(r => r.status !== 200, resp$)
  return [ok$, err$]
}


module.exports = crud

