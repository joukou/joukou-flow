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
protocols       = require( '../protocols' )
Q               = require( 'q' )
{ models }      = require( 'joukou-data' )
jwt             = require( 'jsonwebtoken' )
env             = require( '../env' )
uuid            = require( 'node-uuid' )
pjson           = require( '../../package.json' )
ComponentLoader = require( '../protocols/component/loader' )
GraphLoader     = require( '../protocols/graph/loader' )
authentication  = require( '../authentication' )
_               = require( 'lodash' )

class RuntimeContext
  socket: no
  authorized: no
  persona: null
  user: null
  secret: null
  context: null
  type: 'joukou-flow'
  version: pjson.version
  capabilities: [
    'protocol:runtime'
    'protocol:graph'
    'protocol:component'
    'protocol:network'
    #'component:setsource'
    #'component:getsource'
    #'network:persist'
  ]
  id: uuid.v4()
  label: 'Joukou Flow'
  graph: null

  options: null

  ###*
  @constructor RuntimeContext
  ###
  constructor: ( @options = {} ) ->

  getComponentLoader: ->
    return @componentLoader ?= new ComponentLoader( @ )

  getGraphLoader: ->
    return @graphLoader ?= new GraphLoader( @ )

  getProtocols: ->
    @instances ?= {}
    for key of protocols
      if not protocols.hasOwnProperty( key )
        continue
      if @instances[key]
        continue
      protocol = protocols[key]
      @instances[key] = new protocol( @ )
    return @instances

  getProtocol: ( protocol ) ->
    @instances ?= {}
    if @instances[ protocol ]
      return @instances[ protocol ]
    type = protocols[ protocol ]
    if not type
      return
    return @instances[ protocol ] = new type( @ )

  getPersona: ->
    if @persona
      return @persona
    return @getPersonaKey()
    .then( ( persona_key ) =>
      for persona in @personas?
        if persona.getKey( ) is persona_key
          return persona
      return models.persona.retrieve( persona_key )
    )

  getPersonaKey: ( useSecret ) ->
    if @persona_key
      return Q.resolve(
        @persona_key
      )
    if @secret and useSecret isnt false
      return authentication.bearer.decode( @secret )
      .then( ( decoded ) =>
        if not decoded?.persona_key
          return @getPersonaKey( false )
        return @persona_key = decoded.persona_key
      )
    @getPersonaKeys()
    .then( ( personas ) =>
      persona = personas[ 0 ]
      if not persona
        return deferred.reject(
          'No personas'
        )
      return @persona_key = persona
    )

  getPersonaKeys: ->
    if @persona_keys
      return Q.resolve( @persona_keys )
    return @getPersonas()
    .then( ( personas ) =>
      return @persona_keys = _.map( personas, ( persona ) ->
        return persona.getKey( )
      )
    )

  getPersonas: ->
    if not @user
      return Q.reject( 'Unauthorized' )
    if @personas
      return Q.resolve( @personas )
    return models.persona.getForAgent(
      @user.getKey()
    ).then( ( personas ) =>
      return @personas = personas
    )

  receive: ( protocol, command, payload ) ->
    instance = @getProtocol(protocol)
    if not instance
      return Q.reject( 'Unknown protocol' )

    # Must be authorized before continuing
    if (
      not @authorized and
      not (
        protocol is 'runtime' and
        command is 'getruntime' and
        typeof payload.secret is 'string'
      )
    )
      return Q.reject( 'Unauthorized' )
    return instance.receive( command, payload, @ )

  send: ->
    throw new Error( "Not Implemented" )

  sendAll: ->
    throw new Error( "Not Implemented" )

module.exports = RuntimeContext