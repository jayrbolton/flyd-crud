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
    data$: flyd.stream()
  , method: 'post'
  , path: ''
  }, R.merge(any, options.create || {}))

  const read = R.merge({
    method: 'get'
  , path: ''
  , data$: flyd.stream()
  }, R.merge(any, options.read || {}))

  const update = R.merge({
    method: 'patch'
  , path: ''
  , data$: flyd.stream()
  }, R.merge(any, options.update || {}))

  const del = R.merge({
    method: 'delete'
  , path: ''
  , data$: flyd.stream()
  }, R.merge(any, options.delete || {}))

  const [createOk$, createErr$] = makeRequest(create, create.data$)
  const [updateOk$, updateErr$] = makeRequest(update, update.data$)
  const [deleteOk$, deleteErr$] = makeRequest(del, del.data$)

  // Read on read.data$, deleteOk$, updateOk$, and createOk$
  const readOn$ = mergeAll([read.data$, deleteOk$, updateOk$, createOk$])
  // Stream of read data for the request
  const readData$ = flyd.map(()=> read.data$(), readOn$)
  const [readOk$, readErr$] = makeRequest(read, readData$)
  
  const data$ = flyd.merge(
    flyd.stream(options.default || [])
  , flyd.map(R.prop('body'), readOk$)
  )

  const loading$ = mergeAll([
    flyd.map(R.always(true), create.data$)
  , flyd.map(R.always(true), update.data$)
  , flyd.map(R.always(true), del.data$)
  , flyd.map(R.always(false), createErr$)
  , flyd.map(R.always(false), updateErr$)
  , flyd.map(R.always(false), deleteErr$)
  , flyd.map(R.always(false), data$)
  ])

  // Make initial read on pageload
  readOn$(true)

  return {
    loading$
  , data$
  , readErr$, createErr$, updateErr$, deleteErr$
  }
}

function makeRequest(options, data$) {
  const req = data => {
    const payloadKey = options.method === 'get' ? 'query' : 'send'
    const path = typeof options.path === 'function' ? options.path(data) : options.path
    console.log({
      method: options.method
    , [payloadKey]: data
    , headers: options.headers
    , path
    , url: options.url
    })

    return request({
      method: options.method
    , [payloadKey]: data
    , headers: options.headers
    , path
    , url: options.url
    }).load
  }
  const resp$ = flatMap(req, data$)
  if(options.method === 'delete') {
    flyd.map(r => console.log({r}), resp$)
  }
  const ok$ = filter(r => r.status === 200, resp$)
  const err$ = filter(r => r.status !== 200, resp$)
  return [ok$, err$]
}


module.exports = crud

