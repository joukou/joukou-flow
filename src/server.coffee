###
Copyright 2014 Joukou Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
###
###*
@module joukou-fbpp/server
@author Fabian Cook <fabian.cook@joukou.com>
###
# Standalone module

unless process.env["JOUKOU_FLEET_API_HOST"]
  process.env["JOUKOU_FLEET_API_HOST"] = 'http://localhost:4001'
unless process.env["JOUKOU_FLEET_API_PATH"]
  process.env["JOUKOU_FLEET_API_PATH"] = "/v1/"


restify         = require( 'restify' )
cors            = require( './cors' )
ApiTransport    = require( './transports/api' )
SocketTransport = require( './transports/socket' )
LoggerFactory   = require( './log/LoggerFactory' )
pjson           = require( '../package.json' )

server = restify.createServer(
  name: 'flow'
  version: pjson.version
  log: LoggerFactory.getLogger( name: 'server' )
  acceptable: [
    'application/json'
  ]
)

server.pre( cors.preflight )
server.use( cors.actual )
server.use( restify.acceptParser( server.acceptable ) )
server.use( restify.dateParser() )
server.use( restify.queryParser() )
server.use( restify.jsonp() )
server.use( restify.gzipResponse() )
server.use( restify.bodyParser( mapParams: false ) )

server.on(
  'after',
  restify.auditLogger(
    log: LoggerFactory.getLogger( name: 'audit' )
  )
)

server.on( 'uncaughtException', (err) ->
  console.log(err)
)



transports = require( './index' ).initialize( server )

routes = transports.ApiTransport.getRoutes()

###
for key of routes
  if not routes.hasOwnProperty( key )
    continue
  for val in routes[ key ]
    console.log( key, val )
###


server.listen(
  process.env.JOUKOU_API_PORT || 2101,
  process.env.JOUKOU_API_HOST || 'localhost',
  ->
    server.log.info(
      "#{server.name}-#{pjson.version} listening at #{server.url}"
    )
)

module.exports = {
  server: server
  transports: transports
}