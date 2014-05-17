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
BaseProtocol      = require( '../base' )
Q                 = require( 'q' )
{ models }        = require( 'joukou-data' )
_                 = require( 'lodash' )
NoFlo             = require( 'noflo' )
schema            = require( './schema' )

###*
@module joukou-fbpp/protocols/graph
@author Fabian Cook <fabian.cook@joukou.com>
###

class GraphProtocol extends BaseProtocol
  graphs: null

  ###*
  @constructor GraphProtocol
  ###
  constructor: ->
    super('graph')

    @graphs = {}

    @command( 'clear', @clear, ':id', 'PUT' )

    @command( 'graph', @graph, ':graph', 'GET' )

    @command( 'addNode', @addNode, ':graph/node/:id', 'PUT' )
    @command( 'removeNode', @removeNode, ':graph/node/:id', 'DELETE' )
    @command( 'renameNode', @renameNode, ':graph/node/:from/rename', 'POST' )
    @command( 'changeNode', @changeNode, ':graph/node/:id', 'POST' )

    @command( 'addEdge', @addEdge, ':graph/edge', 'PUT' )
    @command( 'removeEdge', @removeEdge, ':graph/edge', 'DELETE' )
    @command( 'changeEdge', @changeEdge, ':graph/edge', 'POST' )

    @command( 'addInitial', @addInitial, ':graph/initial', 'PUT' )
    @command( 'removeInitial', @removeInitial, ':graph/initial', 'DELETE' )

    @command( 'addInport', @addInport, ':graph/inport/:public', 'PUT' )
    @command( 'removeInport', @removeInport, ':graph/inport/:public', 'DELETE' )
    @command( 'renameInport', @renameInport, ':graph/inport/:public/rename', 'POST' )

    @command( 'addOutport', @addOutport, ':graph/outport/:public', 'PUT' )
    @command( 'removeOutport', @removeOutport, ':graph/outport/:public', 'DELETE' )
    @command( 'renameOutport', @renameOutport, ':graph/outport/:public/rename', 'POST' )

    @command( 'addGroup', @addGroup, ':graph/group/:name', 'PUT' )
    @command( 'removeGroup', @removeGroup, ':graph/group/:name', 'DELETE' )
    @command( 'renameGroup', @renameGroup, ':graph/group/:name/rename', 'POST' )
    @command( 'changeGroup', @changeGroup, ':graph/group/:name', 'POST' )

    ###
    !!! PLEASE NOTE THIS VALIDATES ALL PAYLOADS !!!
    ###
    @addCommandSchemas( schema )

  ###*
  @typedef { object } graphPayload
  @property { string } graph
  ###
  ###*
  @param { graphPayload } payload
  @param { RuntimeContext } context
  @returns { graphPayload | Promise }
  ###
  graph: ( payload, context ) ->

    context.graph = payload.graph
    if @graphs[payload.graph]
      deferred = Q.defer()
      process.nextTick( =>
        console.log( 'from cache' )
        deferred.resolve( @graphs[payload.graph] )
      )
      return deferred.promise
    # TODO load from database
    deferred = Q.defer()
    @_getModelByPublicKey( payload.graph )
    .then( ( model ) =>
      value = model.getValue()

      context.getPersonas()
      .then( ( agentPersonas ) =>
        any = no

        # "Authorization"
        for persona in agentPersonas
          if _.some(value.personas, ( graphPersona ) ->
            return graphPersona.key is persona.key
          )
            any = yes
            break

        if not any
          return deferred.reject( 'Unauthorized' )

        console.log( 'from model ', model.getKey() )

        graph = @_joukouToNoflo(
          model.getKey(),
          model,
          value
        )

        @graphs[ payload.graph ] = graph

        deferred.resolve( graph )
      )
      .fail( deferred.reject )
    )
    .fail( deferred.reject )
    return deferred.promise

  _getModelByPublicKey: ( key ) ->
    models.graph.search(
      "public_key:#{key}",
      yes
    )

  _getModel: ( public_key, graph ) ->
    deferred = Q.defer()
    if graph.properties.metadata.model
      process.nextTick( ->
        deferred.resolve(
          graph.properties.metadata.model
        )
      )
      return deferred.promise
    @_getModelByPublicKey(
      public_key
    )
    .then( ( model ) ->
      deferred.resolve(
        model
      )
    )
    .fail( ->
      models.graph.create()
      .then( ( model ) ->
        deferred.resolve(
          model
        )
      )
      .fail(
        deferred.reject
      )
    )
    return deferred.promise

  _joukouExportedPortsToNoflo: ( obj = {} ) ->
    ports = []
    for key of obj
      if not obj.hasOwnProperty( key )
        continue
      ports.push({
        public: key
        node: obj[key].process
        port: obj[key].port
        metadata: obj[key].metadata or {}
      })
    return ports

  _nofloExportedPortsToJoukou: ( ports = [] ) ->
    obj = {}
    for val in ports
      obj[ val.public ] = {
        process: val.node
        port: val.port
        metadata: val.metadata or {}
      }
    return obj

  _joukouNodeToNoflo: ( processes = {} ) ->
    nodes = []
    for key of processes
      if not processes.hasOwnProperty( key )
        continue
      nodes.push({
        id: key
        component: processes[key].circle.key
        metadata: processes[key].metadata or {}
      })
    return nodes

  _nofloNodeToJoukou: ( nodes = [] ) ->
    processes = {}
    for val in nodes
      processes[ val.id ] = {
        circle:
          key: val.component
        metadata: val.metadata or {}
      }
    return processes

  _joukouEdgeToNoflo: ( connections = [] ) ->
    return _.map( connections, ( connection ) ->
      res = {
        data: connection.data
        metadata: connection.metadata or {}
      }
      if connection.src
        res.src = {
          node: connection.src.process
          port: connection.src.port
          index: connection.src.index
          metadata: connection.src.metadata or {}
        }
      if connection.tgt
        res.tgt = {
          node: connection.tgt.process
          port: connection.tgt.port
          index: connection.tgt.index
          metadata: connection.tgt.metadata or {}
        }
      res.metadata.key = connection.key
      return res
    )

  _nofloEdgeToJoukou: ( edges = [] ) ->
    return _.map(edges, ( edge ) ->
      res = {
        key: edge.metadata.key
        metadata: edge.metadata
      }
      res.metadata.key = undefined
      if edge.src
        res.src = {
          process: edge.src.node
          port: edge.src.port
          index: edge.src.index
          metadata: edge.src.metadata or {}
        }
      if edge.tgt
        res.tgt = {
          process: edge.tgt.node
          port: edge.tgt.port
          index: edge.tgt.index
          metadata: edge.tgt.metadata or {}
        }
      res.data = edge.data
    )

  _joukouToNoflo: ( private_key, model, value ) ->

    graph = new NoFlo.Graph( value.name )

    inports = @_joukouExportedPortsToNoflo(
      value.inports
    )

    for port in inports
      graph.addInport(
        port.public,
        port.node,
        port.port,
        port.metadata
      )

    outports = @_joukouExportedPortsToNoflo(
      value.outports
    )

    for port in outports
      graph.addOutport(
        port.public,
        port.node,
        port.port,
        port.metadata
      )

    nodes = @_joukouNodeToNoflo(
      value.processes
    )

    for node in nodes
      graph.addNode(
        node.id,
        node.component,
        node.metadata
      )

    edges = @_joukouEdgeToNoflo(
      value.connections
    )

    for edge in edges
      if edge.index?
        graph.addEdgeIndex(
          edge.src.node,
          edge.src.port,
          edge.tgt.node,
          edge.tgt.port,
          edge.index,
          edge.metadata
        )
      else
        graph.addEdge(
          edge.src.node,
          edge.src.port,
          edge.tgt.node,
          edge.tgt.port,
          edge.metadata
        )

    value.properties ?= {}

    graph.setProperties({
      name: value.properties.name
      library: value.properties.library
      main: value.properties.main
      icon: value.properties.icon
      description: value.properties.description
      metadata: {
        dirty: no
        new: no
        private_key: private_key
        model: model
      }
    })

    return graph

  _nofloToJoukou: ( public_key, graph, value = {} ) ->

    value.name = graph.name
    value.public_key = public_key
    value.properties ?= {}
    value.properties.name = graph.properties.name
    value.properties.library = graph.properties.library
    value.properties.main = graph.properties.main
    value.properties.icon = graph.properties.icon
    value.properties.description = graph.properties.description

    value.inports = @_nofloExportedPortsToJoukou(
      graph.inports
    )
    value.outports = @_nofloExportedPortsToJoukou(
      graph.outports
    )

    value.processes = @_nofloNodeToJoukou(
      graph.nodes
    )

    value.connections = @_nofloEdgeToJoukou(
      graph.edges
    )

    #TODO initializers, exports, groups

    return value

  _saveWithModel: ( model, public_key, graph ) ->
    value = model.getValue()
    value = @_nofloToJoukou(
      public_key,
      graph,
      value
    )
    model.setValue(
      value
    )
    return model.save()

  _save: ( payload, context ) ->
    deferred = Q.defer()
    keys = _.where(
      _.keys( @graphs ),
      ( key ) =>
        return @graphs[ key ].properties.metadata.dirty
    )
    if not keys.length
      process.nextTick( ->
        deferred.resolve( payload )
      )
      return deferred.promise
    context.getPersonas( ( personas ) =>
      promises = _.map( keys, ( key ) =>
        deferred = Q.defer()
        graph = @graphs[ key ]
        @_getModel( key, graph )
        .then( ( model ) ->
          return @_saveWithModel( model, key, graph )
        )
        .then( deferred.resolve )
        .fail( deferred.reject )
        return deferred.promise
      )
      return Q.all(
        promises
      )
    )
    .then( ->
      deferred.resolve(
        payload
      )
    )
    .fail( ->
      # TODO, discuss with Isaac as to whether this should be the case
      deferred.resolve(
        payload
      )
    )
    #.fail( deferred.reject )
    return deferred.promise

  ###*
  @typedef { object } clearPayload
  @property { string } id
  @property { string } name
  @property { string } library
  @property { boolean } main
  @property { string } icon
  @property { string } description
  ###
  ###*
  @param { clearPayload } payload
  @param { RuntimeContext } context
  @returns { clearPayload | Promise }
  ###
  clear: ( payload, context ) ->

    console.log( payload )

    unless payload.name
      payload.name = 'Joukou NoFlo runtime'

    graph = new NoFlo.Graph( payload.name )

    fullName = payload.id
    if payload.library
      fullName = "#{payload.library}/#{fullName}"
    if payload.icon
      graph.properties.icon = payload.icon
    if payload.description
      graph.properties.description = payload.description

    graph.properties.metadata ?= {}
    graph.properties.metadata.dirty = yes
    graph.properties.metadata.new = not @graphs[ payload.id ]?

    graph.baseDir = context.options?.baseDir

    @graphs[ payload.id ] = graph

    if payload.main
      context.getProtocol( 'runtime' )
      .setMainGraph( payload.main )

    return @_save( graph, context )


  ###*
  @typedef { object } addNodePayload
  @property { string } id
  @property { string } component
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addNodePayload } payload
  @param { RuntimeContext } context
  @returns { addNodePayload | Promise }
  ###
  addNode: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.addNode(
        payload.id,
        payload.component,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )
  ###*
  @typedef { object } removeNodePayload
  @property { string } id
  @property { string } graph
  ###
  ###*
  @param { removeNodePayload } payload
  @param { RuntimeContext } context
  @returns { removeNodePayload | Promise }
  ###
  removeNode: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeNode(
        payload.id
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )
  ###*
  @typedef { object } renameNodePayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameNodePayload } payload
  @param { RuntimeContext } context
  @returns { renameNodePayload | Promise }
  ###
  renameNode: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.renameNode(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } changeNodePayload
  @property { string } id
  @property { object } metadata
  @property { string } graph
  ###
  ###*
  @param { changeNodePayload } payload
  @param { RuntimeContext } context
  @returns { changeNodePayload | Promise }
  ###
  changeNode: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.setNodeMetadata(
        payload.id,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } port
  @property { string } node
  @property { string } port
  @property { number } [index=undefined]
  ###

  ###*
  @typedef { object } addEdgePayload
  @property { port } src
  @property { port } tgt
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addEdgePayload } payload
  @param { RuntimeContext } context
  @returns { addEdgePayload | Promise }
  ###
  addEdge: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      if payload.index?
        graph.addEdge(
          payload.src.node,
          payload.src.port,
          payload.tgt.node,
          payload.tgt.port,
          payload.index,
          payload.metadata
        )
      else
        graph.addEdge(
          payload.src.node,
          payload.src.port,
          payload.tgt.node,
          payload.tgt.port,
          payload.metadata
        )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } removeEdgePayload
  @property { port } src
  @property { port } tgt
  @property { string } graph
  ###
  ###*
  @param { removeEdgePayload } payload
  @param { RuntimeContext } context
  @returns { removeEdgePayload | Promise }
  ###
  removeEdge: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeEdge(
        payload.src.node,
        payload.src.port,
        payload.tgt.node,
        payload.tgt.port
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } changeEdgePayload
  @property { port } src
  @property { port } tgt
  @property { object } metadata
  @property { string } graph
  ###
  ###*
  @param { changeEdgePayload } payload
  @param { RuntimeContext } context
  ###
  changeEdge: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.setEdgeMetadata(
        payload.src.node,
        payload.src.port,
        payload.tgt.node,
        payload.tgt.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } initialSrc
  @property { * } data
  ###
  ###*
  @typedef { object } addInitialPayload
  @property { initialSrc } src
  @property { port } tgt
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addInitialPayload } payload
  @param { RuntimeContext } context
  @returns { addInitialPayload | Promise }
  ###
  addInitial: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      if payload.tgt.index?
        graph.addInitialIndex(
          payload.src.data,
          payload.tgt.node,
          payload.tgt.port,
          payload.tgt.index,
          payload.metadata or {}
        )
      else
        graph.addInitial(
          payload.src.data,
          payload.tgt.node,
          payload.tgt.port,
          payload.metadata or {}
        )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } removeInitialPayload
  @property { port } tgt
  @property { string } graph
  ###
  ###*
  @param { removeInitialPayload } payload
  @param { RuntimeContext } context
  @returns { removeInitialPayload | Promise }
  ###
  removeInitial: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeInitial(
        payload.tgt.node,
        payload.tgt.port
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } addInportPayload
  @property { string } public
  @property { string } node
  @property { string } port
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addInportPayload } payload
  @param { RuntimeContext } context
  @returns { addInportPayload | Promise }
  ###
  addInport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.addInport(
        payload.public,
        payload.node,
        payload.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } removeInportPayload
  @property { string } public
  @property { string } graph
  ###
  ###*
  @param { removeInportPayload } payload
  @param { RuntimeContext } context
  @returns { removeInportPayload | Promise }
  ###
  removeInport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeInport(
        payload.public
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } renameInportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameInportPayload } payload
  @param { RuntimeContext } context
  @returns { renameInportPayload | Promise }
  ###
  renameInport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.renameInport(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } addOutportPayload
  @property { string } public
  @property { string } node
  @property { string } port
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addOutportPayload } payload
  @param { RuntimeContext } context
  @returns { addOutportPayload | Promise }
  ###
  addOutport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.addOutport(
        payload.public,
        payload.node,
        payload.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } removeOutportPayload
  @property { string } public
  @property { string } graph
  ###
  ###*
  @param { removeOutportPayload } payload
  @param { RuntimeContext } context
  @returns { removeOutportPayload | Promise }
  ###
  removeOutport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeOutport(
        payload.public
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } renameOutportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameOutportPayload } payload
  @param { RuntimeContext } context
  @returns { renameOutportPayload | Promise }
  ###
  renameOutport: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.renameOutport(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } addGroupPayload
  @property { string } name
  @property { Array.<string> } nodes
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addGroupPayload } payload
  @param { RuntimeContext } context
  @returns { addGroupPayload | Promise }
  ###
  addGroup: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.addGroup(
        payload.name,
        payload.nodes,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } removeGroupPayload
  @property { string } name
  @property { string } graph
  ###
  ###*
  @param { removeGroupPayload } payload
  @param { RuntimeContext } context
  @returns { removeGroupPayload | Promise }
  ###
  removeGroup: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.removeGroup(
        payload.name
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } renameGroupPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameGroupPayload } payload
  @param { RuntimeContext } context
  @returns { renameGroupPayload | Promise }
  ###
  renameGroup: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.renameGroup(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

  ###*
  @typedef { object } changeGroupPayload
  @property { string } name
  @property { object } metadata
  @property { string } graph
  ###
  ###*
  @param { changeGroupPayload } payload
  @param { RuntimeContext } context
  @returns { changeGroupPayload | Promise }
  ###
  changeGroup: ( payload, context ) ->
    @graph( payload, context )
    .then( ( graph ) =>
      graph.setGroupMetadata(
        payload.name,
        payload.metadata
      )
      graph.properties.metadata.dirty = yes
      return @_save( payload, context )
    )

module.exports = GraphProtocol