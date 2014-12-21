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
BaseTransport       = require( '../base' )
MessageSchema       = require( '../../message/schema' )
RuntimeContext      = require( '../../runtime' )
{ authenticate }    = require( '../../authentication' )
DocumentationClient = require( './documentation' )
PayloadClient       = require( './payload' )
_                   = require( 'lodash' )

class ApiTransport extends BaseTransport
  constructor: ( @server, @routePrefix = '' ) ->

    @documentation = new DocumentationClient(
      @server,
      @
    )
    @payload = new PayloadClient(
      @server,
      @
    )

    @registerRoutes( )

  getRoutes: ->
    res = {}
    for key of @server.router.routes
      if not @server.router.routes.hasOwnProperty( key )
        continue
      k = [ ]
      for val in @server.router.routes[ key ]
        k.push( val.spec.path )
      res[ key ] = k
    return res

  registerRoutes: ->
    protocols = new RuntimeContext().getProtocols()
    prefix = "#{@routePrefix}/protocols"
    for key of protocols
      if not protocols.hasOwnProperty( key )
        continue
      @registerProtocolRoutes( prefix, key, protocols[key] )

  registerProtocolRoutes: ( prefix, key, protocol ) ->
    for command in protocol.getCommandKeys()
      @registerCommandRoutes( prefix, key, protocol, command )

  registerCommandRoutes: ( prefix, key, protocol, command ) ->
    if not protocol
      return
    commandHandler = protocol.getHandler( command )

    if not commandHandler
      return

    if typeof commandHandler.route isnt 'string'
      return

    methods = [ ]
    if commandHandler.methods
      methods = commandHandler.methods

    map = {
      'POST': @server.post
      'GET': @server.get
      'PUT': @server.put
      'DELETE': @server.del
    }

    doAuth = yes
    if commandHandler.authentication is false
      doAuth = false

    anyHandlers = no

    addHandler = ( method ) =>
      if typeof method isnt 'string'
        retun
      handler = map[ method.toUpperCase() ]
      if not handler
        return

      args = [
        "#{prefix}/#{key}/#{commandHandler.route}"
      ]

      if doAuth
        args.push( authenticate )

      args.push( @route( key, command ) )

      handler.apply( @server, args )

      anyHandlers = yes

    for method in methods
      addHandler( method )

    if not anyHandlers
      addHandler( 'POST' )
      addHandler( 'GET' )


  route: ( key, command ) ->
    return ( req, res, next ) ->

      context = new RuntimeContext()

      context.user = req.user
      context.authorized = yes
      protocol = context.getProtocol( key )

      payload = _.cloneDeep(
        req.body or {}
      )

      _.assign( payload, req.params or {} )

      promise = null
      try
        promise = protocol.receive(
          command,
          payload,
          context
        )
      catch err
        return next( err )

      promise
      .then( ( payload ) ->
        res.send(
          200,
          if payload? then payload else req.body
        )
      )
      .fail( ( err ) ->
        next( err or 'Failed to process request' )
      )


module.exports = ApiTransport




