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
{ models }        = require( 'joukou-data' )
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
  constructor: ( context ) ->
    super( 'graph', context )

    @loader = context.getGraphLoader( )

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
  @returns { graphPayload | Promise }
  ###
  graph: ( payload ) ->
    return @loader.fetchSafeGraph( payload.graph )

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
  @returns { clearPayload | Promise }
  ###
  clear: ( payload ) ->

    unless payload.name
      payload.name = 'Joukou NoFlo runtime'

    graph = @loader.createGraph( payload.id, payload.name )

    fullName = payload.id
    if payload.library
      fullName = "#{payload.library}/#{fullName}"
    if payload.icon
      graph.properties.icon = payload.icon
    if payload.description
      graph.properties.description = payload.description

    graph.baseDir = @context.options?.baseDir

    if payload.main
      @context.getProtocol( 'runtime' )
      .setMainGraph( payload.main )

    return @loader.save( graph )

  ###*
  @typedef { object } addNodePayload
  @property { string } id
  @property { string } component
  @property { object } [metadata=undefined]
  @property { string } graph
  ###
  ###*
  @param { addNodePayload } payload
  @returns { addNodePayload | Promise }
  ###
  addNode: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.addNode(
        payload.id,
        payload.component,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )
  ###*
  @typedef { object } removeNodePayload
  @property { string } id
  @property { string } graph
  ###
  ###*
  @param { removeNodePayload } payload
  @returns { removeNodePayload | Promise }
  ###
  removeNode: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeNode(
        payload.id
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )
  ###*
  @typedef { object } renameNodePayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameNodePayload } payload
  @returns { renameNodePayload | Promise }
  ###
  renameNode: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.renameNode(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } changeNodePayload
  @property { string } id
  @property { object } metadata
  @property { string } graph
  ###
  ###*
  @param { changeNodePayload } payload
  @returns { changeNodePayload | Promise }
  ###
  changeNode: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.setNodeMetadata(
        payload.id,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { addEdgePayload | Promise }
  ###
  addEdge: ( payload ) ->
    @loader.fetchGraph( payload.graph )
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
      return @loader.save( payload )
    )

  ###*
  @typedef { object } removeEdgePayload
  @property { port } src
  @property { port } tgt
  @property { string } graph
  ###
  ###*
  @param { removeEdgePayload } payload
  @returns { removeEdgePayload | Promise }
  ###
  removeEdge: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeEdge(
        payload.src.node,
        payload.src.port,
        payload.tgt.node,
        payload.tgt.port
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { changeEdgePayload | Promise }
  ###
  changeEdge: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.setEdgeMetadata(
        payload.src.node,
        payload.src.port,
        payload.tgt.node,
        payload.tgt.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { addInitialPayload | Promise }
  ###
  addInitial: ( payload ) ->
    @loader.fetchGraph( payload.graph )
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
      return @loader.save( payload )
    )

  ###*
  @typedef { object } removeInitialPayload
  @property { port } tgt
  @property { string } graph
  ###
  ###*
  @param { removeInitialPayload } payload
  @returns { removeInitialPayload | Promise }
  ###
  removeInitial: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeInitial(
        payload.tgt.node,
        payload.tgt.port
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { addInportPayload | Promise }
  ###
  addInport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.addInport(
        payload.public,
        payload.node,
        payload.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } removeInportPayload
  @property { string } public
  @property { string } graph
  ###
  ###*
  @param { removeInportPayload } payload
  @returns { removeInportPayload | Promise }
  ###
  removeInport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeInport(
        payload.public
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } renameInportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameInportPayload } payload
  @returns { renameInportPayload | Promise }
  ###
  renameInport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.renameInport(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { addOutportPayload | Promise }
  ###
  addOutport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.addOutport(
        payload.public,
        payload.node,
        payload.port,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } removeOutportPayload
  @property { string } public
  @property { string } graph
  ###
  ###*
  @param { removeOutportPayload } payload
  @returns { removeOutportPayload | Promise }
  ###
  removeOutport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeOutport(
        payload.public
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } renameOutportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameOutportPayload } payload
  @returns { renameOutportPayload | Promise }
  ###
  renameOutport: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.renameOutport(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
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
  @returns { addGroupPayload | Promise }
  ###
  addGroup: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.addGroup(
        payload.name,
        payload.nodes,
        payload.metadata or {}
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } removeGroupPayload
  @property { string } name
  @property { string } graph
  ###
  ###*
  @param { removeGroupPayload } payload
  @returns { removeGroupPayload | Promise }
  ###
  removeGroup: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.removeGroup(
        payload.name
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } renameGroupPayload
  @property { string } from
  @property { string } to
  @property { string } graph
  ###
  ###*
  @param { renameGroupPayload } payload
  @returns { renameGroupPayload | Promise }
  ###
  renameGroup: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.renameGroup(
        payload.from,
        payload.to
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

  ###*
  @typedef { object } changeGroupPayload
  @property { string } name
  @property { object } metadata
  @property { string } graph
  ###
  ###*
  @param { changeGroupPayload } payload
  @returns { changeGroupPayload | Promise }
  ###
  changeGroup: ( payload ) ->
    @loader.fetchGraph( payload.graph )
    .then( ( graph ) =>
      graph.setGroupMetadata(
        payload.name,
        payload.metadata
      )
      graph.properties.metadata.dirty = yes
      return @loader.save( payload )
    )

module.exports = GraphProtocol