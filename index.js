const R = require('ramda')
const flyd = require('flyd')
const request = require('flyd-ajax')

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

  const [createResp$, createOk$, createErr$] = flyd.flatMap(makeRequest(create), create.data$)
  const [updateResp$, updateOk$, updateErr$] = flyd.flatMap(makeRequest(update), update.data$)
  const [deleteResp$, deleteOk$, deleteErr$] = flyd.flatMap(makeRequest(del), del.data$)

  // Read on read.data$, deleteOk$, updateOk$, and createOk$
  const readOn$ = flyd.mergeAll([read.data$, deleteOk$, updateOk$, createOk$])
  // Stream of read data for the request
  const readData$ = flyd.map(()=> read.data$(), readOn$)
  const [readResp$, readOk$, readErr$] = flyd.flatMap(makeRequest(read), readData$)

  const loading$ = flyd.mergeAll([
    flyd.map(R.always(true), create.data$)
  , flyd.map(R.always(true), update.data$)
  , flyd.map(R.always(true), del.data$)
  , flyd.map(R.always(false), createErr$)
  , flyd.map(R.always(false), updateErr$)
  , flyd.map(R.always(false), deleteErr$)
  , flyd.map(R.always(false), readOk$)
  ])

  const data$ = flyd.scanMerge([
    [createOk$, appendData]
  , [updateOk$, updateData]
  , [deleteOk$, deleteData]
  ], options.default || [])
  
  return {
    loading$
  , data$
  , readErr$, createErr$, updateErr$, deleteErr$
  }
}

const makeRequest = R.curryN(2, (options, data) => {
  const payloadKey = options.method === 'get' ? 'query' : 'send'
  const path = typeof options.path === 'function' ? options.path(data) : options.path

  return request({
    method: options.method
  , [payloadKey]: data
  , headers: options.headers
  , path
  }).load
})

function appendData(rows, row) {
}

function updateData(rows, row) {
}

function deleteData(rows, row) {
}

module.exports = crud
