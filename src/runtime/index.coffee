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
protocols       = require('../protocols')
Q               = require('q')
{ models }      = require('joukou-data')
jwt             = require('jsonwebtoken')
env             = require('../env')
uuid            = require('node-uuid')
pjson           = require('../../package.json')
ComponentLoader = require( '../protocols/component/loader' )

class RuntimeContext
  socket: no
  authorized: no
  user: null
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
    'network:persist'
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
    return @componentLoader = new ComponentLoader( @ )

  getProtocols: ->
    @instances ?= {}
    for key of protocols
      if not protocols.hasOwnProperty( key )
        continue
      if @instances[key]
        continue
      protocol = protocols[key]
      @instances[key] = new protocol( )
    return @instances

  getProtocol: ( protocol ) ->
    @instances ?= {}
    if @instances[protocol]
      return @instances[protocol]
    type = protocols[protocol]
    if not type
      return
    return @instances[protocol] = new type( )

  getPersonas: ->
    if not @user
      deferred = Q.defer()
      process.nextTick( ->
        deferred.reject( 'Unauthorized' )
      )
      return deferred.promise
    return models.persona.getForAgent(
      @user.getKey()
    )

  receive: ( protocol, command, payload ) ->
    instance = @getProtocol(protocol)
    reject = ( reason ) ->
      deferred = Q.defer()
      process.nextTick( ->
        deferred.reject( reason )
      )
      return deferred.promise
    if not instance
      return reject( 'Unknown protocol' )

    # Must be authorized before continuing
    if (
      not @authorized and
      not (
        protocol is 'runtime' and
        command is 'getruntime' and
        typeof payload.secret is 'string'
      )
    )
      return reject( 'Unauthorized' )
    return instance.receive( command, payload, @ )

  send: ->
    throw new Error( "Not Implemented" )

  sendAll: ->
    throw new Error( "Not Implemented" )

module.exports = RuntimeContext