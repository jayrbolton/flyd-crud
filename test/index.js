const assert = require('assert')
const flyd = require('flyd')
const crud = require('../index.js')
const uuid = require('uuid')
const request = require('flyd-ajax')
const R = require('ramda')

request({
  method: 'post'
, path: '/refresh'
, url: 'http://localhost:4456'
})

function init() {
  const create$ = flyd.stream()
  const read$ = flyd.stream()
  const update$ = flyd.stream()
  const delete$ = flyd.stream()
  const users = crud({
    create: { params$: create$, method: 'post', onSuccess: ['read']}
  , read:   { params$: read$, method: 'get' }
  , update: { params$: update$ , method: 'post', path: '/users/update', onSuccess: ['read'] }
  , delete: { params$: delete$, method: 'post', path: '/users/delete', onSuccess: ['read'], onFail: ['read'], onStart: ['read'] }
  , any: {
      path: '/users'
    , url: 'http://localhost:4456'
    , headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}
    }
  })
  return {
    users
  , actions: {create$, read$, update$, delete$}
  }
}

const {users, actions} = init()

test('read on pageload', done => {
  actions.read$({hi: 'hi'})
  setTimeout(() => { // XXX
    assert.deepEqual(users.body$(), [{name: "Initial", id: 0}])
    done()
  }, 500)
})

test('pageload, create, update, delete, and read', done => {

  const userA = {name: uuid.v1(), id: uuid.v1()}
  const userB = {name: uuid.v1(), id: uuid.v1()}
  const userA_modified = {name: uuid.v1(), id: userA.id}

  actions.create$(userA)
  actions.create$(userB)
  actions.update$(userA_modified)
  actions.delete$(userB)

  setTimeout(()=> {
    const data = users.body$()
    assert.deepEqual(data, [{name: 'Initial', id: 0}, userA_modified])
    done()
  }, 500)
})

