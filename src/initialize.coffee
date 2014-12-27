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
@module joukou-fbpp/index
@author Fabian Cook <fabian.cook@joukou.com>
###

###*
@typedef { object } Promise
@property { function } then
@property { function } fail
###
ApiTransport        = require( './transports/api' )
SocketTransport     = require( './transports/socket' )
WebSocketServer     = require( 'websocket' ).server
fs                  = require( 'fs' )
https               = require( 'https' )
_                   = require( 'lodash' )

module.exports = ( httpRestifyServer, httpsRestifyServer = undefined ) ->

  servers = httpRestifyServer.server

  if httpsRestifyServer? and httpsRestifyServer isnt httpRestifyServer
    servers = [
      httpRestifyServer,
      httpsRestifyServer
    ]

  wsServer = new WebSocketServer({
    httpServer: _.map( servers, ( server ) -> server.server )
    autoAcceptConnections: false
  })

  socketTransport = new SocketTransport( wsServer )

  apiTransports = _.map( servers, ( server ) ->
    return new ApiTransport( server, '/fbp' )
  )

  return {
    ApiTransports: apiTransports,
    SocketTransport: socketTransport
  }