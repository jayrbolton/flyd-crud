# flyd-crud

Easily manage a ajax in your UI logic of data using event streams.

## crud({options})

`options` is an object that can contain any number of properties for each different kind of ajax request that you want. The property name is an arbitrary name you can pick (eg 'create', 'index', 'read', 'fetch', 'update', 'destroy', etc, etc). The value of each property is a set of **request options**

The only reserved property name is **any**. This allows you to set defaults for all the other requests. The properties in your **any** options will get merged into the other request options.

Request options can include these properties:

* `method`: (required) the HTTP method for this request ('get', 'patch', 'put', 'post', 'delete', etc)
* `params$`: (required) a stream of data that triggers a new ajax request, with this data being sent as JSON in the request
* `path`: (required) string path for this request, or a function that receives the data from the `params$` stream and should return a string path
* `headers`: (optional) an object of header keys and values for the request
* `url`: (optional) the base url for this request, which the path gets appended to
* `onSuccess`: (optional) give an array of string names of other requests that you want to trigger when this request completes successfully (status === 200)
* `onStart`: (optional) an array of names of other requests that you want to trigger when this request starts
* `onFail`: (optional) an array of names of other requests that you want to trigger when this request fails (status !== 200)

```js
// Stream of new user objects, maybe from some form data
const newUser$ = flyd.stream()
// A stream of user objects that we want to delete on the server
const userToDelete$ = flyd.stream()

const users = flyd.crud({
  // Options in "any" get merged into all the request below
  // Here we are setting some global headers
  any: {
    headers: {'Content-Type': 'application/json'}
  }
, create: {
    method: 'post'
  , params$: newUser$
  , path: u => `/users/${u.id}`
  , onSuccess: ['index']
  }
, index: {
    method: 'get'
  , path: '/users'
  , params$: userQuery$
  }
, delete: {
    method: 'delete'
  , params$: userToDelete$
  , path: u => `/users/delete?id=${u.id}`
  , onSuccess: ['index']
  }
})

userUpdates$({name: "Bob"}) 
users.loading$() // returns true
users.create.loading$() // returns true
// ... wait until request is finished
users.loading$() // returns false
users.create.loading$() // returns false
users.index.body$ // will receive the result of indexing users, triggered by the update using `onSuccess`
users.index.error$

userUpdates$({what: 'what'})
users.loading$() // true
// ...
users.loading$() // false
users.error$() // "Name is required"
users.body$() // -> [{name: "Bob", id: 1}]

```

## Return value

The return value of calling `flyd.crud({options})` is an object that contains helpful streams that indicate the status of your requests:

* `result.loading$`: boolean, whether any request still pending
* `result.error$`: the response body of an error result from the last request that had `status !== 200`
* `result.body$`: the response body of the last request that succeeded (where `status === 200`)

The returned object also has properties for each request name that you gave. Each property has its own status streams for `loading$`, `body$`, and `error$`. For example, if you had a request called `fetch`, then the resulting object will have `result.fetch.loading$`, `result.fetch.body$`, and `result.fetch.error$`
