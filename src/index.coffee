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

if require.main is module
  require( './server' )

ApiTransport        = require( './transports/api' )
SocketTransport     = require( './transports/socket' )
WebSocketServer     = require( 'websocket' ).server

module.exports =
  initialize: ( restifyServer ) ->

    wsServer = new WebSocketServer({
      httpServer: restifyServer.server
      autoAcceptConnections: false
    })

    return {
      ApiTransport: new ApiTransport( restifyServer, '/fbp/protocols' )
      SocketTransport: new SocketTransport( wsServer )
    }