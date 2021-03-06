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
MessageSchema        = require( '../../message/schema' )
BaseClient           = require( '../base/client' )
NonReturningResponse = require( '../../runtime/non-return-response' )

class SocketClient extends BaseClient
  connected: yes
  context: null
  connection: null
  constructor: ( @transport, @connection, @context ) ->
    super( @transport, @context )
    @context.send = @send.bind( @ )
    @context.sendAll = @sendAll.bind( @ )
  receive: ( data ) ->
    # Forget about it
    form = MessageSchema.validate( data )
    if not form.valid
      return
    promise = @context.receive(
      data.protocol,
      data.command,
      data.payload
    )
    promise.then( ( payload ) =>
      payload = @resolveCommandResponse( payload )
      if payload instanceof NonReturningResponse
        return
      @send(
        payload
      )
    )
    .fail( ( err ) ->
      # TODO log errors
      unless err
        console.log(
          "Error occurred in #{ data.protocol }/#{ data.command }"
        )
        return
      console.log(
        err, err && err.stack
      )
      # Don't ack
    )

  disconnect: ->
    @connected = no

  sendAll: ( data ) ->
    @context?.sendAll( data )

  send: ( data ) ->
    if not @connected
      return
    if not MessageSchema.validate( data )
      throw new Error( 'Data is not in the required format' )
    message = JSON.stringify(
      data
    )
    @connection.sendUTF( message )

module.exports = SocketClient