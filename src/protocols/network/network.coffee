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
FleetClient      = require( './fleet-client' )
RabbitMQClient   = require( './rabbit-client' )
Q                = require( 'q' )
Request          = require( './fleet-request' )
{ models }       = require( 'joukou-data' )
{ EventEmitter } = require( 'events' )

class Network extends EventEmitter
  processes: {}
  connections: []
  initials: []
  defaults: []
  graph: null
  startupTime: 0
  portBuffer: {}
  constructor: ( @context, @graph ) ->
    if not @graph?.properties?.metadata?.private_key
      throw new Error( "Graph does not have a private key" )
      return

    @id = @graph.properties.metadata.private_key
    @processes = {}
    @connections = []
    @initials = []
    @nextInitials = []
    @defaults = []
    @started = false
    @debug = false

    # Modify this value to save in database
    @network = @graph.properties.network ?= { }
    @_save = @context.getNetworkLoader( ).save
    @componentLoader = @context.getComponentLoader( )

  save: ->
    @_save?()

  start: ->
    req = new Request(
      @id,
      @context.secret,
      'launched',
      @id
    )
    RabbitMQClient.send(
      req
    ).then( =>
      @network.state = 'launched'
      @network.startTime = new Date( ).getTime( )
      return @save( )
    )

  stop: ->
    req = new Request(
      @id,
      @context.secret,
      'inactive',
      @id
    )
    RabbitMQClient.send(
      req
    ).then( =>
      @network.state = 'inactive'
      return @save( )
    )

  isStarted: ->
    return @network.state is 'launched'

  isRunning: ->
    # Joukou networks are running when all the nodes are activated.
    # Rather than noflo's where there just needs to be a connection
    unless @isStarted( )
      return Q.resolve( false )
    return @getStatus( )
    .then( ( result ) ->
      return result.running
    )

  getStatus: ->
    model = @graph.properties.metadata?.model
    unless model
      return Q.reject( 'Graph does not have model' )
    unless @graph.properties.private_key
      return Q.reject( 'Graph does not have a private key' )
    value = model.getValue( )
    keys = _.keys( value.processes )
    started = @network.state is 'launched'
    if started
      uptime = (
        new Date( ).getTime( ) -
        @network.startTime
      ) / 1000
    result = {
      graph: @id,
      running: no,
      started: started
      uptime: uptime
    }
    unless keys.length
      return result
    functions = _.map( keys, ( key ) ->
      deferred = Q.defer()
      FleetClient.getUnitStates( key )
      .then( ( states ) ->
        if _.some(
          states,
          ( state ) ->
            # States are
            # active, reloading, inactive, failed, activating, deactivating. active
            # http://www.freedesktop.org/wiki/Software/systemd/dbus/
            return state.systemdActiveState is 'active'
        )
          deferred.resolve( true )
        else
          deferred.reject( false )
      )
      .fail( deferred.reject )
      return deferred.promise
    )

    promise = functions.reduce(
      Q.when,
      []
    )

    deferred = Q.defer()
    promise
    .then( ->
      result.running = yes
      deferred.resolve(
        result
      )
    )
    .fail( ->
      deferred.resolve(
        result
      )
    )

    return deferred.promise

  getIcon: ( nodeId ) ->
    node = graph.getNode( nodeId )
    return models.circle.retrieve(
      node.component
    )
    .then( ( circle ) ->
      value = circle.getValue()
      return value.icon
    )

  connect: ( id, src, tgt, subgraph ) ->



module.exports = Network