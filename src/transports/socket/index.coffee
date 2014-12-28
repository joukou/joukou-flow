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
BaseTransport  = require('../base')
SocketClient   = require('./client')
RuntimeContext = require('../../runtime')
uuid           = require('node-uuid')
MessageSchema = require( '../../message/schema' )

class SocketTransport extends BaseTransport
  constructor: ( @server ) ->
    server.on('request', ( request ) ->

      protocol = undefined
      # Check if request if noflo, if not for dev just accept it
      if request.requestedProtocols.indexOf( 'noflo' ) isnt -1
        protocol = 'noflo'

      connection = request.accept( protocol, request.origin )

      #TODO optional handshake auth
      context = new RuntimeContext( )
      context.socket = yes
      client = new SocketClient( connection, context, @ )
      connection.on( 'message', ( message ) ->
        utf8 = ""
        if message.type is 'utf8'
          utf8 = message.utf8Data
        else if message.type is 'binary'
          utf8 = message.binaryData.toString('utf8')
        data = null
        try
          data = JSON.parse(
            utf8
          )
        catch
          # All messages should be a JSON string
          return
        client.receive( data )
      )
      connection.on( 'close', ->
        client.disconnect()
      )
    )

  sendAll: ( data ) ->
    if not MessageSchema.validate( data )
      throw new Error( 'Data is not in the required format' )
    message = JSON.stringify(
      data
    )
    # TODO implement persona restricted messages
    @server.broadcastUTF(
      message
    )

module.exports = SocketTransport