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
BaseProtocol   = require( '../base' )
Q              = require( 'q' )
schema         = require( './schema' )
RabbitMQClient = require( './rabbit-client' )
Request        = require( './fleet-request' )
FleetClient    = require( './fleet-client' )
{ models }     = require( 'joukou-data' )

###*
@module joukou-fbpp/protocols/network
@author Fabian Cook <fabian.cook@joukou.com>
###



class NetworkProtocol extends BaseProtocol

  fleetClient: FleetClient
  rabbitMQClient: RabbitMQClient

  ###*
  @constructor NetworkProtocol
  ###
  constructor: ( context ) ->
    super( 'network', context )

    @loader = context.getNetworkLoader( )

    @subscriptions = {}

    @command( 'start', @start, ':graph/start', 'PUT' )
    @command( 'getStatus', @getStatus )
    @command( 'stop', @stop, ':graph/stop', 'PUT' )
    @command( 'started', @started, ':graph/started', 'GET' )
    @command( 'status', @status, ':graph', 'GET')
    @command( 'stopped', @stopped, ':graph/stopped', 'GET')
    @command( 'debug', @debug, ':graph/debug', 'PUT' )
    @command( 'icon', @icon, ':graph/icon', 'GET' )
    #@command( 'outport', @outport, ':graph/outport/:name', 'GET')
    #@command( 'error', @outport, ':graph/outport/:name', 'GET')
    #@command( 'processError', @processError )
    @command( 'connect', @connect)
    @command( 'beginGroup', @beginGroup )
    @command( 'endGroup', @endGroup )
    @command( 'disconnect', @disconnect )
    @command( 'edges', @edges, ':graph/edges', 'PUT' )

    @addCommandSchemas( schema )

  subscribeNetwork: ( network ) ->
    if @subscriptions[ network.id ]
      return
    @subscriptions[ network.id ] = yes
    forward = ( event ) =>
      network.on( event, ( data ) =>
        # So we can change networks without making a new socket
        if not @subscriptions[ network.id ]
          return
        while event.indexOf( '-' ) isnt -1
          # https://github.com/noflo/noflo-runtime-base/blob/master/src/protocol/Network.coffee#L163
          event = event.replace( '-', '' )
        @send( event, data )
      )
    forward( 'started' )
    forward( 'stopped' )
    forward( 'status' )
    forward( 'data' )
    forward( 'error' )
    forward( 'process-error' )
    forward( 'icon' )

  unsubscribeNetwork: ( network ) ->
    if not @subscriptions[ network.id ]
      return
    @subscriptions[ network.id ] = undefined



  ###*
  @typedef { object } startPayload
  @property { string } graph
  ###
  ###*
  @param { startPayload } payload
  @param { RuntimeContext } runtime
  @returns { startPayload | Promise }
  ###
  start: ( payload ) ->
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      return network.start( )
      .then( ->
        return payload
      )
    )

  ###*
  @typedef { object } getStatusPayload
  @property { string } graph
  ###
  ###*
  @typedef { object } status
  @property { string } graph
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
  @property { boolean } [debug=undefined]
  ###
  ###*
  @param { getStatusPayload } payload
  @param { RuntimeContext } context
  @returns { status | Promise }
  ###
  getStatus: ( payload ) ->
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      return network.getStatus( )
    )


  ###*
  @typedef { object } stopPayload
  @property { string } graph
  ###
  ###*
  @param { stopPayload } payload
  @param { RuntimeContext } context
  @returns { stopPayload | Promise }
  ###
  stop: ( payload ) ->
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      return network.stop( )
      .then( ->
        return payload
      )
    )

  ###*
  @typedef { object } startedPayload
  @property { string } graph
  ###
  ###*
  @typedef { object } started
  @property { string } graph
  @property { number } time
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
  ###
  ###*
  @param { startedPayload } started
  @param { RuntimeContext } context
  @returns { started | Promise }
  ###
  started: ( payload ) ->
    deferred = Q.defer()
    @getStatus( payload )
    .then( ( result ) ->
      if not result.started
        return deferred.reject(
          'Graph not started'
        )
      return deferred.resolve(
        result
      )
    )
    return deferred.promise

  ###*
  @typedef { object } statusPayload
  @property { string } graph
  ###
  ###*
  @param { statusPayload } payload
  @param { RuntimeContext } context
  @returns { status | Promise }
  ###
  status: ( payload ) ->
    return @getStatus( payload )

  ###*
  @typedef { object } stoppedPayload
  @property { string } graph
  ###
  ###*
  @typedef { object } stopped
  @property { string } graph
  @property { number } time
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
  ###
  ###*
  @param { stoppedPayload } payload
  @param { RuntimeContext } context
  @returns { stopped | Promise }
  ###
  stopped: ( payload ) ->
    deferred = Q.defer()
    @getStatus( payload )
    .then( ( result ) ->
      if result.started
        return deferred.reject(
          'Graph not stopped'
        )
      return deferred.resolve(
        result
      )
    )
    return deferred.promise

  ###*
  @typedef { object } debugPayload
  @property { boolean } [enabled=false]
  @property { string } graph
  ###
  ###*
  @param { debugPayload } payload
  @param { RuntimeContext } context
  @returns { debugPayload | Promise }
  ###
  debug: ( payload ) ->
    return Q.reject( )

  ###*
  @typedef { object } iconPayload
  @property { string } id
  @property { string } [icon=undefined]
  @property { string } graph
  ###
  ###*
  @param { iconPayload } payload
  @param { RuntimeContext } context
  @returns { iconPayload | Promise }
  ###
  icon: ( payload ) ->
    if payload.icon
      return Q.reject( 'Not implemented' )
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      return network.getIcon( payload.id )
    )


  ###*
  @typedef { object } output
  @property { string } message
  @property { string } [type=undefined]
  @property { string } [url=undefined]
  ###

  ###*
  @typedef { object } error
  @property { string } message
  ###

  ###*
  @typedef { object } processError
  @property { string } id
  @property { error | string } error
  @property { string } graph
  ###

  ###*
  @typedef { object } port
  @property { string } node
  @property { string } port
  ###
  ###*
  @typedef { object } connectPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
  ###
  ###*
  @param { connectPayload } payload
  @param { RuntimeContext } context
  @returns { connectPayload | Promise }
  ###
  connect: ( payload ) ->
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      network.connect( payload.id, payload.src, payload.tgt, payload.subgraph )
    )


  ###*
  @typedef { object } beginGroupPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } group
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
  ###
  ###*
  @param { beginGroupPayload } payload
  @param { RuntimeContext } context
  @returns { beginGroupPayload | Promise }
  ###
  beginGroup: ( payload, context ) ->
    @loader.fetchNetwork( payload.graph )
    .then( ( network ) ->
      network.connect( payload.id, payload.src, payload.tgt, payload.subgraph )
    )
  ###*
  @typedef { object } data
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { * } data
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
  ###

  ###*
  @typedef { object } endGroupPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } group
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
  ###

  ###*
  @param { endGroupPayload } payload
  @param { RuntimeContext } context
  @returns { endGroupPayload | Promise }
  ###
  endGroup: ( payload, context ) ->

  ###*
  @typedef { object } disconnectPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
  ###
  ###*
  @param { disconnectPayload } payload
  @param { RuntimeContext } context
  @returns { disconnectPayload | Promise }
  ###
  disconnect: ( payload, context ) ->

  ###*
  @typedef { object } edge
  @property { port } src
  @property { port } tgt
  @property { object } [metadata=undefined]
  ###
  ###*
  @typedef { object } edgesPayload
  @property { Array.<edge> } edges
  @property { string } graph
  ###
  ###*
  @param { edgesPayload } payload
  @param { RuntimeContext } context
  @param { edgesPayload | Promise }
  ###
  edges: ( payload, context ) ->



module.exports = NetworkProtocol