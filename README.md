
# flyd-crud

Easily manage a collection of data, with persistence via ajax, using flyd.


```js
const userUpdates$ = flyd.stream()
const deleteUser$ = flyd.stream()

const userPath = u => `/users/${u.id}`

const users = flyd.crud({
  default: []
, create: {
    params$: userUpdates$
  }
, read: {
    path: '/users'
  , params$: userQuery$
  }
, update: {
    method: 'put'
  , params$: userUpdates$
  }
, delete: {
    params$: deleteUser$
  }
, any: {
    headers
  , path: userPath
  , err: formatErr
    // Default parameters to send in any request
    // This object will get merged with the objects from your params$ streams
  , defaultParams: {
      userID: ENV.userID
    }
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
