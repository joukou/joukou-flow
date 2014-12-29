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
BaseClient = require( '../base/client' )
MessageSchema = require( '../../message/schema' )

class ApiClient extends BaseClient

  constructor: ( @req, @res, @next, @api, @context ) ->

    @payloads = req.body?.payloads or []
    @results = []

    # If no user the runtime requires the user to authenticate
    # using protocols.runtime.getRuntime.secret
    if req.user
      context.user = req.user
      context.authorized = yes


  runPayloads: ->
    if not @payloads.length
      return @res.send(
        400,
        {
          payloads: []
          error: 'No payloads found'
        }
      )

    @index = -1

    # Run all payloads in sync
    next = =>
      @index += 1
      payload = @payloads[ @index ]

      if not payload
        return @complete( )

      if not MessageSchema.validate( payload )
        @results[ @index ] = {
          success: false
          error: 'Payload not valid'
          payload: null
          requestPayload: payload
          run: false
        }
        return @complete( )

      promise = context.receive(
        payload
      )

      promise
      .then( ( resultPayload ) =>

        resultPayload = @api.resolveCommandResponse( resultPayload )

        @results[ @index ] = {
          success: true
          error: null
          payload: resultPayload
          requestPayload: payload
          run: true
        }
        next( )
      )
      .fail( ( err ) =>
        @results[ @index ] = {
          success: false
          error: err
          payload: null
          requestPayload: payload
          run: true
        }
        @complete( )
      )


    next( )

  complete: ->

    response = {
      result: []
      payloads: []
      success: false
    }

    @completedUpTo = -1

    for result, index in @results
      response.result.push(
        result
      )
      if result.success
        @completedUpTo = index
        response.payload.push(
          result.payload
        )

    response.success = @completedUpTo is @payloads.length

    if not response.success
      i = @completedUpTo
      while i < @payloads.length
        if @results[ i ]
          i++
          continue
        response.result.push({
          success: false,
          error: null,
          payload: null,
          requestPayload: @payloads[ i ]
          run: false
        })
        i++













module.exports = ApiClient