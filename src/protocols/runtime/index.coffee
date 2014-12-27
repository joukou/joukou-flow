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
BaseProtocol   = require( '../base/index' )
pjson          = require( '../../../package.json' )
uuid           = require( 'node-uuid' )
Q              = require( 'q' )
authentication = require( '../../authentication' ).bearer
schema         = require( './schema' )

###*
@module joukou-fbpp/protocols/runtime
@author Fabian Cook <fabian.cook@joukou.com>
###

class RuntimeProtocol extends BaseProtocol
  mainGraph: null
  ###*
  @constructor RuntimeProtocol
  ###
  constructor: ( context ) ->
    super( 'runtime', context )

    @command( 'getRuntime', @getRuntime, '', 'GET' )
    @command( 'ports', @ports, 'ports', 'GET' )
    @command( 'receivePacket', @receivePacket, ':graph/packet/:port', 'PUT' )

    @addCommandSchemas( schema )

  ###*
  @typedef  { object } getRuntimePayload
  @property { string } secret
  ###
  ###*
  @typedef  { object } runtime
  @property { string } type
  @property { Array.<string> } capabilities
  @property { string } [id=undefined]
  @property { string } [label=undefined]
  @property { string } [graph=undefined]
  ###
  ###*
  Request the information about the runtime.
  When receiving this message the runtime should response with a runtime
  message.
  @param   { getRuntimePayload } payload
  @param   { RuntimeContext } context
  @returns { runtime | Promise }
  ###
  getRuntime: ( payload, context ) ->
    runtime = {
      type: context.type
      version: context.version
      capabilities: context.capabilities
      id: context.id
      label: context.label
      graph: context.graph
    }

    if context.authorized and (
      not payload.secret? or
      # Re-authenticate
      payload.secret is context.secret
    )
      return runtime

    deferred = Q.defer()
    authentication.verify(
      payload.secret,
      ( err, model ) ->
        if err
          return deferred.reject( err )
        context.user = model
        context.authorized = yes
        context.secret = payload.secret
        deferred.resolve( runtime )
    )

    return deferred.promise

  ###*
  @param { string } id
  @returns { string }
  ###
  setMainGraph: ( id, graph ) ->
    @mainGraph = graph


  ###*
  @typedef { object } portDef
  @property { string } id
  @property { string } type
  @property { string } description
  @property { boolean } addressable
  @property { boolean } required
  ###
  ###*
  @typedef  { object } port
  @property { string } graph
  @property { Array.<portDef> } inPorts
  @property { Array.<portDef> } outPorts
  ###
  ###*
  Signals the runtime's available ports.
  @param { * } payload
  @param { RuntimeContext } context
  @returns { Array.<port> | Promise }
  ###
  ports: ( payload, context ) ->

  ###*
  @typedef { object } packet
  @property { string } port
  @property { string } event
  @property { object } payload
  @property { string } graph
  ###
  ###*
  @param { packet } payload
  @param { RuntimeContext } context
  @returns { packet | Promise }
  ###
  receivePacket: ( payload, context ) ->







module.exports = RuntimeProtocol