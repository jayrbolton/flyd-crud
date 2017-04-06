const assert = require('assert')
const flyd = require('flyd')
const crud = require('../index.js')
const uuid = require('uuid')
const request = require('flyd-ajax')
const R = require('ramda')

suite('crud')

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
    create: { data$: create$ }
  , read: { data$: read$ }
  , update: { data$: update$ , method: 'post', path: '/users/update' }
  , delete: { data$: delete$, method: 'post', path: '/users/delete' }
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
  assert.deepEqual(users.data$(), [{name: "Initial"}])
  done()
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
    const data = users.data$()
    assert.deepEqual(data, [{name: 'Initial', id: 0}, userA_modified])
    done()
  }, 1000)
})

