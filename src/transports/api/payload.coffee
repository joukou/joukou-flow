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
authentication = require( '../../authentication' )
RuntimeContext = require( '../../runtime' )
ApiClient      = require( './client' )

class PayloadClient
  constructor: ( @server, @api ) ->

    @registerRoutes( )

  registerRoutes: ->

    @server.put(
      "#{@api.routePrefix}/payload/authenticated",
      authentication.authenticate,
      @runPayload
    )

    @server.put(
      "#{@api.routePrefix}/payload/",
      @runPayload
    )


  runPayload: ( req, res, next ) ->
    context = new RuntimeContext( )

    new ApiClient(
      req,
      res,
      next,
      @api,
      context
    )

module.exports = PayloadClient