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
Q          = require( 'q' )
_          = require( 'lodash' )
NoFlo      = require( 'noflo' )
{ models } = require( 'joukou-data' )
validator  = require( 'validator' )

class GraphLoader

  constructor: ( @context ) ->
    @graphs = { }
    @graphHash = { }

  _getGraphHash: ( value ) ->
    # NoFlo graph overrides toJSON
    value = {
      properties: _.cloneDeep( value.properties ),
      nodes: value.nodes,
      edges: value.edges,
      initializers: value.initializers,
      exports: value.exports,
      inports: value.inports,
      outports: value.outports,
      groups: value.groups
    }
    value.properties.metadata?.model = undefined
    return @_getHash(
      value
    )

  _getHash: (value) ->
    value = JSON.stringify(value)
    # Obtained from http://www.cse.yorku.ca/~oz/hash.html
    hash = 0
    i = 0
    while i < value.length
      hash = value.charCodeAt(i) + (hash << 6) + (hash << 16) - hash
      i++
    return hash

  fetchGraph: ( id ) ->

    @context.graph = id

    if @graphs[ id ]
      return Q.resolve( @graphs[ id ] )

    method = '_getModelByPublicKey'
    # To long if using if/then/else. Meh
    lower = id.toLowerCase( )
    if lower.indexOf( 'private:' ) isnt -1
      replaced = lower.replace( 'private:', '' )
      if validator.isUUID( replaced )
        id = replaced
        method = '_getModelByPrivateKey'

    deferred = Q.defer()
    @[ method ]( id )
    .then( ( model ) =>
      value = model.getValue()

      @context.getPersonas()
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

        graph = @_joukouToNoflo(
          model.getKey(),
          model,
          value
        )

        @graphs[ id ] = graph

        @graphHash[ id ] = @_getGraphHash( graph )

        deferred.resolve( graph )
      )
      .fail( deferred.reject )
    )
    .fail( deferred.reject )
    return deferred.promise

  fetchSafeGraph: ( id ) ->
    return @fetchGraph( id )
    .then( ( graph ) ->
      graph = _.cloneDeep( graph )
      graph.properties.metadata = undefined

      ret = new NoFlo.Graph( graph.name )
      ret.properties = graph.properties
      ret.nodes = graph.nodes
      ret.edges = graph.edges
      ret.initializers = graph.initializers
      ret.exports = graph.exports
      ret.inports = graph.inports
      ret.outports = graph.outports
      ret.groups = graph.groups

      return ret
    )


  createGraph: ( id, name ) ->
    graph = new NoFlo.Graph( name )

    graph.properties.metadata = {
      dirty: yes
      new: not @graphs[ id ]?
      model: @graphs[ id ]?.properties.metadata?.model
    }

    @graphs[ id ] = graph

    # Don't add to graph hash as it is new


  _getModelByPublicKey: ( key ) ->
    deferred = Q.defer()

    models.graph.elasticSearch(
      "public_key:#{key}",
      yes
    )
    .then(
      deferred.resolve
    )
    .fail( =>
      @context.getPersonaKey( )
      .then( ( persona_key ) ->
        models.graph.create({
          name: id
          public_key: key,
          personas: [
            key: persona_key
          ]
        })
        .then(
          deferred.resolve
        )
        .fail(
          deferred.reject
        )
      )

    )
    return deferred.promise

  _getModelByPrivateKey: ( key ) ->
    models.graph.retrieve( key )

  _getModel: ( public_key, graph ) ->
    deferred = Q.defer()
    if graph.properties?.metadata?.model
      return Q.resolve(
        graph.properties.metadata.model
      )
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

    properties = _.assign(
      {},
      value.properties
    )

    properties.metadata = _.assign(
      properties.metadata or {},
      {
        dirty: no
        new: no
        private_key: private_key
        model: model
      }
    )

    ( properties.environment ?= { } ).type = "joukou-noflo"

    graph.setProperties(
      properties
    )

    return graph

  _nofloToJoukou: ( public_key, graph, value = {}, persona_key ) ->

    value.name = graph.name
    value.public_key = public_key
    value.properties ?= {}

    # Assign will just overwrite metadata, better save it
    metadata = _.assign(
      value.properties?.metadata or {},
      graph.properties?.metadata or {}
    )

    metadata.new = undefined
    metadata.dirty = undefined
    metadata.model = undefined
    metadata.private_key = undefined

    value.properties = _.assign(
      value.properties or {},
      graph.properties or {}
    )

    value.properties.metadata = metadata

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

    if not _.some( (value.personas ?= []), ( persona ) ->
      return persona.key is persona_key
    )
      value.personas.push({
        key: persona_key
      })

    #TODO initializers, exports, groups

    return value

  _saveWithModel: ( model, public_key, graph, persona_key ) ->
    value = model.getValue()
    value = @_nofloToJoukou(
      public_key,
      graph,
      value,
      persona_key
    )
    model.setValue(
      value
    )
    return model.save()

  save: ( payload ) ->
    deferred = Q.defer()
    keys = _.where(
      _.keys( @graphs ),
      ( key ) =>
        hash = @_getGraphHash( @graphs[ key ] )
        return hash isnt @graphHash[ key ]
    )
    if not keys.length
      return Q.resolve( payload )
    @context.getPersonaKey( )
    .then( ( persona ) =>
      promises = _.map( keys, ( key ) =>
        graph = @graphs[ key ]
        @_getModel( key, graph, persona )
        .then( ( model ) =>
          (graph.properties.metadata ?= {}).model = model
          graph.properties.metadata.private_key = model.getKey()
          return @_saveWithModel( model, key, graph, persona )
        )
        .then( =>
          graph.properties.metadata?.dirty = no
          @graphHash[ key ] = @_getGraphHash( graph )
        )
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
    .fail(
      deferred.reject
    )
    #.fail( deferred.reject )
    return deferred.promise



module.exports = GraphLoader