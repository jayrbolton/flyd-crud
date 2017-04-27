const R = require('ramda')
const http = require('http')
const HttpDispatcher = require('httpdispatcher')
const PORT = 4456

const dispatcher = new HttpDispatcher()

const server = http.createServer(handleRequest)

var initialUser = {name: "Initial", id: 0}
var users = [initialUser]

function handleRequest(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Request-Method', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
	if (req.method === 'OPTIONS') {
		res.writeHead(200)
		res.end()
		return
	} else {
    console.log(req.method, req.url)
  }
  try {
    dispatcher.dispatch(req, res)
  } catch(e) {
    console.log("Error:", e)
  }
}

dispatcher.onGet('/users', (req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  console.log('-->', JSON.stringify(users))
  res.end(JSON.stringify(users))
})

dispatcher.onPost('/users', (req, res) => {
  const data = parse(req.body)
  users.push(data)
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end()
})

dispatcher.onPost('/users/update', (req, res) => {
  const data = parse(req.body)
  const idx = R.findIndex(u => u.id === data.id, users)
  users = R.update(idx, data, users)
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end()
})

dispatcher.onPost('/users/delete', (req, res) => {
  const data = parse(req.body)
  const idx = R.findIndex(u => u.id === data.id, users)
  users = R.remove(idx, 1, users)
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end()
})

dispatcher.onPost('/refresh', (req, res) => {
  users = [initialUser]
  res.end()
})

function parse(str) { try { return JSON.parse(str) } catch(e) { return {} } }

server.listen(PORT, function(){
  console.log("Test server listening on: http://localhost:%s", PORT)
})
