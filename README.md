
# flyd-crud

Easily manage a collection of data, with persistence via ajax, using flyd.


```js
const userUpdates$ = flyd.stream()
const deleteUser$ = flyd.stream()

const userPath = u => `/users/${u.id}`

const users = flyd.crud({
  default: []
, create: {
    data$: userUpdates$
  }
, read: {
    path: '/users'
  , data$: userQuery$
  }
, update: {
    method: 'put'
  , data$: userUpdates$
  }
, delete: {
    data$: deleteUser$
  }
, any: {
    headers
  , path: userPath
  , err: formatErr
  }
})

userUpdates$({name: "Bob"}) 
users.loading$() // true
// ...
users.loading$() // false
users.data$() // -> [{name: "Bob", id: 1}]

userUpdates$({what: 'what'})
users.loading$() // true
// ...
users.loading$() // false
users.error$() // "Name is required"
users.data$() // -> [{name: "Bob", id: 1}]

```
